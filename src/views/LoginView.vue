<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <i class="pi pi-bolt" style="font-size: 3rem; color: #4f46e5;"></i>
        <h1>GymPulse</h1>
        <p>Gym Management System</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Email Address</label>
          <InputText
            id="email"
            v-model="form.email"
            type="email"
            placeholder="your@email.com"
            :class="{ 'ng-invalid': errors.email }"
          />
          <small v-if="errors.email" class="error">{{ errors.email }}</small>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <Password
            id="password"
            v-model="form.password"
            placeholder="Enter your password"
            :feedback="false"
            toggleMask
          />
          <small v-if="errors.password" class="error">{{ errors.password }}</small>
        </div>

        <Button
          type="submit"
          label="Login"
          class="w-full"
          :loading="loading"
          :disabled="loading"
        />

        <div v-if="serverError" class="error-message">
          <i class="pi pi-exclamation-circle"></i>
          {{ serverError }}
        </div>
      </form>

      <div class="login-footer">
        <router-link to="/forgot-password" class="forgot-link">
          Forgot Password?
        </router-link>
      </div>

      <div class="demo-credentials">
        <p><strong>Demo Credentials:</strong></p>
        <p>Email: owner@gympulse.com</p>
        <p>Password: Demo@123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import { loginUser } from '../firebase/auth';
import { getDocument } from '../firebase/firestore';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const form = reactive({
  email: 'owner@gympulse.com',
  password: 'Demo@123'
});

const errors = reactive({
  email: null,
  password: null
});

const loading = ref(false);
const serverError = ref(null);

function validateForm() {
  errors.email = null;
  errors.password = null;

  if (!form.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Invalid email address';
  }

  if (!form.password) {
    errors.password = 'Password is required';
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }

  return !errors.email && !errors.password;
}

async function handleLogin() {
  serverError.value = null;

  if (!validateForm()) {
    return;
  }

  loading.value = true;

  try {
    const user = await loginUser(form.email, form.password);

    // Load user profile
    const profile = await getDocument('users', user.uid);

    if (!profile) {
      throw new Error('User profile not found. Please contact support.');
    }

    authStore.setUser(user, profile);

    toast.add({
      severity: 'success',
      summary: 'Login Successful',
      detail: `Welcome back, ${profile.name}!`,
      life: 3000
    });

    // Redirect to dashboard
    router.push('/dashboard');
  } catch (error) {
    serverError.value = error.message;
    toast.add({
      severity: 'error',
      summary: 'Login Failed',
      detail: error.message,
      life: 4000
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(180deg, #142b62 0%, #101f48 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 48px;
  width: 100%;
  max-width: 420px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  margin: 16px 0 8px;
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
}

.login-header p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

:deep(.p-inputtext),
:deep(.p-password input) {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

:deep(.p-inputtext:focus),
:deep(.p-password input:focus) {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

:deep(.p-inputtext.ng-invalid) {
  border-color: #ef4444;
}

.error {
  font-size: 12px;
  color: #ef4444;
}

:deep(.p-button) {
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  background: linear-gradient(135deg, #a3e635 0%, #84cc16 100%);
  border: none;
  color: #10264d;
  cursor: pointer;
  transition: background 0.2s;
}

:deep(.p-button:hover) {
  background: linear-gradient(135deg, #bef264 0%, #a3e635 100%);
}

:deep(.p-button:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #991b1b;
  font-size: 14px;
  margin-top: 12px;
}

.error-message i {
  flex-shrink: 0;
}

.login-footer {
  text-align: center;
  margin-bottom: 24px;
}

.forgot-link {
  font-size: 14px;
  color: #4f46e5;
  text-decoration: none;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #4338ca;
  text-decoration: underline;
}

.demo-credentials {
  background: #f3f4f6;
  border-radius: 8px;
  padding: 12px;
  font-size: 12px;
  color: #6b7280;
}

.demo-credentials p {
  margin: 4px 0;
}

.demo-credentials strong {
  color: #374151;
}

@media (max-width: 640px) {
  .login-card {
    padding: 32px 24px;
    margin: 16px;
  }

  .login-header h1 {
    font-size: 24px;
  }
}
</style>
