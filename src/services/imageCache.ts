import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDocFromServer } from 'firebase/firestore';
import { database } from './firebase';
import { JPEG_DATA_PREFIX, validateImage } from '../domain/images';

// Cache five viewed images per account, separately from the planner snapshot.
let cacheWrites: Promise<void> = Promise.resolve();
const inFlight = new Map<string, Promise<string>>();
export async function loadStudyImage(uid: string, imageId: string, online: boolean): Promise<string> {
  const key = `studymate:image:${uid}:${imageId}`;
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) { validateImage(cached); return JPEG_DATA_PREFIX + cached; }
  } catch { /* A failed cache must not prevent an online read. */ }
  if (!online) throw new Error('This photo is not downloaded on this device. Open it once while online to keep an offline copy.');
  const existing = inFlight.get(key);
  if (existing) return existing;
  const request = (async () => {
    const snapshot = await getDocFromServer(doc(database, 'users', uid, 'images', imageId));
    if (!snapshot.exists()) throw new Error('This photo is not available in your account. Sync your planner and try again.');
    const data = snapshot.data();
    if (data.mimeType !== 'image/jpeg' || typeof data.base64 !== 'string') throw new Error('The saved photo format is invalid.');
    validateImage(data.base64);
    const write = cacheWrites.then(async () => {
      const indexKey = `studymate:images:${uid}`;
      const previous: string[] = JSON.parse(await AsyncStorage.getItem(indexKey) ?? '[]');
      const ids = [imageId, ...previous.filter(id => id !== imageId)];
      // Evict first to avoid briefly exceeding the browser's quota.
      await Promise.all(ids.slice(5).map(id => AsyncStorage.removeItem(`studymate:image:${uid}:${id}`)));
      await AsyncStorage.setItem(key, data.base64);
      await AsyncStorage.setItem(indexKey, JSON.stringify(ids.slice(0, 5)));
    });
    cacheWrites = write.catch(() => undefined);
    await cacheWrites;
    return JPEG_DATA_PREFIX + data.base64;
  })();
  inFlight.set(key, request);
  try { return await request; } finally { inFlight.delete(key); }
}
