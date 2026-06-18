import * as admin from 'firebase-admin';

let initialized = false;

export function initAdmin(serviceAccount?: Record<string, any>) {
  if (initialized) return admin;

  // Avoid TS type mismatches across firebase-admin versions.
  const anyAdmin = admin as any;

  if (serviceAccount) {
    anyAdmin.initializeApp({
      credential: anyAdmin.credential.cert(serviceAccount)
    });
  } else {
    anyAdmin.initializeApp();
  }

  initialized = true;
  return admin;
}

export function getAuth() {
  if (!initialized) initAdmin();
  const anyAdmin = admin as any;
  return anyAdmin.auth();
}
