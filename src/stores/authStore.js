import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { subscribeToAuthState, logoutUser } from '../firebase/auth';
import { getDocument } from '../firebase/firestore';
import { hasPermission } from '../constants/permissions';

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null);
  const userProfile = ref(null);
  const loading = ref(true);
  const error = ref(null);

  // Computed
  const isActive = computed(() => userProfile.value?.active !== false);
  const isAuthenticated = computed(() => !!currentUser.value && !!userProfile.value && isActive.value);
  const isOwner = computed(() => userProfile.value?.role === 'OWNER');
  const isManager = computed(() => userProfile.value?.role === 'MANAGER');
  const isReceptionist = computed(() => userProfile.value?.role === 'RECEPTIONIST');
  const gymId = computed(() => userProfile.value?.gymId);
  const can = (permission) => hasPermission(userProfile.value?.role, permission);

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
            if (!profile) {
              throw new Error('User profile not found. Please contact support.');
            }
            if (profile.active === false) {
              await logoutUser();
              clearAuth();
              error.value = 'Your account is inactive. Please contact the gym owner.';
            } else {
              userProfile.value = profile;
              error.value = null;
            }
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
    if (!profile) throw new Error('User profile not found. Please contact support.');
    if (profile.active === false) throw new Error('Your account is inactive. Please contact the gym owner.');
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
    isActive,
    isOwner,
    isManager,
    isReceptionist,
    gymId,
    can,
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
