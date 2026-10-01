<script setup>
import { reactive, ref } from 'vue';
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
const form = reactive({ email: 'owner@gympulse.com', password: 'Demo@123' });
const errors = reactive({ email: null, password: null });
const loading = ref(false);
const serverError = ref(null);

function validateForm() {
  errors.email = null;
  errors.password = null;
  if (!form.email) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email address';
  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
  return !errors.email && !errors.password;
}

async function handleLogin() {
  serverError.value = null;
  if (!validateForm()) return;
  loading.value = true;

  try {
    const user = await loginUser(form.email, form.password);
    const profile = await getDocument('users', user.uid);
    if (!profile) throw new Error('User profile not found. Please contact support.');
    if (profile.active === false) {
      await authStore.logout();
      throw new Error('Your account is inactive. Please contact the gym owner.');
    }
    authStore.setUser(user, profile);
    toast.add({ severity: 'success', summary: 'Login Successful', detail: `Welcome back, ${profile.name}!`, life: 3000 });
    router.push('/dashboard');
  } catch (error) {
    serverError.value = error.message;
    toast.add({ severity: 'error', summary: 'Login Failed', detail: error.message, life: 4000 });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-story" aria-label="K3 Oxygen Gym">
      <RouterLink class="login-story__brand" to="/">
        <span>K3</span>
        <div><strong>Oxygen</strong><small>Gym</small></div>
      </RouterLink>
      <div class="login-story__content">
        <p class="login-eyebrow">Gym management · powered by GymPulse</p>
        <h1>Run the gym.<br />Build a better <em>you.</em></h1>
        <p>One focused workspace for members, attendance, memberships, trainers, payments, and growth.</p>
        <div class="login-story__benefits">
          <span><i class="pi pi-check" /> Faster front-desk workflows</span>
          <span><i class="pi pi-check" /> Clear daily business insights</span>
          <span><i class="pi pi-check" /> Secure role-based access</span>
        </div>
      </div>
      <p class="login-story__footer">Stronger operations. Better member experiences.</p>
    </section>

    <section class="login-access">
      <div class="login-card">
        <div class="login-header">
          <span class="login-header__mark"><i class="pi pi-bolt" /></span>
          <p class="login-eyebrow">Staff access</p>
          <h2>Welcome back</h2>
          <p>Sign in to continue to GymPulse.</p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <label class="form-group" for="email">
            <span>Email address</span>
            <InputText id="email" v-model="form.email" type="email" autocomplete="email" placeholder="your@email.com" :class="{ 'ng-invalid': errors.email }" />
            <small v-if="errors.email" class="field-error"><i class="pi pi-exclamation-circle" /> {{ errors.email }}</small>
          </label>

          <label class="form-group" for="password">
            <span>Password</span>
            <Password id="password" v-model="form.password" autocomplete="current-password" placeholder="Enter your password" :feedback="false" toggleMask />
            <small v-if="errors.password" class="field-error"><i class="pi pi-exclamation-circle" /> {{ errors.password }}</small>
          </label>

          <div class="form-assistance"><router-link to="/forgot-password">Forgot password?</router-link></div>
          <Button type="submit" label="Sign in to GymPulse" icon="pi pi-arrow-right" icon-pos="right" :loading="loading" :disabled="loading" />

          <div v-if="serverError" class="error-message" role="alert"><i class="pi pi-times-circle" /><span><strong>Unable to sign in</strong>{{ serverError }}</span></div>
        </form>

        <div class="demo-credentials">
          <span class="demo-credentials__icon"><i class="pi pi-key" /></span>
          <div><strong>Demo access</strong><p>owner@gympulse.com</p><p>Password: Demo@123</p></div>
        </div>
        <RouterLink class="back-to-site" to="/"><i class="pi pi-arrow-left" /> Back to gym website</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-page{--login-ink:#121213;--login-orange:#f26a16;--login-pink:#ed168c;display:grid;grid-template-columns:minmax(420px,1.05fr) minmax(460px,.95fr);min-height:100vh;background:#111;color:var(--login-ink)}
.login-story{position:relative;display:flex;flex-direction:column;justify-content:space-between;min-height:100vh;padding:42px clamp(38px,6vw,88px);overflow:hidden;background:radial-gradient(circle at 25% 28%,rgba(237,22,140,.16),transparent 30%),repeating-linear-gradient(130deg,transparent 0,transparent 67px,rgba(255,255,255,.025) 68px,transparent 70px),#111;color:#fff}.login-story:before{position:absolute;right:-90px;bottom:18%;width:420px;height:105px;transform:rotate(-9deg);background:var(--login-orange);opacity:.13;content:''}.login-story:after{position:absolute;right:-20px;top:-30px;width:155px;height:155px;border:28px solid rgba(242,106,22,.08);border-radius:50%;content:''}.login-story__brand{position:relative;z-index:1;display:flex;align-items:center;gap:13px;width:max-content}.login-story__brand>span{display:grid;place-items:center;width:52px;height:52px;transform:skew(-8deg);background:linear-gradient(145deg,var(--login-orange),var(--login-pink));color:#fff;font:800 1.15rem 'Sora',sans-serif;box-shadow:7px 6px 0 rgba(255,255,255,.1)}.login-story__brand div{display:flex;align-items:baseline;gap:6px}.login-story__brand strong{color:var(--login-pink);font:800 1.28rem 'Sora',sans-serif}.login-story__brand small{font-size:.7rem;font-weight:800;text-transform:uppercase}.login-story__content{position:relative;z-index:1;max-width:680px;margin-block:50px}.login-eyebrow{margin:0;color:var(--login-orange)!important;font-size:.68rem!important;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.login-story h1{margin:15px 0 23px;font:800 clamp(3rem,5.7vw,5.8rem)/.94 'Sora',sans-serif;letter-spacing:-.06em;text-transform:uppercase}.login-story h1 em{color:var(--login-orange);font-style:normal}.login-story__content>p:not(.login-eyebrow){max-width:590px;margin:0;color:#aaa;font-size:1rem;line-height:1.8}.login-story__benefits{display:flex;flex-wrap:wrap;gap:10px;margin-top:31px}.login-story__benefits span{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1px solid #373739;background:rgba(255,255,255,.025);color:#d6d6d6;font-size:.72rem;font-weight:700}.login-story__benefits i{color:var(--login-orange)}.login-story__footer{position:relative;z-index:1;margin:0;color:#666;font-size:.66rem;font-weight:800;letter-spacing:.11em;text-transform:uppercase}
.login-access{display:grid;place-items:center;min-height:100vh;padding:34px;background:linear-gradient(145deg,#f5f2ed,#eee8df)}.login-card{width:min(100%,480px);padding:42px 44px;border:1px solid #ddd5cb;background:#fff;box-shadow:18px 18px 0 rgba(242,106,22,.14)}.login-header{margin-bottom:32px}.login-header__mark{display:grid;place-items:center;width:48px;height:48px;margin-bottom:24px;transform:skew(-7deg);background:var(--login-orange);color:#111;font-size:1.25rem}.login-header h2{margin:7px 0 6px;font:800 2rem 'Sora',sans-serif;letter-spacing:-.04em}.login-header>p:last-child{margin:0;color:#77716c;font-size:.82rem}.login-form{display:flex;flex-direction:column;gap:19px}.form-group{display:flex;flex-direction:column;gap:8px}.form-group>span{font-size:.74rem;font-weight:800;text-transform:uppercase}.form-group :deep(.p-inputtext),.form-group :deep(.p-password input){width:100%;min-height:48px;padding:11px 13px;border:1px solid #d8d1c8;border-radius:0;background:#fbfaf8;color:#1b1b1c;font-size:.84rem}.form-group :deep(.p-password){width:100%}.form-group :deep(.p-inputtext:focus),.form-group :deep(.p-password input:focus){border-color:var(--login-orange);box-shadow:0 0 0 3px rgba(242,106,22,.13)}.form-group :deep(.p-inputtext.ng-invalid){border-color:#d53f4d}.field-error{display:flex;gap:5px;align-items:center;color:#c63745;font-size:.7rem}.form-assistance{display:flex;justify-content:flex-end;margin-top:-6px}.form-assistance a{color:#a8417d;font-size:.75rem;font-weight:800}.login-form :deep(.p-button){justify-content:center;min-height:50px;border:0;border-radius:0;background:var(--login-orange);color:#111;font-size:.8rem;font-weight:800;text-transform:uppercase;box-shadow:6px 6px 0 #181819}.login-form :deep(.p-button:hover){background:#dc590d;color:#fff}.error-message{display:flex;gap:11px;align-items:flex-start;padding:13px;border-left:4px solid #d53f4d;background:#fff0f1;color:#8d2630;font-size:.74rem;line-height:1.45}.error-message>i{margin-top:2px;color:#d53f4d}.error-message span{display:grid;gap:2px}.error-message strong{font-size:.73rem}.demo-credentials{display:grid;grid-template-columns:auto 1fr;gap:12px;margin-top:28px;padding:14px;border:1px solid #e5ded6;background:#f7f4ef;color:#69635e;font-size:.7rem}.demo-credentials__icon{display:grid;place-items:center;width:34px;height:34px;background:#19191a;color:var(--login-orange)}.demo-credentials strong{display:block;margin-bottom:4px;color:#292726;font-size:.73rem;text-transform:uppercase}.demo-credentials p{margin:2px 0}.back-to-site{display:inline-flex;gap:7px;align-items:center;margin-top:24px;color:#77716c;font-size:.72rem;font-weight:800}.back-to-site:hover{color:var(--login-orange)}
@keyframes login-enter{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.login-card{animation:login-enter .32s ease-out}
@media(max-width:960px){.login-page{grid-template-columns:1fr}.login-story{display:none}.login-access{padding:24px;min-height:100vh}.login-card{max-width:500px}}
@media(max-width:560px){.login-access{align-items:start;padding:0;background:#fff}.login-card{min-height:100vh;padding:34px 24px;border:0;box-shadow:none}.login-header{margin-top:18px}.login-header h2{font-size:1.75rem}}
@media(prefers-reduced-motion:reduce){.login-card{animation:none}}
</style>
