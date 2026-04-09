import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase.config';

const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_QUALITY = 0.82;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

export const compressImage = async (
  file: File,
  maxWidth: number = DEFAULT_MAX_WIDTH,
): Promise<File> => {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(imageUrl);
    const scale = Math.min(1, maxWidth / image.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);

    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', DEFAULT_QUALITY);
    });

    if (!blob) {
      return file;
    }

    const filename = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], filename, { type: 'image/jpeg', lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
};

const buildStoragePath = (fileName: string) => {
  const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `posts/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${cleanName}`;
};

export const uploadImage = async (file: File, path?: string): Promise<string> => {
  const optimizedFile = await compressImage(file);
  const storageRef = ref(storage, path ?? buildStoragePath(optimizedFile.name));
  await uploadBytes(storageRef, optimizedFile, {
    contentType: optimizedFile.type,
  });
  return getDownloadURL(storageRef);
};

export const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
  const uploads = files.map((file) => uploadImage(file));
  return Promise.all(uploads);
};

export const deleteImage = async (url: string): Promise<void> => {
  const imageRef = ref(storage, url);
  await deleteObject(imageRef);
};

export const imageService = {
  compressImage,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
};