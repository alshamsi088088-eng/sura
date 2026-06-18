import admin from '-admin';

let initialized = false;

export function initAdmin(serviceAccount?: Record<string, any>) {
  if (initialized) return admin;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    admin.initializeApp();
  }

  initialized = true;
  return admin;
}

export function getAuth() {
  if (!initialized) initAdmin();
  return admin.auth();
}
