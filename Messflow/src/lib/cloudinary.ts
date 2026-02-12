// Cloudinary upload utility for Mess Manager Pro
// Uses unsigned upload preset for client-side uploads
// 
// These secrets are available as environment variables in Edge Functions
// For client-side, we need to fetch them from a secure endpoint or use VITE_ prefixed vars

// For client-side uploads, Cloudinary cloud name and unsigned upload preset are safe to expose
// They don't provide write access without the preset being configured correctly
const getCloudinaryConfig = () => {
  // Try VITE_ prefixed first (for local dev and client-side)
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';
  
  return { cloudName, uploadPreset };
};

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  maxWidth?: number;
  maxHeight?: number;
}

/**
 * Upload a file to Cloudinary
 * @param file - The file to upload
 * @param options - Upload options (folder, transformations)
 * @returns The Cloudinary upload result with secure_url
 */
export async function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary credentials not configured. Please add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to your environment.');
  }

  const { folder = 'mess-manager', maxWidth = 1200, maxHeight = 1200 } = options;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);
  
  // Apply transformations for optimization (Cloudinary format: w_1200,h_1200,c_limit,q_auto,f_auto)
  const transformation = `w_${maxWidth},h_${maxHeight},c_limit,q_auto,f_auto`;
  formData.append('transformation', transformation);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload image to Cloudinary');
  }

  return response.json();
}

/**
 * Upload a receipt image to Cloudinary
 * @param file - The receipt image file
 * @returns The secure URL of the uploaded image
 */
export async function uploadReceipt(file: File): Promise<string> {
  const result = await uploadToCloudinary(file, {
    folder: 'mess-manager/receipts',
    maxWidth: 1200,
    maxHeight: 1600,
  });
  return result.secure_url;
}

/**
 * Upload a company logo to Cloudinary
 * @param file - The logo image file
 * @returns The secure URL of the uploaded logo
 */
export async function uploadCompanyLogo(file: File): Promise<string> {
  const result = await uploadToCloudinary(file, {
    folder: 'mess-manager/logos',
    maxWidth: 400,
    maxHeight: 400,
  });
  return result.secure_url;
}

/**
 * Upload a staff/member avatar to Cloudinary
 * @param file - The avatar image file
 * @returns The secure URL of the uploaded avatar
 */
export async function uploadAvatar(file: File): Promise<string> {
  const result = await uploadToCloudinary(file, {
    folder: 'mess-manager/avatars',
    maxWidth: 200,
    maxHeight: 200,
  });
  return result.secure_url;
}

/**
 * Delete an image from Cloudinary (requires signed request - for backend use)
 * Note: For client-side deletion, you'll need a backend endpoint
 */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Get everything after 'upload/v{version}/'
    const relevantParts = pathParts.slice(uploadIndex + 2);
    const publicId = relevantParts.join('/').replace(/\.[^/.]+$/, ''); // Remove extension
    return publicId;
  } catch {
    return null;
  }
}
