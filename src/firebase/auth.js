// Firebase Authentication Module
// Handles login, logout, password reset, and session management

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from './firebase';

// Enable session persistence
setPersistence(auth, browserLocalPersistence);

/**
 * Register a new user
 * @param {string} email
 * @param {string} password
 * @returns {Promise}
 */
export const registerUser = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw formatAuthError(error);
  }
};

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise}
 */
export const loginUser = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    throw formatAuthError(error);
  }
};

/**
 * Logout current user
 * @returns {Promise}
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw formatAuthError(error);
  }
};

/**
 * Send password reset email
 * @param {string} email
 * @returns {Promise}
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw formatAuthError(error);
  }
};

/**
 * Get current user
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Called with user object or null
 * @returns {Function} - Unsubscribe function
 */
export const subscribeToAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Convert Firebase auth errors to user-friendly messages
 * @param {Error} error
 * @returns {Error}
 */
export const formatAuthError = (error) => {
  const errorMap = {
    'auth/user-not-found': 'Email not found. Please check your email or sign up.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Invalid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/operation-not-allowed': 'Email/password sign-up is not enabled.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
  };

  const message = errorMap[error.code] || error.message || 'An authentication error occurred';
  const authError = new Error(message);
  authError.code = error.code;
  return authError;
};

export default auth;
