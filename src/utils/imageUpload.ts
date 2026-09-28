import { api } from '../services/api';

export interface ProcessedImage {
  url: string;
  fileName: string;
  sizeKB: number;
  isServerUrl: boolean;
}

/**
 * Handles image file validation, server upload attempt, and canvas compression (max 10MB).
 * Ensures uploaded images can be safely saved to the database without crashing
 * due to HTTP 413 Payload Too Large or SQL column size limits.
 */
export async function processImageFile(file: File, maxSizeMB = 10): Promise<ProcessedImage> {
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`File size (${sizeInMB}MB) exceeds the maximum allowed ${maxSizeMB}MB limit.`);
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file (JPEG, PNG, WebP, etc.).');
  }

  // 1. Try server upload endpoint if backend supports file uploads
  try {
    const uploadRes = await api.uploadImage(file);
    if (uploadRes?.url) {
      return {
        url: uploadRes.url,
        fileName: file.name,
        sizeKB: Math.round(file.size / 1024),
        isServerUrl: true,
      };
    }
  } catch {
    // Backend doesn't have an upload endpoint or returned 404, fallback to client-side optimization
  }

  // 2. Client-side canvas compression for safe, fast DB storage
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file from disk.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image data.'));
      img.onload = () => {
        const MAX_DIMENSION = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const fallbackData = event.target?.result as string;
          return resolve({
            url: fallbackData,
            fileName: file.name,
            sizeKB: Math.round(file.size / 1024),
            isServerUrl: false,
          });
        }

        ctx.drawImage(img, 0, 0, width, height);

        // High quality compressed JPEG (~80KB - 160KB)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const approxKB = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

        resolve({
          url: compressedDataUrl,
          fileName: file.name,
          sizeKB: approxKB,
          isServerUrl: false,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
