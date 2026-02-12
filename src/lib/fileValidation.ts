export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const validateFile = (file: File): FileValidationResult => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large (max 5MB).' };
  }

  // Check file extension matches MIME type
  const ext = file.name.split('.').pop()?.toLowerCase();
  const mimeToExt: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf'],
  };

  const validExts = mimeToExt[file.type] || [];
  if (!ext || !validExts.includes(ext)) {
    return { valid: false, error: 'File extension mismatch.' };
  }

  return { valid: true };
};
