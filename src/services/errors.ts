export function friendlyError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  const known: Record<string, string> = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/email-already-in-use': 'This email already has an account. Please sign in.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Use a password with at least 8 characters.',
    'auth/network-request-failed': 'You need a connection to sign in. Try again when online.',
    'auth/too-many-requests': 'Too many attempts. Please wait a little and try again.',
    'auth/operation-not-allowed': 'Email/password sign-in must be enabled in the Firebase console.',
    'permission-denied': 'Cloud access was denied. Check the Firestore security rules in the setup guide.',
    'storage/unauthorized': 'Photo upload was denied. Check Firebase Storage rules.',
    'storage/unknown': 'Photo upload failed. Check that Firebase Storage is enabled.',
    'unavailable': 'Cloud is temporarily unavailable. Your local changes are kept for retry.',
  };
  return known[code] ?? (error instanceof Error ? error.message : 'Something went wrong. Please try again.');
}
