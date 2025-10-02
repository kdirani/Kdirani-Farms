'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { uploadFileToStorage, deleteFileFromStorage, getFilePathFromUrl } from '@/lib/supabase/storage';

export type DailyReportAttachment = {
  id: string;
  report_id: string;
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
 * Get daily report attachments
 */
export async function getDailyReportAttachments(
  reportId: string
): Promise<ActionResult<DailyReportAttachment[]>> {
  try {
    const supabase = await createClient();

    const { data: attachments, error } = await supabase
      .from('daily_report_attachments')
      .select('*')
      .eq('report_id', reportId)
      .order('id');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: attachments || [] };
  } catch (error) {
    console.error('Error getting daily report attachments:', error);
    return { success: false, error: 'Failed to get attachments' };
  }
}

/**
 * Upload and create daily report attachment
 */
export async function createDailyReportAttachment(
  reportId: string,
  file: File
): Promise<ActionResult<DailyReportAttachment>> {
  try {
    const supabase = await createClient();

    // Upload file to storage
    const uploadResult = await uploadFileToStorage(file, 'daily-reports');

    if (!uploadResult.success || !uploadResult.fileUrl) {
      return { success: false, error: uploadResult.error || 'Upload failed' };
    }

    // Save attachment record
    const { data: attachment, error } = await supabase
      .from('daily_report_attachments')
      .insert({
        report_id: reportId,
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

    revalidatePath('/admin/daily-reports');
    revalidatePath('/farmer/daily-report');
    return { success: true, data: attachment };
  } catch (error) {
    console.error('Error creating daily report attachment:', error);
    return { success: false, error: 'Failed to create attachment' };
  }
}

/**
 * Delete daily report attachment
 */
export async function deleteDailyReportAttachment(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // Get attachment to get file URL
    const { data: attachment } = await supabase
      .from('daily_report_attachments')
      .select('file_url')
      .eq('id', id)
      .single();

    if (!attachment) {
      return { success: false, error: 'Attachment not found' };
    }

    // Delete from database
    const { error } = await supabase
      .from('daily_report_attachments')
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

    revalidatePath('/admin/daily-reports');
    revalidatePath('/farmer/daily-report');
    return { success: true };
  } catch (error) {
    console.error('Error deleting daily report attachment:', error);
    return { success: false, error: 'Failed to delete attachment' };
  }
}
