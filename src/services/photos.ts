import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { File, Directory, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';
import { StudyRecord } from '../domain/models';

export async function capturePhoto(camera: boolean, uid: string) {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('Camera access is needed to photograph your notes. Enable it in device settings or choose a photo.');
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true };
  const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const asset = result.assets[0];
  const compressed = await manipulateAsync(asset.uri, [{ resize: { width: Math.min(asset.width, 1280) } }], { compress: 0.65, format: SaveFormat.JPEG, base64: Platform.OS === 'web' });
  if (Platform.OS === 'web') {
    if ((compressed.base64?.length ?? 0) > 2700000) throw new Error('Please choose a smaller photo (under 2 MB).');
    return `data:image/jpeg;base64,${compressed.base64}`;
  }
  const folder = new Directory(Paths.document, 'studymate', uid);
  folder.create({ intermediates: true, idempotent: true });
  const original = new File(compressed.uri);
  if (original.size > 2 * 1024 * 1024) throw new Error('Please choose a smaller photo (under 2 MB).');
  const saved = new File(folder, `${randomUUID()}.jpg`);
  original.copy(saved);
  return saved.uri;
}

export async function uploadRecordPhoto(uid: string, record: StudyRecord): Promise<StudyRecord> {
  if (!record.photoPending || !record.photoUri || record.deleted) return record;
  const path = `users/${uid}/notes/${record.id}-${record.revision}.jpg`;
  const bytes = Platform.OS === 'web'
    ? new Uint8Array(await (await fetch(record.photoUri)).arrayBuffer())
    : await new File(record.photoUri).bytes();
  const target = ref(storage, path);
  await uploadBytes(target, bytes, { contentType: 'image/jpeg' });
  return { ...record, photoURL: await getDownloadURL(target), photoPath: path, photoPending: false };
}
