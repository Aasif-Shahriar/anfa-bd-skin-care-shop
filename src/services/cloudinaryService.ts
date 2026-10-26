import { auth } from '../lib/firebase';

const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
];

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file size (max 5MB) and mime type
 */
export function validateImageFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'The selected image file is empty (0 bytes). Please select a valid photo.',
    };
  }

  const fileType = file.type?.toLowerCase() || '';
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';

  const isMimeValid = ACCEPTED_IMAGE_TYPES.includes(fileType);
  const isExtValid = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(fileExt);

  if (!isMimeValid && !isExtValid) {
    return {
      valid: false,
      error: `Unsupported file format (${file.type || fileExt}). Please upload a JPG, PNG, WebP, AVIF, or GIF image.`,
    };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeInMb} MB). Maximum allowed image size is 5 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Retrieves the current Firebase user ID token to authenticate admin requests on the server.
 */
async function getAdminAuthToken(): Promise<string> {
  let currentUser = auth.currentUser;
  if (!currentUser) {
    // Wait briefly for auth state to finish restoring from localStorage
    await new Promise((r) => setTimeout(r, 600));
    currentUser = auth.currentUser;
  }

  if (!currentUser) {
    throw new Error('Authentication required: You must be signed in as an administrator to upload product images.');
  }
  return await currentUser.getIdToken();
}

/**
 * Uploads an individual product image to Cloudinary via the Express backend route.
 * Emits live progress updates from 0 to 100%.
 */
export function uploadProductImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> {
  return new Promise(async (resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return reject(new Error(validation.error || 'Invalid image file.'));
    }

    try {
      const token = await getAdminAuthToken();
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/cloudinary/upload', true);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        let isJson = false;
        let jsonRes: any = null;
        try {
          jsonRes = JSON.parse(xhr.responseText);
          isJson = true;
        } catch {
          isJson = false;
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          if (isJson && jsonRes?.success && jsonRes?.image) {
            if (onProgress) onProgress(100);
            resolve(jsonRes.image);
          } else if (isJson && jsonRes?.message) {
            reject(new Error(jsonRes.message));
          } else {
            console.error('Non-JSON response from upload server:', xhr.responseText.substring(0, 300));
            reject(
              new Error(
                'Invalid response received from upload server. Please make sure you are signed in as an administrator (asif.al.azad201m@gmail.com).'
              )
            );
          }
        } else {
          if (isJson && jsonRes?.message) {
            reject(new Error(jsonRes.message));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText || 'Server Error'}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred while uploading image to Cloudinary. Please check your connection.'));
      };

      xhr.onabort = () => {
        reject(new Error('Image upload was cancelled.'));
      };

      xhr.send(formData);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Uploads multiple product images sequentially to Cloudinary with aggregated progress.
 */
export async function uploadMultipleProductImages(
  files: File[],
  onProgress?: (overallPercent: number, currentFileIdx: number, totalFiles: number) => void
): Promise<CloudinaryUploadResult[]> {
  const results: CloudinaryUploadResult[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const itemResult = await uploadProductImage(file, (singlePercent) => {
      if (onProgress) {
        const overall = Math.round(((i + singlePercent / 100) / total) * 100);
        onProgress(overall, i + 1, total);
      }
    });
    results.push(itemResult);
  }

  if (onProgress) {
    onProgress(100, total, total);
  }

  return results;
}

/**
 * Securely deletes an asset from Cloudinary by its public ID via the Express backend.
 */
export async function deleteCloudinaryAsset(publicId: string): Promise<boolean> {
  if (!publicId) return false;

  try {
    const token = await getAdminAuthToken();
    const response = await fetch('/api/admin/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.warn(`Cloudinary asset deletion returned HTTP ${response.status}:`, errData);
      return false;
    }

    return true;
  } catch (error) {
    console.warn(`Failed to delete Cloudinary asset ${publicId}:`, error);
    return false;
  }
}
