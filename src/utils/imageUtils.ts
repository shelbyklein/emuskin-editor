// Utility functions for image handling

/**
 * Convert a File or Blob to a data URL
 */
export async function fileToDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a data URL to a Blob
 */
export async function dataURLToBlob(dataURL: string): Promise<Blob> {
  const response = await fetch(dataURL);
  return response.blob();
}

/**
 * Convert a data URL to a File
 */
export async function dataURLToFile(dataURL: string, filename: string): Promise<File> {
  const blob = await dataURLToBlob(dataURL);
  return new File([blob], filename, { type: blob.type });
}

/**
 * Validate that a string is a valid data URL
 */
export function isValidDataURL(str: string): boolean {
  return str.startsWith('data:') && str.includes(',');
}

/**
 * Get the MIME type from a data URL
 */
export function getDataURLMimeType(dataURL: string): string | null {
  const match = dataURL.match(/^data:([^;]+);/);
  return match ? match[1] : null;
}