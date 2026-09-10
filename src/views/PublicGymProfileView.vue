<script setup>
import { computed, onMounted, ref } from 'vue';
import { getPublicGymProfile } from '../services/firebase/publicGymProfileService';

const landingSlug = import.meta.env.VITE_PUBLIC_GYM_SLUG || 'k3-oxygen';
const mapUrl = 'https://maps.app.goo.gl/xikDBB1QFbUtALFh8';
const fallbackProfile = {
  name: 'K3 Oxygen',
  description: 'A welcoming fitness space for strength, movement, and lasting progress.',
  city: 'Pen',
  state: 'Maharashtra',
  address: 'Fish Market Rd, Ziral Ali',
  pincode: '402107',
  googleMapsUrl: mapUrl,
  phone: '078750 91626',
  heroImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85',
  facilities: [
    { name: 'Strength Training', icon: 'bolt', description: 'Build confidence with progressive training.' },
    { name: 'Cardio Conditioning', icon: 'heart', description: 'Move with energy and improve stamina.' },
    { name: 'Personal Training', icon: 'user', description: 'Focused support for your fitness goals.' }
  ]
};

const profile = ref(null);
const loading = ref(true);
const unavailable = ref(false);

const displayProfile = computed(() => ({
  ...fallbackProfile,
  ...(profile.value || {}),
  ...(landingSlug === 'k3-oxygen' ? { city: 'Pen', state: 'Maharashtra', address: 'Fish Market Rd, Ziral Ali', pincode: '402107', googleMapsUrl: mapUrl } : {})
}));
const visitingHours = 'Every day, 6:00 AM - 10:00 PM';
const googleRating = '4.6';
const reviewCards = [
  'Nice facilities Nice trainer Good ambiance Over all superb quality Gym.',
  'Enjoyed the service few months.',
  'Nice environment and people'
];

function setSeo() {
  document.title = `${displayProfile.value.name} | Gym in ${displayProfile.value.city}`;
}

async function loadProfile() {
  try {
    const result = await getPublicGymProfile(landingSlug);
    unavailable.value = result?.publicProfileEnabled === false;
    if (!unavailable.value) profile.value = result;
  } catch {
    profile.value = null;
  } finally {
    loading.value = false;
    setSeo();
  }
}

onMounted(loadProfile);
</script>

<template>
  <main class="public-gym-page">
    <section v-if="loading" class="profile-skeleton" aria-label="Loading gym profile"><i /><i /><i /></section>
    <section v-else-if="unavailable" class="profile-message"><i class="pi pi-building" /><h1>Profile unavailable</h1><RouterLink to="/login">Back to GymPulse</RouterLink></section>
    <article v-else class="gym-profile">
      <header class="gym-profile__hero">
        <div class="profile-container hero-grid">
          <div class="hero-topbar"><RouterLink class="profile-login" to="/login"><i class="pi pi-sign-in" /> Staff login</RouterLink></div>
          <div class="hero-copy">
            <p class="eyebrow"><i class="pi pi-map-marker" /> {{ displayProfile.city }}, {{ displayProfile.state }}</p>
            <h1>{{ displayProfile.name }}</h1>
            <p class="hero-lead">Train with purpose. Build a routine that lasts.</p>
            <p class="hero-description">{{ displayProfile.description }}</p>
            <div class="button-row">
              <a :href="displayProfile.googleMapsUrl" target="_blank" rel="noopener"><i class="pi pi-directions" /> Visit the gym</a>
              <a :href="`tel:${displayProfile.phone}`" class="quiet"><i class="pi pi-phone" /> Call us</a>
            </div>
            <p class="hours-signal"><i class="pi pi-clock" /> {{ visitingHours }}</p>
          </div>
          <figure class="hero-image"><img :src="displayProfile.heroImageUrl" :alt="`${displayProfile.name} training floor`" /><figcaption><i class="pi pi-heart-fill" /> A place to build your rhythm</figcaption></figure>
        </div>
      </header>

      <div class="profile-container page-content">
        <section class="training-section">
          <div class="section-heading">
            <div><p class="eyebrow">Your training floor</p><h2>More than equipment. A space to keep showing up.</h2></div>
            <p>Whether you are building strength, improving stamina, or starting fresh, choose the training that fits your goal today.</p>
          </div>
          <div class="facility-grid">
            <article v-for="(facility, index) in displayProfile.facilities" :key="`${facility.name}-${index}`" class="facility">
              <span :class="`facility-icon facility-icon--${index}`"><i :class="`pi pi-${facility.icon || 'star'}`" /></span>
              <h3>{{ facility.name }}</h3>
              <p>{{ facility.description || 'A focused training space built around steady progress.' }}</p>
            </article>
          </div>
        </section>

        <section class="reviews-section">
          <div class="section-heading">
            <div><p class="eyebrow">Google rating & reviews</p><h2>Trusted by local members, seen on Google Maps.</h2></div>
            <p>K3 Oxygen Gym is listed at {{ googleRating }} stars on Google Maps. Here are the exact review snippets shown publicly on the listing.</p>
          </div>
          <div class="reviews-marquee" aria-label="Top Google reviews">
            <div class="reviews-track">
              <article v-for="(review, index) in [...reviewCards, ...reviewCards]" :key="`${review}-${index}`" class="review-card">
                <div class="review-card__stars"><i class="pi pi-star-fill" /><i class="pi pi-star-fill" /><i class="pi pi-star-fill" /><i class="pi pi-star-fill" /><i class="pi pi-star-fill" /></div>
                <p>“{{ review }}”</p>
              </article>
            </div>
          </div>
          <div class="reviews-footer"><span><i class="pi pi-star-fill" /> {{ googleRating }} / 5</span><a :href="displayProfile.googleMapsUrl" target="_blank" rel="noopener">Read more on Google Maps <i class="pi pi-arrow-up-right" /></a></div>
        </section>
      </div>

      <footer class="profile-footer"><strong>{{ displayProfile.name }}</strong><span>{{ displayProfile.city }}, {{ displayProfile.state }}</span><small>&copy; {{ new Date().getFullYear() }} {{ displayProfile.name }} <em>Powered by GymPulse</em></small></footer>
    </article>
  </main>
</template>

<style scoped>
.public-gym-page{min-height:100vh;background:#f8f6f0;color:#182541}.profile-container{width:min(100% - 40px,1180px);margin:auto}.gym-profile__hero{padding:28px 0 76px;overflow:hidden;background:#10264d repeating-linear-gradient(135deg,rgba(255,255,255,.035) 0,rgba(255,255,255,.035) 1px,transparent 1px,transparent 20px);color:#fff}.hero-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(330px,.95fr);gap:54px;align-items:center}.hero-topbar{grid-column:1/-1;display:flex;justify-content:flex-end}.profile-login{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid rgba(255,255,255,.4);border-radius:7px;color:#fff;font-size:.75rem;font-weight:800}.profile-login:hover{background:rgba(255,255,255,.12)}.eyebrow{margin:0;color:#d95747;font-size:.72rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.hero-copy .eyebrow{color:#c9f56f}.hero-copy h1{margin:16px 0 7px;font:700 clamp(3rem,7vw,5.9rem)/.94 'Sora',sans-serif}.hero-lead{max-width:580px;margin:0;font:600 clamp(1.3rem,2.7vw,2rem)/1.22 'Manrope',sans-serif}.hero-description{max-width:565px;margin:21px 0 0;color:#c4d1e9;line-height:1.75}.button-row{display:flex;flex-wrap:wrap;gap:11px;margin-top:26px}.button-row a{display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:0 18px;border:1px solid #c9f56f;border-radius:7px;background:#c9f56f;color:#10264d;font-size:.84rem;font-weight:800}.button-row .quiet{border-color:rgba(255,255,255,.38);background:transparent;color:#fff}.hours-signal{display:flex;align-items:center;gap:8px;margin:23px 0 0;color:#d7e2f5;font-size:.78rem;font-weight:700}.hours-signal i{color:#c9f56f}.hero-image{position:relative;min-height:385px;margin:0;overflow:hidden;border:8px solid rgba(255,255,255,.12);border-radius:8px;box-shadow:15px 15px 0 #e85b4b}.hero-image img{position:absolute;width:100%;height:100%;object-fit:cover}.hero-image:after{position:absolute;inset:auto 0 0;height:40%;background:linear-gradient(transparent,rgba(8,20,48,.85));content:''}.hero-image figcaption{position:absolute;z-index:1;bottom:18px;left:20px;display:flex;gap:8px;align-items:center;font:700 .82rem 'Sora',sans-serif}.hero-image figcaption i{color:#c9f56f}.page-content{padding-bottom:82px}.quick-facts{position:relative;z-index:2;display:grid;grid-template-columns:repeat(3,1fr);margin-top:-30px;border:1px solid #e7e1d7;border-radius:8px;background:#fff;box-shadow:0 14px 32px rgba(20,37,70,.1)}.quick-facts>div{display:grid;grid-template-columns:34px 1fr;gap:2px 10px;padding:20px;border-right:1px solid #ebe6dd}.quick-facts>div:last-child{border:0}.quick-facts i{grid-row:1/3;padding-top:4px;color:#e85b4b}.quick-facts span{color:#777f8f;font-size:.69rem;font-weight:800;text-transform:uppercase}.quick-facts strong{font-size:.82rem}.training-section{padding-top:86px}.reviews-section{padding-top:86px}.section-heading{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.65fr);gap:48px;align-items:end;margin-bottom:26px}.section-heading h2{max-width:660px;margin:8px 0 0;color:#10264d;font:700 clamp(1.8rem,3.5vw,2.8rem)/1.12 'Sora',sans-serif}.section-heading>p{margin:0;color:#626d80;line-height:1.8}.facility-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.facility{min-height:205px;padding:22px;border:1px solid #e7e1d7;border-radius:7px;background:#fff;transition:transform 180ms ease,box-shadow 180ms ease}.facility:hover{transform:translateY(-4px);box-shadow:0 14px 27px rgba(20,37,70,.1)}.facility-icon{display:grid;place-items:center;width:40px;height:40px;margin-bottom:35px;border-radius:50%;font-size:.95rem}.facility-icon--0{background:#fff0ea;color:#e85b4b}.facility-icon--1{background:#edf9f7;color:#139a87}.facility-icon--2{background:#f3edff;color:#805ad5}.facility h3{margin:0;color:#172747;font-size:.96rem}.facility p{margin:9px 0 0;color:#6a7485;font-size:.78rem;line-height:1.55}.reviews-marquee{overflow:hidden;margin-top:28px;border:1px solid #e7e1d7;border-radius:14px;background:#fff}.reviews-track{display:flex;gap:16px;padding:18px;width:max-content;animation:review-scroll 26s linear infinite}.review-card{width:min(360px,78vw);padding:22px;border-radius:12px;background:linear-gradient(180deg,#10264d,#163469);color:#fff;box-shadow:0 12px 28px rgba(16,38,77,.18)}.review-card__stars{display:flex;gap:5px;color:#c9f56f;font-size:.78rem}.review-card p{margin:14px 0 0;font:600 1.02rem/1.55 'Manrope',sans-serif}.reviews-footer{display:flex;flex-wrap:wrap;justify-content:space-between;gap:14px;align-items:center;margin-top:18px}.reviews-footer span{display:inline-flex;align-items:center;gap:8px;color:#10264d;font-weight:800}.reviews-footer span i{color:#c9f56f}.reviews-footer a{display:inline-flex;align-items:center;gap:8px;color:#10264d;font-size:.82rem;font-weight:800}.profile-footer{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;padding:25px max(20px,calc((100vw - 1180px)/2));background:#fff;color:#687083;font-size:.75rem}.profile-footer strong{color:#14254c;font-family:'Sora',sans-serif}.profile-footer em{margin-left:9px;color:#969cab;font-style:normal}.profile-message{min-height:100vh;display:grid;place-items:center;align-content:center;gap:16px;padding:30px;background:#f8f6f0;text-align:center}.profile-message>i{color:#159b69;font-size:2rem}.profile-message h1{margin:0;color:#14254c;font:700 2rem 'Sora',sans-serif}.profile-message a{padding:12px 16px;border-radius:7px;background:#14254c;color:#fff;font-size:.82rem;font-weight:800}.profile-skeleton{display:grid;gap:28px;padding:8vw max(20px,calc((100vw - 1180px)/2));background:#f8f6f0}.profile-skeleton i{display:block;height:90px;border-radius:8px;background:linear-gradient(90deg,#f0ece6 25%,#faf7f2 37%,#f0ece6 63%);background-size:400% 100%;animation:profile-loading 1.3s infinite}.profile-skeleton i:first-child{height:310px}@keyframes profile-loading{to{background-position:-135% 0}}@keyframes review-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}@media(max-width:760px){.profile-container{width:min(100% - 32px,1180px)}.gym-profile__hero{padding:24px 0 60px}.hero-grid{grid-template-columns:1fr;gap:35px}.hero-copy h1{font-size:clamp(3rem,15vw,4.7rem)}.hero-image{min-height:290px;max-width:560px;box-shadow:10px 10px 0 #e85b4b}.quick-facts{grid-template-columns:1fr}.quick-facts>div{border-right:0;border-bottom:1px solid #ebe6dd}.quick-facts>div:last-child{border-bottom:0}.training-section,.reviews-section{padding-top:62px}.section-heading{grid-template-columns:1fr;gap:24px;margin-bottom:22px}.facility-grid{grid-template-columns:1fr}.facility{min-height:155px}.review-card{width:84vw}.reviews-footer{display:grid;text-align:center}.profile-footer{display:grid;text-align:center}.profile-footer em{display:block;margin:5px 0 0}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
