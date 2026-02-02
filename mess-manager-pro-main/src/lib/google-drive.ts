import { supabase } from '@/integrations/supabase/client';

export interface GoogleDriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface GoogleDriveUploadOptions {
  folder?: string;
  filename?: string;
}

/**
 * Check if the current device is mobile
 */
export function isMobile(): boolean {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Upload a file to Google Drive via Supabase Edge Function
 * @param file - The file to upload
 * @param options - Upload options (folder, filename)
 * @returns The Google Drive upload result with public URL
 */
export async function uploadToGoogleDrive(
  file: File,
  options: GoogleDriveUploadOptions = {}
): Promise<GoogleDriveUploadResult> {
  const { folder = 'receipts', filename } = options;

  // Get the current user's auth session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // Create FormData for the file upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  if (filename) {
    formData.append('filename', filename);
  }

  // Use supabase.functions.invoke instead of manual fetch
  const { data, error } = await supabase.functions.invoke('upload-to-drive', {
    body: formData,
  });

  if (error || !data?.success) {
    throw new Error(data?.error ?? error.message);
  }

  return data.data;
}

/**
 * Upload a receipt image to Google Drive
 * @param file - The receipt image file
 * @returns The public URL of the uploaded image
 */
export async function uploadReceipt(file: File): Promise<string> {
  const result = await uploadToGoogleDrive(file, {
    folder: 'receipts',
  });
  return result.url;
}

/**
 * Upload a company logo to Google Drive
 * @param file - The logo image file
 * @returns The public URL of the uploaded logo
 */
export async function uploadCompanyLogo(file: File): Promise<string> {
  const result = await uploadToGoogleDrive(file, {
    folder: 'logos',
  });
  return result.url;
}

/**
 * Upload a staff/member avatar to Google Drive
 * @param file - The avatar image file
 * @returns The public URL of the uploaded avatar
 */
export async function uploadAvatar(file: File): Promise<string> {
  const result = await uploadToGoogleDrive(file, {
    folder: 'avatars',
  });
  return result.url;
}

/**
 * Delete a file from Google Drive (requires backend implementation)
 * Note: For now, this would need to be implemented as a separate Edge Function
 * or handled through the Google Drive UI
 */
export function getGoogleDriveFileIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const fileId = pathParts[pathParts.length - 1];
    return fileId || null;
  } catch {
    return null;
  }
}
