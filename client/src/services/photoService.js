import { api } from './apiClient.js';

export const photoService = {
  async analyzePhoto(tripId, base64Image, mimeType) {
    const data = await api.post('/api/v1/vision/analyze', { tripId, image: base64Image, mimeType });
    return data.guide;
  },
};

// Resize image to a maximum dimension suitable for landmark recognition
// Returns a compressed JPEG data URL (without data: prefix)
export async function compressImageForAnalysis(file, maxDimension = 1024, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG (better compression than PNG for photos)
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, mimeType: 'image/jpeg', width, height });
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function validateImageFile(file) {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Please select a JPEG, PNG, or WebP image.';
  }

  if (file.size > MAX_SIZE) {
    return 'Image is too large. Maximum size is 10 MB.';
  }

  return null;
}