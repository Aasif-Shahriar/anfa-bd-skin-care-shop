import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export async function uploadImageToStorage(file: File, folder = 'products'): Promise<string> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const filePath = `${folder}/${timestamp}_${sanitizedName}`;

  try {
    const storageRef = ref(storage, filePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Storage upload failed or not enabled, falling back to local object URL:', error);
    // Graceful fallback to FileReader base64 so admin image preview and storage works seamlessly
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file buffer'));
        }
      };
      reader.onerror = () => reject(new Error('Failed reading file'));
      reader.readAsDataURL(file);
    });
  }
}
