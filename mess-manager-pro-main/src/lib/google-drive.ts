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
 * Upload a file to Google Drive via Supabase Edge Function
 * @param file - The file to upload
 * @param options - Upload options (folder, filename)
 * @returns The Google Drive upload result with public URL
 */
export async function uploadToGoogleDrive(
  file: File,
  options: GoogleDriveUploadOptions = {}
): Promise<GoogleDriveUploadResult> {
  const { folder = 'mess-manager', filename } = options;

  // Get the Supabase Edge Function URL
  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-to-drive`;

  // Get the current user's auth token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error('Authentication required');
  }

  // Create FormData for the file upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  if (filename) {
    formData.append('filename', filename);
  }

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload file to Google Drive');
  }

  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Upload failed');
  }

  return result.data;
}

/**
 * Upload a receipt image to Google Drive
 * @param file - The receipt image file
 * @returns The public URL of the uploaded image
 */
export async function uploadReceipt(file: File): Promise<string> {
  const result = await uploadToGoogleDrive(file, {
    folder: 'mess-manager/receipts',
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
    folder: 'mess-manager/logos',
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
    folder: 'mess-manager/avatars',
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