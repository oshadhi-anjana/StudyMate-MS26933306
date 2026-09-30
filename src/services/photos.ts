import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { File, Directory, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import { StudyRecord } from '../domain/models';
import { imageBytes, JPEG_DATA_PREFIX, MAX_IMAGE_BYTES, StudyImage, validateImage } from '../domain/images';

/** Bounded attempts: preserve legibility where possible, then reject oversize images. */
export async function compressPhoto(uri: string, originalWidth = 1280) {
  for (const [width, quality] of [[1280, 0.75], [1024, 0.65], [800, 0.55], [640, 0.45]]) {
    const result = await manipulateAsync(uri, [{ resize: { width: Math.min(originalWidth, width) } }], {
      compress: quality, format: SaveFormat.JPEG, base64: true,
    });
    if (result.base64 && imageBytes(result.base64) <= MAX_IMAGE_BYTES) {
      validateImage(result.base64);
      return { uri: result.uri, base64: result.base64 };
    }
  }
  throw new Error('This photo is too detailed to fit within 200 KB. Crop a smaller area or take a closer photo.');
}

export async function capturePhoto(camera: boolean, uid: string) {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('Camera access is needed to photograph your notes. Enable it in device settings or choose a photo.');
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true };
  const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const asset = result.assets[0];
  const compressed = await compressPhoto(asset.uri, asset.width);
  if (Platform.OS === 'web') {
    return JPEG_DATA_PREFIX + compressed.base64;
  }
  const folder = new Directory(Paths.document, 'studymate', uid);
  folder.create({ intermediates: true, idempotent: true });
  const original = new File(compressed.uri);
  const saved = new File(folder, `${randomUUID()}.jpg`);
  original.copy(saved);
  return saved.uri;
}

export async function prepareRecordPhoto(record: StudyRecord): Promise<{ record: StudyRecord; image?: StudyImage }> {
  if (record.deleted) return { record: { ...record, photoId: '', photoUri: '', photoURL: '', photoPath: '', photoPending: false } };
  if (!record.photoPending) return { record };
  if (!record.photoUri) throw new Error('The pending photo is missing. Please attach it again.');
  let base64: string;
  if (record.photoUri.startsWith(JPEG_DATA_PREFIX)) base64 = record.photoUri.slice(JPEG_DATA_PREFIX.length);
  else if (Platform.OS !== 'web') base64 = await new File(record.photoUri).base64();
  else throw new Error('Please choose this photo again to convert it to JPEG.');
  // Migrate previously queued photos that used the old 2 MB Storage limit.
  if (imageBytes(base64) > MAX_IMAGE_BYTES) {
    base64 = (await compressPhoto(record.photoUri)).base64;
  }
  const bytes = validateImage(base64);
  const photoId = `${record.id}-${record.revision}`;
  return {
    record: { ...record, photoId, photoURL: '', photoPath: '', photoPending: false },
    image: { recordId: record.id, revision: record.revision, mimeType: 'image/jpeg', base64, bytes },
  };
}
