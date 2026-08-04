// Firebase initialization
// Keep all Firebase config isolated in this file

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const sanitizeEnvValue = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();

  // Accept values pasted with surrounding quotes in env providers.
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
};

const firebaseEnv = {
  apiKey: sanitizeEnvValue(import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: sanitizeEnvValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: sanitizeEnvValue(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  messagingSenderId: sanitizeEnvValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitizeEnvValue(import.meta.env.VITE_FIREBASE_APP_ID)
};

const missingEnvKeys = Object.entries(firebaseEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnvKeys.length > 0) {
  throw new Error(
    `Firebase config missing values: ${missingEnvKeys.join(', ')}. ` +
      'Set all required VITE_FIREBASE_* environment variables.'
  );
}

const firebaseConfig = {
  apiKey: firebaseEnv.apiKey,
  authDomain: firebaseEnv.authDomain,
  projectId: firebaseEnv.projectId,
  messagingSenderId: firebaseEnv.messagingSenderId,
  appId: firebaseEnv.appId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
