import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth, initializeAuth, type Persistence } from 'firebase/auth';
import { firebaseApp } from './firebase';

// Metro resolves Firebase's react-native export; its web TypeScript entry omits this helper.
const { getReactNativePersistence } = require('firebase/auth') as {
  getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
};

function nativeAuth() {
  try { return initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) }); }
  catch (error) {
    if ((error as { code?: string }).code === 'auth/already-initialized') return getAuth(firebaseApp);
    throw error;
  }
}
export const auth = nativeAuth();
