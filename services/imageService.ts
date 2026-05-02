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

// Limites de proporção aceitos pela API do Instagram (feed post)
const IG_MIN_RATIO = 1 / 1.91; // ~0.524 — mais largo que isso = landscape demais
const IG_MAX_RATIO = 4 / 5;    // 0.8   — mais estreito que isso = portrait demais
const IG_TARGET_W  = 1080;
const IG_TARGET_H  = 1350;     // 4:5 — formato ideal para feed (maior área)

/**
 * Recebe qualquer URL (data: ou https:) e retorna um dataURL com proporção
 * 4:5 (1080x1350) usando crop centralizado, somente se a proporção original
 * estiver fora dos limites aceitos pela Graph API do Instagram.
 */
export const normalizeForInstagram = async (src: string): Promise<string> => {
  // Para URLs remotas (Firebase Storage), converte para data: primeiro
  let dataUrl = src;
  if (src.startsWith('http')) {
    const res  = await fetch(src);
    const blob = await res.blob();
    dataUrl = await new Promise<string>((res2) => {
      const reader = new FileReader();
      reader.onloadend = () => res2(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const srcRatio = img.width / img.height;

      // Já dentro dos limites — devolve o dataUrl original sem alterar
      if (srcRatio >= IG_MIN_RATIO && srcRatio <= IG_MAX_RATIO) {
        resolve(dataUrl);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width  = IG_TARGET_W;
      canvas.height = IG_TARGET_H;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, IG_TARGET_W, IG_TARGET_H);

      // Cover: escala para preencher o canvas e centraliza (crop)
      const scale = Math.max(IG_TARGET_W / img.width, IG_TARGET_H / img.height);
      const sw = img.width  * scale;
      const sh = img.height * scale;
      const dx = (IG_TARGET_W - sw) / 2;
      const dy = (IG_TARGET_H - sh) / 2;

      ctx.drawImage(img, dx, dy, sw, sh);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

/**
 * Normaliza todas as imagens de um post para Instagram e re-faz upload
 * das que precisaram ser alteradas. Retorna as URLs finais prontas para a API.
 */
export const prepareImagesForInstagram = async (imageUrls: string[]): Promise<string[]> => {
  const result: string[] = [];
  for (const url of imageUrls) {
    const normalizedDataUrl = await normalizeForInstagram(url);
    // Se a imagem não mudou (já estava na proporção certa), usa a URL original
    if (normalizedDataUrl === url) {
      result.push(url);
      continue;
    }
    // Precisou ser recortada — re-faz upload com a versão normalizada
    const res  = await fetch(normalizedDataUrl);
    const blob = await res.blob();
    const file = new File([blob], `ig-normalized-${Date.now()}.jpg`, { type: 'image/jpeg' });
    const newUrl = await uploadImage(file);
    result.push(newUrl);
  }
  return result;
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
  normalizeForInstagram,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
};