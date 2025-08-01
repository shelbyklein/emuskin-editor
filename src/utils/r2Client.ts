/**
 * Cloudflare R2 client utilities for image storage
 */

const R2_WORKER_URL = import.meta.env.VITE_R2_WORKER_URL || 'http://localhost:8787';
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL || 'https://pub-auto.r2.dev';

interface UploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  uploadId: string;
  expires: string;
}

interface UploadResult {
  success: boolean;
  publicUrl: string;
  key: string;
}

interface ImageListResponse {
  images: Array<{
    key: string;
    size: number;
    uploaded: string;
    publicUrl: string;
    metadata?: Record<string, string>;
  }>;
}

/**
 * Request a presigned URL for uploading an image
 */
export async function requestUploadUrl(
  projectId: string,
  fileName: string,
  fileType: string,
  imageType: 'background' | 'thumbstick' = 'background',
  orientation: 'portrait' | 'landscape' = 'portrait'
): Promise<UploadUrlResponse> {
  const response = await fetch(`${R2_WORKER_URL}/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      projectId,
      fileName,
      fileType,
      imageType,
      orientation,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get upload URL');
  }

  return response.json();
}

/**
 * Upload a file to R2 using the presigned URL
 */
export async function uploadToR2(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          resolve(result);
        } catch (error) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Complete image upload process
 */
export async function uploadImage(
  projectId: string,
  file: File,
  imageType: 'background' | 'thumbstick' = 'background',
  orientation: 'portrait' | 'landscape' = 'portrait',
  onProgress?: (progress: number) => void
): Promise<{ publicUrl: string; key: string }> {
  try {
    // Step 1: Get upload URL
    const { uploadUrl, publicUrl, key } = await requestUploadUrl(
      projectId,
      file.name,
      file.type,
      imageType,
      orientation
    );

    // Step 2: Upload file
    await uploadToR2(uploadUrl, file, onProgress);

    return { publicUrl, key };
  } catch (error) {
    console.error('Failed to upload image:', error);
    throw error;
  }
}

/**
 * Delete an image from R2
 */
export async function deleteImage(key: string): Promise<void> {
  const response = await fetch(`${R2_WORKER_URL}/delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete image');
  }
}

/**
 * List all images for a project
 */
export async function listProjectImages(projectId: string): Promise<ImageListResponse> {
  const response = await fetch(`${R2_WORKER_URL}/list?projectId=${projectId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to list images');
  }

  return response.json();
}

/**
 * Get the public URL for an image key
 */
export function getPublicUrl(key: string): string {
  // If it's already a full URL, return as is
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return key;
  }
  
  // Otherwise, construct the public URL
  return `${R2_PUBLIC_URL}/${key}`;
}

/**
 * Check if R2 storage is enabled
 */
export function isR2Enabled(): boolean {
  return !!import.meta.env.VITE_USE_R2_STORAGE && 
         import.meta.env.VITE_USE_R2_STORAGE !== 'false';
}