'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { uploadFileToStorage, deleteFileFromStorage, getFilePathFromUrl } from '@/lib/supabase/storage';

export type MedicineConsumptionAttachment = {
  id: string;
  consumption_invoice_id: string;
  file_url: string;
  file_name: string;
  file_type: string;
};

export type ActionResult<T = void> = {
  success: boolean;
  error?: string;
  data?: T;
};

/**
 * Get medicine consumption attachments
 */
export async function getMedicineConsumptionAttachments(
  invoiceId: string
): Promise<ActionResult<MedicineConsumptionAttachment[]>> {
  try {
    const supabase = await createClient();

    const { data: attachments, error } = await supabase
      .from('medicine_consumption_attachments')
      .select('*')
      .eq('consumption_invoice_id', invoiceId)
      .order('id');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: attachments || [] };
  } catch (error) {
    console.error('Error getting medicine consumption attachments:', error);
    return { success: false, error: 'Failed to get attachments' };
  }
}

/**
 * Upload and create medicine consumption attachment
 */
export async function createMedicineConsumptionAttachment(
  invoiceId: string,
  file: File
): Promise<ActionResult<MedicineConsumptionAttachment>> {
  try {
    const supabase = await createClient();

    // Upload file to storage
    const uploadResult = await uploadFileToStorage(file, 'medicine-consumption');

    if (!uploadResult.success || !uploadResult.fileUrl) {
      return { success: false, error: uploadResult.error || 'Upload failed' };
    }

    // Save attachment record
    const { data: attachment, error } = await supabase
      .from('medicine_consumption_attachments')
      .insert({
        consumption_invoice_id: invoiceId,
        file_url: uploadResult.fileUrl,
        file_name: file.name,
        file_type: file.type,
      })
      .select()
      .single();

    if (error) {
      // Clean up uploaded file if database insert fails
      await deleteFileFromStorage(uploadResult.filePath!);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/medicine-invoices');
    return { success: true, data: attachment };
  } catch (error) {
    console.error('Error creating medicine consumption attachment:', error);
    return { success: false, error: 'Failed to create attachment' };
  }
}

/**
 * Delete medicine consumption attachment
 */
export async function deleteMedicineConsumptionAttachment(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Get attachment to get file URL
    const { data: attachment } = await supabase
      .from('medicine_consumption_attachments')
      .select('file_url')
      .eq('id', id)
      .single();

    if (!attachment) {
      return { success: false, error: 'Attachment not found' };
    }

    // Delete from database
    const { error } = await supabase
      .from('medicine_consumption_attachments')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Delete from storage
    const filePath = await getFilePathFromUrl(attachment.file_url);
    if (filePath) {
      await deleteFileFromStorage(filePath);
    }

    revalidatePath('/admin/medicine-invoices');
    return { success: true };
  } catch (error) {
    console.error('Error deleting medicine consumption attachment:', error);
    return { success: false, error: 'Failed to delete attachment' };
  }
}
