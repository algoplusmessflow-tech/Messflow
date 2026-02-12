// Secure file validation utility

export const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
} as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file type, size, and extension
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export const validateFile = (file: File): FileValidationResult => {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `File too large (max ${sizeMB}MB)` };
  }

  // Check MIME type
  if (!(file.type in ALLOWED_FILE_TYPES)) {
    return { 
      valid: false, 
      error: 'Invalid file type. Allowed: JPEG, PNG, WebP, PDF' 
    };
  }

  // Check file extension matches MIME type
  const ext = file.name.split('.').pop()?.toLowerCase();
  const validExts = ALLOWED_FILE_TYPES[file.type as keyof typeof ALLOWED_FILE_TYPES] || [];
  
  if (!ext || !validExts.includes(ext)) {
    return { 
      valid: false, 
      error: 'File extension does not match file type' 
    };
  }

  // Additional security: Check for null bytes in filename
  if (file.name.includes('\0')) {
    return { valid: false, error: 'Invalid filename' };
  }

  // Check filename length
  if (file.name.length > 255) {
    return { valid: false, error: 'Filename too long (max 255 characters)' };
  }

  return { valid: true };
};

/**
 * Sanitizes filename by removing dangerous characters
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Remove dangerous characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .slice(0, 255); // Limit length
};

/**
 * Generates a unique filename with timestamp
 * @param originalFilename - Original filename
 * @returns Unique filename with timestamp
 */
export const generateUniqueFilename = (originalFilename: string): string => {
  const sanitized = sanitizeFilename(originalFilename);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = sanitized.split('.').pop();
  const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'));
  
  return `${nameWithoutExt}_${timestamp}_${random}.${ext}`;
};
