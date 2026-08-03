/**
 * Firebase Error Handler
 * Converts Firebase and Firestore errors to user-friendly messages
 */

export const handleFirebaseError = (error) => {
  if (!error) {
    return 'An unknown error occurred';
  }

  // Handle Firebase Authentication errors
  const authErrorMap = {
    'auth/user-not-found': 'Email not found. Please check your email or sign up.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/operation-not-allowed': 'Email/password authentication is not enabled.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
  };

  // Handle Firestore errors
  const firestoreErrorMap = {
    'permission-denied': 'You don\'t have permission to perform this action.',
    'not-found': 'Document not found.',
    'already-exists': 'This item already exists.',
    'failed-precondition': 'Operation cannot be performed. Please try again.',
    'internal': 'An internal server error occurred.',
    'unavailable': 'Service is temporarily unavailable. Please try again.',
    'data-loss': 'Unrecoverable error. Please contact support.',
    'unauthenticated': 'You must be logged in to perform this action.',
    'invalid-argument': 'Invalid data provided.',
  };

  // Try to find error message
  const code = error.code || error.message;
  
  if (authErrorMap[code]) {
    return authErrorMap[code];
  }
  if (firestoreErrorMap[code]) {
    return firestoreErrorMap[code];
  }

  // Fallback to error message
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Toast notification helper
 */
export const showToast = (toast, type, title, message, life = 3000) => {
  if (!toast) return;

  const severityMap = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };

  toast.add({
    severity: severityMap[type] || 'info',
    summary: title,
    detail: message,
    life
  });
};

export const showSuccessToast = (toast, title, message = '', life = 3000) => {
  showToast(toast, 'success', title, message, life);
};

export const showErrorToast = (toast, title, message = '', life = 4000) => {
  showToast(toast, 'error', title, message, life);
};

export const showWarningToast = (toast, title, message = '', life = 3000) => {
  showToast(toast, 'warning', title, message, life);
};

export const showInfoToast = (toast, title, message = '', life = 3000) => {
  showToast(toast, 'info', title, message, life);
};
