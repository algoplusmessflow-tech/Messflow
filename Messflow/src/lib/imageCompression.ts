import imageCompression from 'browser-image-compression';

export async function compressImage(file: File, maxSizeMB: number = 0.5): Promise<File> {
  // Only compress images
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const options = {
    maxSizeMB, // Default 500KB, configurable
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    
    // Convert blob back to File with proper name
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^/.]+$/, '.jpg'),
      { type: 'image/jpeg' }
    );

    console.log(
      `Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`
    );

    return compressedFile;
  } catch (error) {
    console.error('Compression failed, using original:', error);
    return file;
  }
}
