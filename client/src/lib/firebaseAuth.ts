import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type Auth,
} from 'firebase/auth';
import { auth, provider } from '../firebaseConfig';

type FirebaseAuthErrorCode =
  | 'auth/invalid-email'
  | 'auth/user-disabled'
  | 'auth/user-not-found'
  | 'auth/wrong-password'
  | 'auth/email-already-in-use'
  | 'auth/weak-password'
  | 'auth/operation-not-allowed'
  | 'auth/network-request-failed'
  | 'auth/too-many-requests'
  | 'auth/popup-closed-by-user'
  | string;

function getErrorMessage(code: FirebaseAuthErrorCode, rawMessage?: string) {
  switch (code) {
    case 'auth/invalid-email':
      return 'The email address is badly formatted.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found for this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account already exists for this email.';
    case 'auth/weak-password':
      return 'Password is too weak.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled for this project.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before completing.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return rawMessage || 'Authentication failed. Please try again.';
  }
}

function normalizeFirebaseError(err: unknown) {
  // Firebase Auth errors are typically objects with `code` and `message`
  const anyErr = err as any;
  const code = (anyErr?.code ?? 'unknown') as FirebaseAuthErrorCode;
  const message = anyErr?.message as string | undefined;

  return new Error(getErrorMessage(code, message));
}

/**
 * Sign up with Email/Password.
 * If `name` is provided, attempts to set displayName on the Firebase user profile.
 */
export async function signUpWithEmailPassword(
  name: string,
  email: string,
  password: string,
  customAuth: Auth = auth
) {
  try {
    const cred = await createUserWithEmailAndPassword(customAuth, email, password);

    if (name?.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }

    return cred;
  } catch (err) {
    throw normalizeFirebaseError(err);
  }
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
  customAuth: Auth = auth
) {
  try {
    console.log('[AuthDebug] signInWithEmailPassword(): start', {
      email,
      passwordLength: password?.length,
      authInitialized: !!customAuth,
      appReady: !!auth,
    });

    const cred = await signInWithEmailAndPassword(customAuth, email, password);

    console.log('[AuthDebug] signInWithEmailPassword(): success', {
      uid: cred.user?.uid,
      email: cred.user?.email,
      displayName: cred.user?.displayName,
    });

    return cred;
  } catch (err) {
    console.error('[AuthDebug] signInWithEmailPassword(): failed', err);
    throw normalizeFirebaseError(err);
  }
}

export async function signInWithGoogle(customAuth: Auth = auth) {
  try {
    console.log('[AuthDebug] signInWithGoogle(): start', {
      authInitialized: !!customAuth,
      appReady: !!auth,
      providerId: (provider as any)?.providerId,
    });

    const result = await signInWithPopup(customAuth, provider);

    console.log('[AuthDebug] signInWithGoogle(): success', {
      uid: result.user?.uid,
      email: result.user?.email,
      displayName: result.user?.displayName,
    });

    return result;
  } catch (err) {
    console.error('[AuthDebug] signInWithGoogle(): failed', err);
    throw normalizeFirebaseError(err);
  }
}

export async function signOutUser(customAuth: Auth = auth) {
  try {
    await signOut(customAuth);
  } catch (err) {
    // Sign-out errors are less common; still provide a clear message.
    throw normalizeFirebaseError(err);
  }
}
