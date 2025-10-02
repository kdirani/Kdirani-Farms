'use server';

import { createClient } from '@/lib/supabase/server';

export type UploadResult = {
  success: boolean;
  error?: string;
  fileUrl?: string;
  filePath?: string;
};

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param folder - The folder path in the bucket (e.g., 'manufacturing', 'daily-reports', 'invoices/buy')
 * @param fileName - Optional custom file name (will generate unique name if not provided)
 * @returns Upload result with file URL
 */
export async function uploadFileToStorage(
  file: File,
  folder: string,
  fileName?: string
): Promise<UploadResult> {
  try {
    const supabase = await createClient();

    // Generate unique file name if not provided
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const finalFileName = fileName || `${timestamp}_${randomString}.${fileExt}`;
    
    // Construct full path
    const filePath = `${folder}/${finalFileName}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('files')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('files')
      .getPublicUrl(filePath);

    return {
      success: true,
      fileUrl: urlData.publicUrl,
      filePath: filePath,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    };
  }
}

/**
 * Delete a file from Supabase Storage
 * @param filePath - The full path to the file in the bucket
 * @returns Success status
 */
export async function deleteFileFromStorage(filePath: string): Promise<UploadResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.storage
      .from('files')
      .remove([filePath]);

    if (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file',
    };
  }
}

/**
 * Delete multiple files from Supabase Storage
 * @param filePaths - Array of file paths to delete
 * @returns Success status
 */
export async function deleteMultipleFilesFromStorage(
  filePaths: string[]
): Promise<UploadResult> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.storage
      .from('files')
      .remove(filePaths);

    if (error) {
      console.error('Storage batch delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Batch delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete files',
    };
  }
}

/**
 * Get file path from full URL
 * @param fileUrl - The full public URL
 * @returns The file path relative to bucket
 */
export async function getFilePathFromUrl(fileUrl: string): Promise<string> {
  try {
    const url = new URL(fileUrl);
    // Extract path after '/storage/v1/object/public/files/'
    const pathParts = url.pathname.split('/files/');
    return pathParts[1] || '';
  } catch (error) {
    return '';
  }
}
