// lib/errorHandling.ts
import { FirebaseError } from "firebase/app"

const firebaseErrorMessages: Record<string, string> = {
  // Authentication Errors
  'auth/invalid-email': 'Invalid email address. Please enter a valid email.',
  'auth/user-not-found': 'User not found. Please check the email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/email-already-in-use': 'Email already in use. Please try another email.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/operation-not-allowed': 'Operation not allowed. Please try again later.',
  'auth/invalid-verification-code': 'Invalid verification code. Please try again.',
  'auth/invalid-verification-id': 'Invalid verification ID. Please try again.',
  'auth/code-expired': 'Code expired. Please try again.',
  'auth/invalid-action-code': 'Invalid action code. Please try again.',
  'auth/user-disabled': 'User disabled. Please contact support.',
  'auth/invalid-credential': 'Invalid credential. Please try again.',

  // Continue URI Errors
  'auth/invalid-continue-uri': 'Invalid continue URL. Please try again.',
  'auth/unauthorized-continue-uri': 'Unauthorized continue URL. Please try again.',
  'auth/missing-continue-uri': 'Missing continue URL. Please try again.',

  // Verification Errors
  'auth/missing-verification-code': 'Missing verification code. Please try again.',
  'auth/missing-verification-id': 'Missing verification ID. Please try again.',

  // reCAPTCHA/Phone Auth
  'auth/captcha-check-failed': 'Captcha check failed. Please try again.',
  'auth/invalid-phone-number': 'Invalid phone number. Please try again.',
  'auth/missing-phone-number': 'Missing phone number. Please try again.',

  // Quota Errors
  'auth/quota-exceeded': 'Quota exceeded. Please try again.',

  // App Credential Errors
  'auth/missing-app-credential': 'Missing app credential. Please try again.',
  'auth/invalid-app-credential': 'Invalid app credential. Please try again.',

  // Session Errors
  'auth/session-expired': 'Session expired. Please try again.',

  // Token/Nonce Errors
  'auth/missing-or-invalid-nonce': 'Missing or invalid nonce. Please try again.',
  'auth/missing-client-identifier': 'Missing client identifier. Please try again.',
  'auth/key-retrieval-failed': 'Key retrieval failed. Please try again.',

  // OAuth Errors
  'auth/invalid-oauth-provider': 'Invalid OAuth provider. Please try again.',
  'auth/invalid-oauth-client-id': 'Invalid OAuth client ID. Please try again.',
  'auth/invalid-cert-hash': 'Invalid cert hash. Please try again.',
  'auth/invalid-oauth-client-secret': 'Invalid OAuth client secret. Please try again.',

  // Token Errors
  'auth/invalid-user-token': 'Invalid user token. Please try again.',
  'auth/invalid-custom-token': 'Invalid custom token. Please try again.',
  'auth/invalid-id-token': 'Invalid ID token. Please try again.',

  // App Errors
  'auth/app-deleted': 'App deleted. Please try again.',
  'auth/app-not-authorized': 'App not authorized. Please try again.',

  // API/Network Errors
  'auth/argument-error': 'Argument error. Please try again.',
  'auth/invalid-api-key': 'Invalid API key. Please try again.',
  'auth/network-request-failed': 'Network request failed. Please try again.',
  'auth/requires-recent-login': 'Requires recent login. Please try again.',
  'auth/too-many-requests': 'Too many requests. Please try again.',
  'auth/unauthorized-domain': 'Unauthorized domain. Please try again.',
  'auth/user-token-expired': 'User token expired. Please try again.',
  'auth/web-storage-unsupported': 'Web storage unsupported. Please try again.',

  // Account Linking Errors
  'auth/account-exists-with-different-credential': 'Account exists with different credential. Please try again.',
  'auth/credential-already-in-use': 'Credential already in use. Please try again.',
  'auth/custom-token-mismatch': 'Custom token mismatch. Please try again.',
  'auth/provider-already-linked': 'Provider already linked. Please try again.',

  // Timeout
  'auth/timeout': 'Timeout. Please try again.',

  // Mobile Config Errors
  'auth/missing-android-pkg-name': 'Missing Android package name. Please try again.',
  'auth/missing-ios-bundle-id': 'Missing iOS bundle ID. Please try again.',
  'auth/invalid-dynamic-link-domain': 'Invalid dynamic link domain. Please try again.',

  // Persistence Errors
  'auth/invalid-persistence-type': 'Invalid persistence type. Please try again.',
  'auth/unsupported-persistence-type': 'Unsupported persistence type. Please try again.',

  // User Management Errors
  'auth/invalid-argument': 'Invalid argument. Please try again.',
  'auth/invalid-creation-time': 'Invalid creation time. Please try again.',
  'auth/invalid-disabled-field': 'Invalid disabled field. Please try again.',
  'auth/invalid-display-name': 'Invalid display name. Please try again.',
  'auth/invalid-email-verified': 'Invalid email verification status. Please try again.',
  'auth/invalid-password': 'Invalid password. Please try again.',
  'auth/invalid-photo-url': 'Invalid photo URL. Please try again.',
  'auth/invalid-provider-id': 'Invalid provider ID. Please try again.',
  'auth/invalid-uid': 'Invalid UID. Please try again.',
  'auth/email-already-exists': 'Email already exists. Please try again.',
  'auth/phone-number-already-exists': 'Phone number already exists. Please try again.',
  'auth/uid-already-exists': 'UID already exists. Please try again.',

  // Project Errors
  'auth/project-not-found': 'Project not found. Please try again.',
  'auth/insufficient-permission': 'Insufficient permission. Please try again.',

  // Internal Errors
  'auth/internal-error': 'Internal error. Please try again.'
};

export const getAuthErrorMessage = (error: unknown): string => {
  // Handle non-error cases
  if (!error) return 'An unknown error occurred';
  
  // Handle FirebaseError instances
  if (error instanceof FirebaseError) {
    return firebaseErrorMessages[error.code] || error.message;
  }
  
  // Handle Error instances
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle objects with message property
  if (typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  // Fallback for any other case
  return 'An unknown error occurred';
};