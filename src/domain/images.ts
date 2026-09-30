/** 200 KiB of JPEG data becomes at most 273,068 Base64 characters. */
export const MAX_IMAGE_BYTES = 200 * 1024;
export const MAX_BASE64_LENGTH = 4 * Math.ceil(MAX_IMAGE_BYTES / 3);
export const JPEG_DATA_PREFIX = 'data:image/jpeg;base64,';

export function imageBytes(base64: string): number {
  if (!base64 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new Error('The photo could not be encoded. Please choose it again.');
  }
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return base64.length / 4 * 3 - padding;
}

export function validateImage(base64: string): number {
  if (base64.length > MAX_BASE64_LENGTH) throw new Error('The compressed photo must be 200 KB or smaller. Try a closer crop.');
  const bytes = imageBytes(base64);
  if (bytes > MAX_IMAGE_BYTES) throw new Error('The compressed photo must be 200 KB or smaller. Try a closer crop.');
  if (!base64.startsWith('/9j/')) throw new Error('Only JPEG study photos are supported. Please select the photo again.');
  return bytes;
}

export interface StudyImage {
  recordId: string;
  revision: string;
  mimeType: 'image/jpeg';
  base64: string;
  bytes: number;
}
