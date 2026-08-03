<template>
  <div class="forgot-password-container">
    <div class="forgot-password-card">
      <div class="card-header">
        <router-link to="/login" class="back-button">
          <i class="pi pi-arrow-left"></i>
        </router-link>
        <h1>Reset Password</h1>
      </div>

      <div v-if="!resetSent" class="reset-form-wrapper">
        <p class="description">
          Enter the email address associated with your account, and we'll send you instructions to reset your password.
        </p>

        <form @submit.prevent="handleReset" class="reset-form">
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

          <Button
            type="submit"
            label="Send Reset Instructions"
            class="w-full"
            :loading="loading"
            :disabled="loading"
          />

          <div v-if="serverError" class="error-message">
            <i class="pi pi-exclamation-circle"></i>
            {{ serverError }}
          </div>
        </form>
      </div>

      <div v-else class="success-wrapper">
        <div class="success-icon">
          <i class="pi pi-check-circle"></i>
        </div>
        <h2>Check Your Email</h2>
        <p>
          We've sent password reset instructions to <strong>{{ form.email }}</strong>
        </p>
        <p class="secondary-text">
          Please check your email and follow the link to reset your password. If you don't see the email, check your spam folder.
        </p>
        <Button
          @click="resetForm"
          label="Send Another Email"
          text
          class="retry-button"
        />
      </div>

      <div class="card-footer">
        <p>
          Remember your password?
          <router-link to="/login">Back to Login</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { resetPassword } from '../firebase/auth';

const toast = useToast();

const form = reactive({
  email: ''
});

const errors = reactive({
  email: null
});

const loading = ref(false);
const serverError = ref(null);
const resetSent = ref(false);

function validateForm() {
  errors.email = null;

  if (!form.email) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Invalid email address';
  }

  return !errors.email;
}

async function handleReset() {
  serverError.value = null;

  if (!validateForm()) {
    return;
  }

  loading.value = true;

  try {
    await resetPassword(form.email);
    resetSent.value = true;

    toast.add({
      severity: 'success',
      summary: 'Password Reset Email Sent',
      detail: 'Please check your email for reset instructions.',
      life: 4000
    });
  } catch (error) {
    serverError.value = error.message;
    toast.add({
      severity: 'error',
      summary: 'Failed to Send Reset Email',
      detail: error.message,
      life: 4000
    });
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.email = '';
  resetSent.value = false;
  serverError.value = null;
}
</script>

<style scoped>
.forgot-password-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  padding: 20px;
}

.forgot-password-card {
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

.card-header {
  position: relative;
  margin-bottom: 32px;
  text-align: center;
}

.back-button {
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #374151;
  text-decoration: none;
  transition: background 0.2s;
}

.back-button:hover {
  background: #e5e7eb;
}

.card-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.description {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 32px;
  line-height: 1.6;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

:deep(.p-inputtext) {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

:deep(.p-inputtext:focus) {
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
  background: #4f46e5;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

:deep(.p-button:hover) {
  background: #4338ca;
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

.success-wrapper {
  text-align: center;
}

.success-icon {
  font-size: 56px;
  color: #10b981;
  margin-bottom: 16px;
}

.success-wrapper h2 {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.success-wrapper p {
  margin: 0 0 12px;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}

.secondary-text {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 24px !important;
}

.retry-button {
  color: #4f46e5;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 0;
}

.card-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.card-footer p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.card-footer a {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
  margin-left: 4px;
}

.card-footer a:hover {
  color: #4338ca;
}

@media (max-width: 640px) {
  .forgot-password-card {
    padding: 32px 24px;
  }
}
</style>
