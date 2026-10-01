<script setup>
import { computed, onMounted, ref } from 'vue';
import { getPublicGymProfile } from '../services/firebase/publicGymProfileService';
import techwiseLogo from '../../designs/techwise-logo/techwise-solutions-logo-dark.png';

const landingSlug = import.meta.env.VITE_PUBLIC_GYM_SLUG || 'k3-oxygen';
const mapUrl = 'https://maps.app.goo.gl/xikDBB1QFbUtALFh8';
const weekdayHours = '6:00 AM - 10:30 PM';
const sundayHours = '7:00 AM - 11:00 AM';

const fallbackProfile = {
  name: 'K3 Oxygen Gym',
  description: 'A high-energy fitness space in Pen for stronger bodies, healthier routines, and lasting progress.',
  city: 'Pen', state: 'Maharashtra', address: 'Fish Market Rd, Ziral Ali', pincode: '402107',
  googleMapsUrl: mapUrl, phone: '078750 91626',
  heroImageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1400&q=88',
  facilities: [
    { name: 'Modern Equipment', icon: 'cog', description: 'A well-equipped floor for focused, effective workouts.' },
    { name: 'Fitness Training', icon: 'bolt', description: 'Energetic sessions that keep your routine moving forward.' },
    { name: 'Strength & Conditioning', icon: 'chart-line', description: 'Build strength, endurance, and everyday confidence.' },
    { name: 'Personal Training', icon: 'user', description: 'Goal-led coaching with guidance that fits your level.' },
    { name: 'Supportive Environment', icon: 'users', description: 'A motivating local community where everyone belongs.' }
  ]
};

const profile = ref(null);
const loading = ref(true);
const unavailable = ref(false);
const displayProfile = computed(() => ({
  ...fallbackProfile,
  ...(profile.value || {}),
  ...(landingSlug === 'k3-oxygen' ? { name: 'K3 Oxygen Gym', city: 'Pen', state: 'Maharashtra', address: 'Fish Market Rd, Ziral Ali', pincode: '402107', googleMapsUrl: mapUrl } : {})
}));
const displayFacilities = computed(() => {
  const savedFacilities = profile.value?.facilities;
  return Array.isArray(savedFacilities) && savedFacilities.length >= 4 ? savedFacilities : fallbackProfile.facilities;
});
const googleRating = '4.6';
const reviewCards = [
  'Nice facilities, nice trainer, good ambience. Overall superb quality gym.',
  'Enjoyed the service for a few months.',
  'Nice environment and people.'
];

function setSeo() { document.title = `${displayProfile.value.name} | Gym in ${displayProfile.value.city}`; }
async function loadProfile() {
  try {
    const result = await getPublicGymProfile(landingSlug);
    unavailable.value = result?.publicProfileEnabled === false;
    if (!unavailable.value) profile.value = result;
  } catch { profile.value = null; }
  finally { loading.value = false; setSeo(); }
}
onMounted(loadProfile);
</script>

<template>
  <main class="public-gym-page">
    <section v-if="loading" class="profile-skeleton" aria-label="Loading gym profile"><i /><i /><i /></section>
    <section v-else-if="unavailable" class="profile-message"><i class="pi pi-building" /><h1>Profile unavailable</h1><RouterLink to="/login">Back to GymPulse</RouterLink></section>
    <article v-else class="gym-profile">
      <header class="gym-profile__hero">
        <nav class="profile-container hero-nav" aria-label="Public gym navigation">
          <a class="public-brand" href="#top" aria-label="K3 Oxygen Gym home"><span class="public-brand__mark">K3</span><span><strong>Oxygen</strong><small>Gym</small></span></a>
          <div class="hero-nav__actions"><a :href="`tel:${displayProfile.phone}`"><i class="pi pi-phone" /> {{ displayProfile.phone }}</a><RouterLink class="profile-login" to="/login"><i class="pi pi-sign-in" /> Staff login</RouterLink></div>
        </nav>

        <div id="top" class="profile-container hero-grid">
          <div class="hero-copy">
            <p class="eyebrow"><i class="pi pi-map-marker" /> {{ displayProfile.city }}, {{ displayProfile.state }}</p>
            <p class="hero-kicker">Stronger. Fitter. Happier.</p>
            <h1>Fitness builds<br />a better <em>you.</em></h1>
            <p class="hero-description">{{ displayProfile.description }}</p>
            <div class="button-row"><a :href="displayProfile.googleMapsUrl" target="_blank" rel="noopener"><i class="pi pi-directions" /> Visit the gym</a><a href="#training" class="quiet"><i class="pi pi-bolt" /> Explore training</a></div>
          </div>
          <figure class="hero-image"><img :src="displayProfile.heroImageUrl" :alt="`${displayProfile.name} training floor`" /><figcaption><span>Train hard.</span><strong>Feel stronger.</strong></figcaption></figure>
        </div>

        <div class="profile-container hours-row" aria-label="Gym location and opening hours">
          <a class="directions-card" :href="displayProfile.googleMapsUrl" target="_blank" rel="noopener">
            <span class="directions-card__icon"><i class="pi pi-map-marker" /></span>
            <span><small>Find us in Pen</small><strong>Get directions</strong></span>
            <i class="pi pi-arrow-up-right" />
          </a>
          <div class="hours-panel">
            <div class="hours-panel__title"><i class="pi pi-clock" /><span><small>Opening hours</small><strong>Gym Time</strong></span></div>
            <div class="hours-panel__slot"><span>Monday to Saturday</span><strong>{{ weekdayHours }}</strong></div>
            <div class="hours-panel__slot"><span>Sunday</span><strong>{{ sundayHours }}</strong></div>
          </div>
        </div>
      </header>

      <section class="benefit-strip" aria-label="Gym benefits"><div class="profile-container benefit-strip__grid"><div v-for="facility in displayFacilities" :key="facility.name"><i :class="`pi pi-${facility.icon || 'star'}`" /><span>{{ facility.name }}</span></div></div></section>

      <div class="profile-container page-content">
        <section id="training" class="training-section">
          <div class="section-heading"><div><p class="eyebrow">Everything you need to progress</p><h2>Train with purpose.<br /><em>Build your best.</em></h2></div><p>From your first workout to your next personal best, K3 Oxygen gives you the equipment, coaching, and energy to keep showing up.</p></div>
          <div class="facility-grid">
            <article v-for="(facility, index) in displayFacilities" :key="`${facility.name}-${index}`" class="facility"><span class="facility-number">0{{ index + 1 }}</span><span class="facility-icon"><i :class="`pi pi-${facility.icon || 'star'}`" /></span><h3>{{ facility.name }}</h3><p>{{ facility.description || 'A focused training space built around steady progress.' }}</p></article>
          </div>
        </section>

        <section class="motivation-banner"><div><p class="eyebrow">Your next chapter starts here</p><h2>Ready to become stronger?</h2><p>Visit K3 Oxygen Gym in Pen and take the first step toward a fitter, healthier you.</p></div><a :href="`tel:${displayProfile.phone}`"><i class="pi pi-phone" /> Talk to us</a></section>

        <section class="reviews-section">
          <div class="section-heading section-heading--reviews"><div><p class="eyebrow">Member experience</p><h2>Real words from our <em>gym community.</em></h2></div><div class="rating-lockup"><strong>{{ googleRating }}</strong><span><i class="pi pi-star-fill" /><i class="pi pi-star-fill" /><i class="pi pi-star-fill" /><i class="pi pi-star-fill" /><i class="pi pi-star-fill" /><small>Google rating</small></span></div></div>
          <div class="review-grid"><article v-for="review in reviewCards" :key="review" class="review-card"><i class="pi pi-quote-left" /><p>“{{ review }}”</p><span>Google review</span></article></div>
          <a class="maps-review-link" :href="displayProfile.googleMapsUrl" target="_blank" rel="noopener">See K3 Oxygen on Google Maps <i class="pi pi-arrow-up-right" /></a>
        </section>
      </div>

      <footer id="site-footer" class="profile-footer">
        <div class="profile-footer__main">
          <div class="public-brand"><span class="public-brand__mark">K3</span><span><strong>Oxygen</strong><small>Gym</small></span></div>
          <div class="profile-footer__location"><strong>{{ displayProfile.address }}, {{ displayProfile.city }} {{ displayProfile.pincode }}</strong><span>Monday–Saturday {{ weekdayHours }} · Sunday {{ sundayHours }}</span></div>
          <div class="developer-credit">
            <span class="developer-credit__label">Developed by</span>
            <div class="developer-credit__content">
              <img :src="techwiseLogo" alt="Techwise Solutions" />
              <div class="developer-credit__contacts">
                <a href="mailto:techwisesolutions2026@gmail.com"><i class="pi pi-envelope" /> techwisesolutions2026@gmail.com</a>
                <a href="https://wa.me/918530886358" target="_blank" rel="noopener"><i class="pi pi-whatsapp" /> +91 85308 86358</a>
              </div>
            </div>
          </div>
        </div>
        <small class="profile-footer__copyright">&copy; {{ new Date().getFullYear() }} {{ displayProfile.name }} <em>Powered by GymPulse</em></small>
      </footer>
    </article>
  </main>
</template>

<style scoped>
.public-gym-page{--ink:#101011;--orange:#f36b16;--pink:#ed168c;--paper:#f4f0e9;min-height:100vh;background:var(--paper);color:var(--ink)}
.profile-container{width:min(100% - 40px,1180px);margin-inline:auto}.gym-profile__hero{position:relative;overflow:hidden;padding:20px 0 34px;background:radial-gradient(circle at 75% 18%,rgba(237,22,140,.17),transparent 27%),repeating-linear-gradient(128deg,transparent 0,transparent 62px,rgba(255,255,255,.025) 63px,transparent 65px),#111;color:#fff}.gym-profile__hero:before{position:absolute;inset:55% -8% auto 42%;height:110px;transform:rotate(-7deg);background:var(--orange);opacity:.1;content:''}.hero-nav{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.12)}.public-brand{display:flex;align-items:center;gap:10px}.public-brand__mark{display:grid;place-items:center;width:46px;height:46px;transform:skew(-8deg);background:linear-gradient(145deg,var(--orange),var(--pink));color:#fff;font:800 1.12rem 'Sora',sans-serif;box-shadow:6px 5px 0 rgba(255,255,255,.12)}.public-brand>span:last-child{display:flex;align-items:baseline;gap:5px}.public-brand strong{color:var(--pink);font:800 1.2rem 'Sora',sans-serif}.public-brand small{color:#fff;font-size:.76rem;font-weight:800;text-transform:uppercase}.hero-nav__actions{display:flex;align-items:center;gap:12px}.hero-nav__actions a{display:inline-flex;gap:7px;align-items:center;color:#ddd;font-size:.76rem;font-weight:800}.profile-login{padding:9px 12px;border:1px solid rgba(255,255,255,.25)}
.hero-grid{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1.02fr) minmax(360px,.98fr);gap:58px;align-items:center;padding-block:66px 48px}.eyebrow{margin:0;color:var(--orange);font-size:.72rem;font-weight:800;letter-spacing:.13em;text-transform:uppercase}.hero-copy .eyebrow{display:flex;gap:8px;align-items:center;color:#fff}.hero-copy .eyebrow i{color:var(--orange)}.hero-kicker{margin:26px 0 8px;color:#bbb;font-size:.78rem;font-weight:800;letter-spacing:.2em;text-transform:uppercase}.hero-copy h1{margin:0;font:800 clamp(3.2rem,6.8vw,6rem)/.92 'Sora',sans-serif;letter-spacing:-.06em;text-transform:uppercase}.hero-copy h1 em,.section-heading h2 em{color:var(--orange);font-style:normal}.hero-description{max-width:590px;margin:23px 0 0;color:#c7c7c7;line-height:1.75}.button-row{display:flex;flex-wrap:wrap;gap:11px;margin-top:28px}.button-row a,.motivation-banner>a{display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 20px;transform:skew(-3deg);border:1px solid var(--orange);background:var(--orange);color:#111;font-size:.82rem;font-weight:800}.button-row .quiet{border-color:#555;background:transparent;color:#fff}.hero-image{position:relative;min-height:440px;margin:0;overflow:hidden;border:1px solid #444;box-shadow:17px 17px 0 var(--orange)}.hero-image:before{position:absolute;z-index:2;inset:0;background:linear-gradient(90deg,rgba(16,16,17,.25),transparent 55%),linear-gradient(0deg,rgba(0,0,0,.9),transparent 45%);content:''}.hero-image img{position:absolute;width:100%;height:100%;filter:grayscale(1) contrast(1.08);object-fit:cover}.hero-image figcaption{position:absolute;z-index:3;bottom:22px;left:24px;display:grid;text-transform:uppercase}.hero-image figcaption span{color:#ddd;font-size:.72rem;font-weight:800;letter-spacing:.16em}.hero-image figcaption strong{color:var(--orange);font:800 1.55rem 'Sora',sans-serif}.hours-row{position:relative;z-index:3;display:grid;grid-template-columns:minmax(260px,.75fr) minmax(0,2.25fr);gap:18px;align-items:stretch}.directions-card{display:grid;grid-template-columns:auto 1fr auto;gap:13px;align-items:center;min-height:96px;padding:18px 20px;border:1px solid rgba(242,106,22,.55);background:linear-gradient(135deg,rgba(242,106,22,.18),rgba(242,106,22,.05));color:#fff;box-shadow:0 18px 45px rgba(0,0,0,.28);transition:transform 180ms ease,border-color 180ms ease}.directions-card:hover{transform:translateY(-3px);border-color:var(--orange)}.directions-card__icon{display:grid;place-items:center;width:40px;height:40px;background:var(--orange);color:#111}.directions-card>span:nth-child(2){display:grid;gap:4px}.directions-card small{color:#aaa;font-size:.61rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.directions-card strong{color:#fff;font:700 1rem 'Sora',sans-serif}.directions-card>i{color:var(--orange);font-size:.9rem}.hours-panel{display:grid;grid-template-columns:minmax(140px,.55fr) minmax(250px,1.35fr) minmax(190px,1fr);align-items:stretch;border:1px solid #3d3d3d;background:#1b1b1d;box-shadow:0 18px 45px rgba(0,0,0,.28)}.hours-panel>div{display:flex;align-items:center;min-height:96px;padding:18px 24px;border-right:1px solid #3b3b3b}.hours-panel>div:last-child{border-right:0}.hours-panel__title{gap:10px}.hours-panel__title>i{color:var(--orange);font-size:1.15rem}.hours-panel__title>span{display:grid;gap:3px}.hours-panel__title small,.hours-panel__slot span{color:#929294;font-size:.61rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.hours-panel__title strong{color:#fff;font:700 .78rem 'Sora',sans-serif;text-transform:uppercase}.hours-panel__slot{display:grid!important;align-content:center!important;gap:8px}.hours-panel__slot strong{color:#fff;font:700 1.02rem 'Sora',sans-serif;white-space:nowrap}.hours-panel__slot:first-of-type strong{color:var(--orange)}
.benefit-strip{background:#fff;border-bottom:1px solid #dfd9d0}.benefit-strip__grid{display:grid;grid-template-columns:repeat(5,1fr)}.benefit-strip__grid div{display:flex;gap:9px;align-items:center;justify-content:center;min-height:86px;padding:15px;border-right:1px solid #e5dfd6;text-align:center}.benefit-strip__grid div:last-child{border:0}.benefit-strip i{color:var(--orange);font-size:1.1rem}.benefit-strip span{font-size:.69rem;font-weight:800;text-transform:uppercase}.page-content{padding-bottom:90px}.training-section,.reviews-section{padding-top:92px}.section-heading{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.62fr);gap:50px;align-items:end;margin-bottom:32px}.section-heading h2{max-width:720px;margin:9px 0 0;font:800 clamp(2rem,4vw,3.35rem)/1.05 'Sora',sans-serif;letter-spacing:-.045em;text-transform:uppercase}.section-heading>p{margin:0;color:#67625e;line-height:1.8}.facility-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:14px}.facility{position:relative;grid-column:span 2;min-height:245px;padding:25px;overflow:hidden;border:1px solid #dcd5cc;background:#fff;transition:transform 180ms ease,box-shadow 180ms ease}.facility:nth-child(4),.facility:nth-child(5){grid-column:span 3}.facility:hover{transform:translateY(-5px);box-shadow:9px 9px 0 var(--orange)}.facility-number{position:absolute;top:12px;right:14px;color:#e7e2dc;font:800 2.6rem 'Sora',sans-serif}.facility-icon{display:grid;place-items:center;width:46px;height:46px;margin-bottom:48px;border-radius:50%;background:#171718;color:var(--orange);font-size:1rem}.facility h3{position:relative;margin:0;font:700 1rem 'Sora',sans-serif;text-transform:uppercase}.facility p{position:relative;margin:10px 0 0;color:#706b66;font-size:.78rem;line-height:1.6}.motivation-banner{position:relative;display:flex;justify-content:space-between;align-items:center;gap:30px;margin-top:92px;padding:40px 46px;overflow:hidden;background:linear-gradient(112deg,#151516 0%,#222 68%,#35180b 100%);color:#fff}.motivation-banner:after{position:absolute;right:-40px;width:220px;height:220px;transform:rotate(25deg);background:var(--pink);opacity:.1;content:''}.motivation-banner h2{margin:8px 0;font:800 clamp(1.8rem,4vw,3rem)/1 'Sora',sans-serif;text-transform:uppercase}.motivation-banner p:last-child{margin:0;color:#aaa}.motivation-banner>a{position:relative;z-index:1;flex:none}.section-heading--reviews{align-items:center}.rating-lockup{display:flex;gap:14px;align-items:center}.rating-lockup>strong{font:800 3.8rem 'Sora',sans-serif}.rating-lockup>span{display:grid;grid-template-columns:repeat(5,auto);gap:4px;color:var(--orange)}.rating-lockup small{grid-column:1/-1;margin-top:4px;color:#756f6a;font-size:.66rem;font-weight:800;text-transform:uppercase}.review-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.review-card{min-height:190px;padding:25px;background:#19191b;color:#fff}.review-card>i{color:var(--orange);font-size:1.2rem}.review-card p{margin:22px 0;color:#eee;font-size:.94rem;line-height:1.65}.review-card span{color:#888;font-size:.68rem;font-weight:800;text-transform:uppercase}.maps-review-link{display:inline-flex;align-items:center;gap:8px;margin-top:22px;color:#333;font-size:.8rem;font-weight:800;border-bottom:2px solid var(--orange);padding-bottom:4px}.profile-footer{display:grid;grid-template-columns:auto 1fr auto;gap:40px;align-items:center;padding:32px max(20px,calc((100vw - 1180px)/2));background:#101011;color:#fff}.profile-footer>div:nth-child(2){display:grid;gap:5px}.profile-footer>div:nth-child(2) strong{font-size:.75rem}.profile-footer>div:nth-child(2) span,.profile-footer>small{color:#888;font-size:.68rem}.profile-footer em{color:var(--orange);font-style:normal}.profile-message{min-height:100vh;display:grid;place-items:center;align-content:center;gap:16px;padding:30px;background:var(--paper);text-align:center}.profile-message>i{color:var(--orange);font-size:2rem}.profile-message h1{margin:0;font:700 2rem 'Sora',sans-serif}.profile-message a{padding:12px 16px;background:#171718;color:#fff;font-size:.82rem;font-weight:800}.profile-skeleton{display:grid;gap:24px;padding:8vw max(20px,calc((100vw - 1180px)/2));background:var(--paper)}.profile-skeleton i{display:block;height:90px;background:linear-gradient(90deg,#e7e1d8 25%,#f8f5f0 37%,#e7e1d8 63%);background-size:400% 100%;animation:profile-loading 1.3s infinite}.profile-skeleton i:first-child{height:400px}@keyframes profile-loading{to{background-position:-135% 0}}
.profile-footer{display:block;padding:0 max(20px,calc((100vw - 1180px)/2));background:#101011;color:#fff}.profile-footer__main{display:grid;grid-template-columns:auto 1fr auto;gap:40px;align-items:center;padding:32px 0}.profile-footer__location{display:grid;gap:5px}.profile-footer__location strong{font-size:.75rem}.profile-footer__location span,.profile-footer__main>small{color:#888;font-size:.68rem}.developer-credit{display:grid!important;grid-template-columns:auto minmax(150px,220px) 1fr;gap:20px!important;align-items:center;padding:22px 0;border-top:1px solid #303032}.profile-footer .developer-credit__label{color:#777;font-size:.62rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.developer-credit img{display:block;width:100%;max-width:210px;height:58px;object-fit:contain;border:1px solid #18314b;background:#07223c}.developer-credit__contacts{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:10px 22px}.developer-credit__contacts a{display:inline-flex;align-items:center;gap:7px;color:#aaa;font-size:.7rem;font-weight:700;transition:color 160ms ease}.developer-credit__contacts a:hover{color:var(--orange)}.developer-credit__contacts i{color:var(--orange)}
@media(max-width:850px){.hero-grid{grid-template-columns:1fr}.hero-image{min-height:360px}.hours-row{grid-template-columns:1fr}.hours-panel{grid-template-columns:minmax(120px,.6fr) 1.25fr 1fr}.benefit-strip__grid{grid-template-columns:repeat(2,1fr)}.benefit-strip__grid div:last-child{grid-column:span 2}.facility-grid{grid-template-columns:repeat(2,1fr)}.facility,.facility:nth-child(4),.facility:nth-child(5){grid-column:span 1}.profile-footer{text-align:center}.profile-footer__main{grid-template-columns:1fr;gap:18px}.profile-footer .public-brand{justify-content:center}.developer-credit{grid-template-columns:1fr;justify-items:center}.developer-credit__contacts{justify-content:center}}
@media(max-width:620px){.profile-container{width:min(100% - 28px,1180px)}.hero-nav__actions>a:first-child{display:none}.hero-nav{align-items:flex-start}.public-brand strong{font-size:1rem}.hero-grid{padding-block:50px 34px;gap:38px}.hero-copy h1{font-size:clamp(2.8rem,15vw,4.25rem)}.hero-image{min-height:300px;box-shadow:10px 10px 0 var(--orange)}.hours-panel{grid-template-columns:1fr 1fr}.hours-panel__title{grid-column:1/-1;min-height:62px!important;border-bottom:1px solid #3b3b3b}.hours-panel__slot{min-width:0;padding:16px!important}.hours-panel__slot strong{font-size:.8rem;white-space:normal}.benefit-strip__grid{grid-template-columns:1fr 1fr}.benefit-strip__grid div:last-child{grid-column:span 2}.training-section,.reviews-section{padding-top:66px}.section-heading{grid-template-columns:1fr;gap:24px}.facility-grid,.review-grid{grid-template-columns:1fr}.facility{min-height:205px}.facility-icon{margin-bottom:34px}.motivation-banner{display:grid;margin-top:66px;padding:32px 25px}.motivation-banner>a{justify-self:start}.rating-lockup>strong{font-size:3rem}}
.profile-footer__main{grid-template-columns:auto minmax(280px,1fr) minmax(390px,auto);gap:34px;padding:28px 0}.developer-credit{display:grid!important;grid-template-columns:1fr!important;justify-items:start;gap:7px!important;padding:0;border:0}.developer-credit__content{display:flex;align-items:center;gap:12px}.developer-credit img{width:140px;height:44px;flex:none}.developer-credit__contacts{display:grid;justify-content:start;gap:6px}.developer-credit__contacts a{font-size:.66rem}.profile-footer__copyright{display:block;padding:14px 0 17px;border-top:1px solid #303032;color:#777;font-size:.66rem;text-align:center}.profile-footer__copyright em{margin-left:4px}
@media(max-width:1050px){.profile-footer__main{grid-template-columns:auto 1fr}.developer-credit{grid-column:1/-1}.developer-credit__content{width:100%}.developer-credit__contacts{display:flex;flex-wrap:wrap;gap:8px 18px}}
@media(max-width:850px){.profile-footer__main{grid-template-columns:1fr}.developer-credit{justify-items:center}.developer-credit__content{width:auto;justify-content:center}.developer-credit__contacts{justify-content:center;text-align:left}}
@media(max-width:560px){.developer-credit__content{display:grid;justify-items:center}.developer-credit__contacts{display:grid;justify-items:center;text-align:center}}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
