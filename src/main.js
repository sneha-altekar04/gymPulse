import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/authStore';

import 'primevue/resources/themes/lara-light-indigo/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import './assets/styles/main.css';

// Initialize Firebase (config is loaded from .env)
import './firebase/firebase';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(PrimeVue, {
  ripple: true
});
app.use(ToastService);
app.use(ConfirmationService);

// Initialize auth state before mounting (with timeout fallback)
const authStore = useAuthStore();
const authReady = authStore.initializeAuth();
const timeout = new Promise(resolve => setTimeout(resolve, 3000));

Promise.race([authReady, timeout]).then(() => {
  app.mount('#app');
}).catch((error) => {
  console.error('Failed to initialize auth:', error);
  app.mount('#app');
});