'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { uploadFileToStorage, deleteFileFromStorage, getFilePathFromUrl } from '@/lib/supabase/storage';

export type InvoiceAttachment = {
  id: string;
  invoice_id: string;
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
 * Get invoice attachments
 */
export async function getInvoiceAttachments(
  invoiceId: string
): Promise<ActionResult<InvoiceAttachment[]>> {
  try {
    const supabase = await createClient();

    const { data: attachments, error } = await supabase
      .from('invoice_attachments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('id');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: attachments || [] };
  } catch (error) {
    console.error('Error getting invoice attachments:', error);
    return { success: false, error: 'Failed to get attachments' };
  }
}

/**
 * Upload and create invoice attachment
 */
export async function createInvoiceAttachment(
  invoiceId: string,
  file: File,
  invoiceType: 'buy' | 'sell'
): Promise<ActionResult<InvoiceAttachment>> {
  try {
    const supabase = await createClient();

    // Determine folder based on invoice type
    const folder = invoiceType === 'buy' ? 'invoices/buy' : 'invoices/sell';

    // Upload file to storage
    const uploadResult = await uploadFileToStorage(file, folder);

    if (!uploadResult.success || !uploadResult.fileUrl) {
      return { success: false, error: uploadResult.error || 'Upload failed' };
    }

    // Save attachment record
    const { data: attachment, error } = await supabase
      .from('invoice_attachments')
      .insert({
        invoice_id: invoiceId,
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

    revalidatePath('/admin/invoices');
    return { success: true, data: attachment };
  } catch (error) {
    console.error('Error creating invoice attachment:', error);
    return { success: false, error: 'Failed to create attachment' };
  }
}

/**
 * Delete invoice attachment
 */
export async function deleteInvoiceAttachment(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Get attachment to get file URL
    const { data: attachment } = await supabase
      .from('invoice_attachments')
      .select('file_url')
      .eq('id', id)
      .single();

    if (!attachment) {
      return { success: false, error: 'Attachment not found' };
    }

    // Delete from database
    const { error } = await supabase
      .from('invoice_attachments')
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

    revalidatePath('/admin/invoices');
    return { success: true };
  } catch (error) {
    console.error('Error deleting invoice attachment:', error);
    return { success: false, error: 'Failed to delete attachment' };
  }
}
