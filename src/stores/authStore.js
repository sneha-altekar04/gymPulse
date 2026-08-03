import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { subscribeToAuthState, logoutUser } from '../firebase/auth';
import { getDocument } from '../firebase/firestore';

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null);
  const userProfile = ref(null);
  const loading = ref(true);
  const error = ref(null);

  // Computed
  const isAuthenticated = computed(() => !!currentUser.value);
  const isOwner = computed(() => userProfile.value?.role === 'OWNER');
  const isManager = computed(() => userProfile.value?.role === 'MANAGER');
  const isReceptionist = computed(() => userProfile.value?.role === 'RECEPTIONIST');
  const gymId = computed(() => userProfile.value?.gymId);

  /**
   * Initialize auth state on app load
   */
  async function initializeAuth() {
    return new Promise((resolve) => {
      const unsubscribe = subscribeToAuthState(async (user) => {
        if (user) {
          currentUser.value = {
            uid: user.uid,
            email: user.email
          };
          try {
            // Load user profile from Firestore
            const profile = await getDocument('users', user.uid);
            userProfile.value = profile;
          } catch (err) {
            console.error('Failed to load user profile:', err);
            error.value = 'Failed to load user profile';
          }
        } else {
          currentUser.value = null;
          userProfile.value = null;
        }
        loading.value = false;
        resolve();
      });
    });
  }

  /**
   * Set current user and profile
   */
  function setUser(user, profile) {
    currentUser.value = user;
    userProfile.value = profile;
    loading.value = false;
  }

  /**
   * Clear auth state on logout
   */
  function clearAuth() {
    currentUser.value = null;
    userProfile.value = null;
  }

  /**
   * Logout
   */
  async function logout() {
    try {
      await logoutUser();
      clearAuth();
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  }

  return {
    currentUser,
    userProfile,
    loading,
    error,
    isAuthenticated,
    isOwner,
    isManager,
    isReceptionist,
    gymId,
    initializeAuth,
    setUser,
    clearAuth,
    logout
  };
});

// Standalone initialization function for main.js
export async function initializeAuth() {
  return new Promise((resolve) => {
    const unsubscribe = subscribeToAuthState((user) => {
      resolve();
    });
  });
}
