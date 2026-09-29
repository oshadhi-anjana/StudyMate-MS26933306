import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase client identifiers are public. Access is enforced by the supplied rules.
const config = {
  apiKey: 'AIzaSyA6e5lh3WduLFn6k8r3Gr8RjoSDkhZhDeo',
  authDomain: 'studymate-b077d.firebaseapp.com',
  projectId: 'studymate-b077d',
  storageBucket: 'studymate-b077d.firebasestorage.app',
  messagingSenderId: '124948497644',
  appId: '1:124948497644:web:cfa308e78054efec3411c9',
};
export const firebaseApp = getApps().length ? getApp() : initializeApp(config);
export const database = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
// Web Analytics is deliberately not initialized in a native app.
