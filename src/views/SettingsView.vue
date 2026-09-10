<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import InputSwitch from 'primevue/inputswitch';
import InputText from 'primevue/inputtext';
import InputTextarea from 'primevue/textarea';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

import MessageTemplateDialog from '../components/messages/MessageTemplateDialog.vue';
import PersonalTrainingPlanDialog from '../components/members/PersonalTrainingPlanDialog.vue';
import PageHeader from '../components/common/PageHeader.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import { MESSAGE_CHANNEL, MESSAGE_TYPE } from '../constants/domain';
import {
  createMessageTemplate,
  getMessageSettings,
  getMessageTemplates,
  saveMessageSettings,
  updateMessageTemplate
} from '../services/firebase/messageService';
import { useAuthStore } from '../stores/authStore';
import { useGymStore } from '../stores/gymStore';
import { getPublicGymProfileForGym, isValidGymSlug, normaliseGymSlug, savePublicGymProfile } from '../services/firebase/publicGymProfileService';
import { formatCurrency } from '../utils/formatters';

const authStore = useAuthStore();
const gymStore = useGymStore();
const toast = useToast();
const confirm = useConfirm();
const templates = ref([]);
const loading = ref(false);
const saving = ref(false);
const templateDialogVisible = ref(false);
const editingTemplate = ref(null);
const ptPlanDialogVisible = ref(false);
const editingPtPlan = ref(null);
const profileSaving = ref(false);
const savedProfileSlug = ref('');
const landingPageUrl = `${window.location.origin}/`;
const facilityName = ref('');
const publicProfile = reactive({ name: '', slug: '', tagline: '', description: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', googleMapsUrl: '', website: '', instagram: '', facebook: '', ownerName: '', ownerDesignation: '', ownerIntroduction: '', facilities: [], openingHours: {}, publicProfileEnabled: true });
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const profileUrl = computed(() => landingPageUrl);
const settings = reactive({ provider: 'MOCK', channel: MESSAGE_CHANNEL.WHATSAPP, enabled: true, reminderDays: [7, 3, 1], sendOnExpiry: false, paymentReminders: true, defaultSender: '', batchSize: 10, maxRetries: 2 });

const defaultTemplates = [
  { name: 'Membership Expiry - 7 Days', type: MESSAGE_TYPE.EXPIRY_7_DAYS, content: 'Hi {{memberName}}, your {{membershipPlan}} membership at {{gymName}} expires on {{expiryDate}}. Renew your membership to continue without interruption. Contact {{gymPhone}} for assistance.' },
  { name: 'Membership Expiry - 3 Days', type: MESSAGE_TYPE.EXPIRY_3_DAYS, content: 'Hi {{memberName}}, only 3 days remain on your {{membershipPlan}} membership at {{gymName}}. It expires on {{expiryDate}}. Contact {{gymPhone}} to renew.' },
  { name: 'Membership Expiry - Tomorrow', type: MESSAGE_TYPE.EXPIRY_1_DAY, content: 'Hi {{memberName}}, your {{membershipPlan}} membership at {{gymName}} expires tomorrow, {{expiryDate}}. Contact {{gymPhone}} to renew.' },
  { name: 'Membership Expired', type: MESSAGE_TYPE.MEMBERSHIP_EXPIRED, content: 'Hi {{memberName}}, your {{membershipPlan}} membership at {{gymName}} expires today. Contact {{gymPhone}} to renew and continue your workouts.' },
  { name: 'Payment Reminder', type: MESSAGE_TYPE.PAYMENT_REMINDER, content: 'Hi {{memberName}}, a payment of {{amountDue}} is pending for your membership at {{gymName}}. Contact {{gymPhone}} for assistance.' },
  { name: 'General Announcement', type: MESSAGE_TYPE.GENERAL_ANNOUNCEMENT, content: 'Hi {{memberName}}, we have an update from {{gymName}}. Contact {{gymPhone}} for more information.' }
];

async function load() {
  if (!authStore.gymId) return;
  loading.value = true;
  try {
    const [savedSettings, savedTemplates] = await Promise.all([getMessageSettings(authStore.gymId), getMessageTemplates(authStore.gymId)]);
    Object.assign(settings, savedSettings);
    templates.value = savedTemplates;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Settings unavailable', detail: error.message, life: 4000 });
  } finally {
    loading.value = false;
  }
}

async function loadPublicProfile() {
  if (!authStore.gymId) return;
  const fallbackName = authStore.userProfile?.gymName || 'My Gym';
  const fallbackSlug = normaliseGymSlug(fallbackName);
  try {
    const savedProfile = await getPublicGymProfileForGym(authStore.gymId);
    Object.assign(publicProfile, { name: fallbackName, slug: fallbackSlug, facilities: [], openingHours: {}, publicProfileEnabled: true, ...(savedProfile || {}) });
    savedProfileSlug.value = savedProfile?.slug || '';
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gym profile unavailable', detail: error.message, life: 4000 });
  }
}

function addFacility() {
  const name = facilityName.value.trim();
  if (!name || publicProfile.facilities.some((facility) => facility.name.toLowerCase() === name.toLowerCase())) return;
  publicProfile.facilities.push({ name, icon: 'star' });
  facilityName.value = '';
}

async function saveGymProfile() {
  publicProfile.slug = normaliseGymSlug(publicProfile.slug);
  if (!publicProfile.name.trim() || !isValidGymSlug(publicProfile.slug)) {
    toast.add({ severity: 'warn', summary: 'Check your profile', detail: 'Gym name and a valid lowercase URL slug are required.', life: 3500 });
    return;
  }
  profileSaving.value = true;
  try {
    savedProfileSlug.value = await savePublicGymProfile(authStore.gymId, { ...publicProfile }, savedProfileSlug.value);
    toast.add({ severity: 'success', summary: 'Gym profile saved', detail: 'Your public profile is ready to share.', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Profile not saved', detail: error.message, life: 4000 });
  } finally {
    profileSaving.value = false;
  }
}

function previewPublicProfile() {
  window.open('/', '_blank', 'noopener');
}

async function copyProfileLink() {
  try {
    await navigator.clipboard.writeText(profileUrl.value);
    toast.add({ severity: 'success', summary: 'Link copied', detail: 'Your public profile link is ready to share.', life: 2500 });
  } catch {
    toast.add({ severity: 'warn', summary: 'Copy unavailable', detail: 'Copy the public profile URL from the field.', life: 3500 });
  }
}

async function saveSettings() {
  saving.value = true;
  try {
    await saveMessageSettings(authStore.gymId, { ...settings }, authStore.currentUser.uid);
    toast.add({ severity: 'success', summary: 'Messaging settings saved', detail: 'Reminder configuration is now active for this gym.', life: 3000 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Settings not saved', detail: error.message, life: 4000 });
  } finally {
    saving.value = false;
  }
}

function openTemplate(template = null) {
  editingTemplate.value = template;
  templateDialogVisible.value = true;
}

async function saveTemplate(payload) {
  try {
    if (editingTemplate.value) await updateMessageTemplate(authStore.gymId, editingTemplate.value.id, payload);
    else await createMessageTemplate(authStore.gymId, payload, authStore.currentUser.uid);
    templateDialogVisible.value = false;
    await load();
    toast.add({ severity: 'success', summary: 'Template saved', detail: 'The message template is ready to use.', life: 2800 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Template not saved', detail: error.message, life: 4000 });
  }
}

function toggleTemplate(template) {
  confirm.require({
    header: template.active ? 'Deactivate Template' : 'Activate Template',
    message: `${template.active ? 'Deactivate' : 'Activate'} ${template.name}? Historical messages will remain unchanged.`,
    accept: async () => {
      await updateMessageTemplate(authStore.gymId, template.id, { active: !template.active });
      await load();
    }
  });
}

async function createDefaults() {
  const existingTypes = new Set(templates.value.map((template) => template.type));
  const missing = defaultTemplates.filter((template) => !existingTypes.has(template.type));
  await Promise.all(missing.map((template) => createMessageTemplate(authStore.gymId, {
    ...template,
    gymId: authStore.gymId,
    channel: MESSAGE_CHANNEL.WHATSAPP,
    variables: [...template.content.matchAll(/{{(\w+)}}/g)].map((match) => match[1]),
    active: true
  }, authStore.currentUser.uid)));
  await load();
  toast.add({ severity: 'success', summary: 'Default templates ready', detail: `${missing.length} template${missing.length === 1 ? '' : 's'} created.`, life: 3000 });
}

function openPtPlan(plan = null) {
  editingPtPlan.value = plan;
  ptPlanDialogVisible.value = true;
}

async function savePtPlan(payload) {
  try {
    if (editingPtPlan.value) await gymStore.updatePtPlan(editingPtPlan.value.id, payload);
    else await gymStore.createPtPlan(payload);
    ptPlanDialogVisible.value = false;
    toast.add({ severity: 'success', summary: 'PT plan saved', detail: 'Personal Training pricing is ready for registration.', life: 2800 });
  } catch (error) {
    toast.add({ severity: 'error', summary: 'PT plan not saved', detail: error.message, life: 4000 });
  }
}

function togglePtPlan(plan) {
  confirm.require({
    header: plan.status === 'ACTIVE' ? 'Deactivate PT Plan' : 'Activate PT Plan',
    message: 'Historical subscriptions will remain unchanged.',
    accept: () => gymStore.togglePtPlanActive(plan.id)
  });
}

onMounted(() => { load(); loadPublicProfile(); });
</script>

<template>
  <section class="stack-16 messaging-settings">
    <PageHeader title="Settings" subtitle="Configure gym-specific messaging, reminders, and templates." />

    <div class="panel-card stack-16 public-profile-settings">
      <div class="panel-card__header"><div><p class="panel-card__eyebrow">Gym Profile</p><h3 class="panel-card__title">Your public visitor page</h3></div><InputSwitch v-model="publicProfile.publicProfileEnabled" :disabled="!authStore.isOwner" /></div>
      <p class="settings-empty-copy">Only these fields are published. Private member, payment, attendance, and staff data are never included.</p>
      <div class="public-profile-url"><div><span>Public landing page</span><strong>{{ profileUrl }}</strong></div><div class="table-actions"><Button icon="pi pi-copy" text aria-label="Copy public profile link" title="Copy public profile link" @click="copyProfileLink" /><Button label="Preview Profile" icon="pi pi-external-link" outlined @click="previewPublicProfile" /></div></div>
      <div class="public-profile-fields"><label class="app-field"><span>Gym Name *</span><InputText v-model="publicProfile.name" :disabled="!authStore.isOwner" /></label><label class="app-field"><span>Profile URL slug *</span><InputText v-model="publicProfile.slug" placeholder="ironfit-fitness" :disabled="!authStore.isOwner" @blur="publicProfile.slug = normaliseGymSlug(publicProfile.slug)" /><small>Lowercase letters, numbers, and hyphens only.</small></label><label class="app-field"><span>Public phone</span><InputText v-model="publicProfile.phone" :disabled="!authStore.isOwner" /></label><label class="app-field public-profile-fields__wide"><span>Tagline</span><InputText v-model="publicProfile.tagline" :disabled="!authStore.isOwner" /></label><label class="app-field public-profile-fields__wide"><span>About the gym</span><InputTextarea v-model="publicProfile.description" rows="3" auto-resize :disabled="!authStore.isOwner" /></label><label class="app-field public-profile-fields__wide"><span>Address</span><InputText v-model="publicProfile.address" :disabled="!authStore.isOwner" /></label><label class="app-field"><span>City</span><InputText v-model="publicProfile.city" :disabled="!authStore.isOwner" /></label><label class="app-field"><span>State</span><InputText v-model="publicProfile.state" :disabled="!authStore.isOwner" /></label><label class="app-field"><span>Pincode</span><InputText v-model="publicProfile.pincode" :disabled="!authStore.isOwner" /></label><label class="app-field"><span>Google Maps URL</span><InputText v-model="publicProfile.googleMapsUrl" :disabled="!authStore.isOwner" /></label><label class="app-field"><span>Website</span><InputText v-model="publicProfile.website" :disabled="!authStore.isOwner" /></label><label class="app-field"><span>Instagram URL</span><InputText v-model="publicProfile.instagram" :disabled="!authStore.isOwner" /></label><label class="app-field"><span>Facebook URL</span><InputText v-model="publicProfile.facebook" :disabled="!authStore.isOwner" /></label><label class="app-field"><span>Owner name</span><InputText v-model="publicProfile.ownerName" :disabled="!authStore.isOwner" /></label><label class="app-field"><span>Owner designation</span><InputText v-model="publicProfile.ownerDesignation" placeholder="Founder & Owner" :disabled="!authStore.isOwner" /></label><label class="app-field public-profile-fields__wide"><span>Owner introduction</span><InputTextarea v-model="publicProfile.ownerIntroduction" rows="2" auto-resize :disabled="!authStore.isOwner" /></label></div>
      <div class="profile-subsection"><p class="panel-card__eyebrow">Facilities</p><div class="facility-editor"><InputText v-model="facilityName" placeholder="e.g. Functional Training" :disabled="!authStore.isOwner" @keyup.enter="addFacility" /><Button icon="pi pi-plus" aria-label="Add facility" title="Add facility" :disabled="!authStore.isOwner" @click="addFacility" /></div><div class="facility-tags"><span v-for="(facility, index) in publicProfile.facilities" :key="`${facility.name}-${index}`">{{ facility.name }}<button :disabled="!authStore.isOwner" :aria-label="`Remove ${facility.name}`" @click="publicProfile.facilities.splice(index, 1)"><i class="pi pi-times" /></button></span></div></div>
      <div class="profile-subsection"><p class="panel-card__eyebrow">Opening Hours</p><div class="hours-editor"><label v-for="day in weekdays" :key="day"><span>{{ day }}</span><InputText v-model="publicProfile.openingHours[day]" placeholder="6:00 AM - 10:00 PM or Closed" :disabled="!authStore.isOwner" /></label></div></div>
      <div class="table-actions"><Button label="Save Changes" icon="pi pi-check" :loading="profileSaving" :disabled="!authStore.isOwner" @click="saveGymProfile" /><small v-if="!authStore.isOwner">Only gym owners can update the public profile.</small></div>
    </div>

    <div class="settings-section-grid">
      <div class="panel-card stack-16">
        <div class="panel-card__header"><div><p class="panel-card__eyebrow">Messaging Provider</p><h3 class="panel-card__title">WhatsApp Configuration</h3></div><StatusBadge status="MOCK MODE" tone="accent" /></div>
        <div class="settings-provider-row"><div class="settings-provider-icon"><i class="pi pi-whatsapp" /></div><div><strong>MockMessageProvider</strong><p>Official WhatsApp credentials are not connected. No real messages will be sent.</p></div></div>
        <label class="app-field"><span>Default Sender</span><InputText v-model="settings.defaultSender" placeholder="GymPulse Front Desk" /></label>
        <div class="settings-toggle-row"><div><strong>Messaging enabled</strong><p>Allow campaigns and scheduled reminders for this gym.</p></div><InputSwitch v-model="settings.enabled" /></div>
      </div>

      <div class="panel-card stack-16">
        <div><p class="panel-card__eyebrow">Automation</p><h3 class="panel-card__title">Membership Expiry Reminders</h3></div>
        <label v-for="day in [7, 3, 1]" :key="day" class="settings-checkbox-row"><Checkbox v-model="settings.reminderDays" :input-id="`reminder-${day}`" :value="day" /><span>{{ day }} day{{ day === 1 ? '' : 's' }} before expiry</span></label>
        <label class="settings-checkbox-row"><Checkbox v-model="settings.sendOnExpiry" input-id="on-expiry" binary /><span>On expiry</span></label>
        <label class="settings-checkbox-row"><Checkbox v-model="settings.paymentReminders" input-id="payment-reminders" binary /><span>Payment reminders</span></label>
        <Button label="Save Messaging Settings" icon="pi pi-check" :loading="saving" :disabled="!authStore.isOwner" @click="saveSettings" />
        <small v-if="!authStore.isOwner">Only gym owners can change messaging settings.</small>
      </div>
    </div>

    <div class="panel-card stack-16">
      <div class="panel-card__header">
        <div><p class="panel-card__eyebrow">Approved message content</p><h3 class="panel-card__title">Templates</h3></div>
        <div class="table-actions"><Button v-if="!templates.length" label="Create Defaults" icon="pi pi-sparkles" severity="secondary" :disabled="!authStore.isOwner" @click="createDefaults" /><Button label="Create Template" icon="pi pi-plus" :disabled="!authStore.isOwner" @click="openTemplate()" /></div>
      </div>
      <div v-if="templates.length" class="app-table-wrap"><table class="app-table"><thead><tr><th>Name</th><th>Channel</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody><tr v-for="template in templates" :key="template.id"><td>{{ template.name }}</td><td>{{ template.channel }}</td><td>{{ template.type }}</td><td><StatusBadge :status="template.active ? 'ACTIVE' : 'INACTIVE'" /></td><td class="table-actions"><Button icon="pi pi-eye" text aria-label="View or edit template" title="View or edit template" @click="openTemplate(template)" /><Button :icon="template.active ? 'pi pi-ban' : 'pi pi-check-circle'" text :aria-label="template.active ? 'Deactivate template' : 'Activate template'" :title="template.active ? 'Deactivate template' : 'Activate template'" @click="toggleTemplate(template)" /></td></tr></tbody></table></div>
      <p v-else class="settings-empty-copy">No messaging templates have been configured for this gym.</p>
    </div>

    <div class="panel-card stack-16">
      <div class="panel-card__header">
        <div><p class="panel-card__eyebrow">Personal Training</p><h3 class="panel-card__title">PT Plans and Pricing</h3></div>
        <Button label="Create PT Plan" icon="pi pi-plus" :disabled="!authStore.isOwner" @click="openPtPlan()" />
      </div>
      <div v-if="gymStore.personalTrainingPlans.length" class="app-table-wrap">
        <table class="app-table"><thead><tr><th>Plan</th><th>Duration</th><th>Price</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          <tr v-for="plan in gymStore.personalTrainingPlans" :key="plan.id"><td>{{ plan.name }}</td><td>{{ plan.duration }} {{ plan.durationUnit }}</td><td>{{ formatCurrency(plan.price) }}</td><td>{{ plan.description || '--' }}</td><td><StatusBadge :status="plan.status" /></td><td class="table-actions"><Button icon="pi pi-pencil" text aria-label="Edit PT plan" title="Edit PT plan" :disabled="!authStore.isOwner" @click="openPtPlan(plan)" /><Button :icon="plan.status === 'ACTIVE' ? 'pi pi-ban' : 'pi pi-check-circle'" text :aria-label="plan.status === 'ACTIVE' ? 'Deactivate PT plan' : 'Activate PT plan'" :title="plan.status === 'ACTIVE' ? 'Deactivate PT plan' : 'Activate PT plan'" :disabled="!authStore.isOwner" @click="togglePtPlan(plan)" /></td></tr>
        </tbody></table>
      </div>
      <p v-else class="settings-empty-copy">No Personal Training plans configured. Add a duration-based plan to offer PT during registration.</p>
    </div>

    <MessageTemplateDialog v-model:visible="templateDialogVisible" :template="editingTemplate" @save="saveTemplate" />
    <PersonalTrainingPlanDialog v-model:visible="ptPlanDialogVisible" :plan="editingPtPlan" @save="savePtPlan" />
  </section>
</template>

<style scoped>
.public-profile-settings{border-top:4px solid var(--color-violet)}.public-profile-url{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:13px;border:1px solid var(--border-soft);border-radius:var(--radius-input);background:var(--bg-card-soft)}.public-profile-url span,.public-profile-url strong{display:block}.public-profile-url span{color:var(--text-muted);font-size:.68rem;font-weight:800;text-transform:uppercase}.public-profile-url strong{margin-top:3px;color:var(--primary-strong);font-size:.8rem;overflow-wrap:anywhere}.public-profile-fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.public-profile-fields__wide{grid-column:span 3}.public-profile-fields small{margin-top:4px;color:var(--text-muted);font-size:.68rem}.profile-subsection{padding-top:16px;border-top:1px solid var(--border-soft)}.facility-editor{display:flex;gap:8px;max-width:420px;margin-top:10px}.facility-editor :deep(.p-inputtext){flex:1}.facility-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}.facility-tags span{display:inline-flex;align-items:center;gap:5px;padding:5px 7px 5px 10px;border-radius:var(--radius-pill);background:var(--tint-violet);color:var(--color-violet);font-size:.75rem;font-weight:800}.facility-tags button{padding:0;border:0;background:transparent;color:inherit;cursor:pointer}.hours-editor{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 18px;margin-top:10px}.hours-editor label{display:grid;grid-template-columns:100px 1fr;align-items:center;gap:8px;color:var(--text-muted);font-size:.78rem;font-weight:800}@media(max-width:800px){.public-profile-fields{grid-template-columns:1fr 1fr}.public-profile-fields__wide{grid-column:span 2}.hours-editor{grid-template-columns:1fr}.public-profile-url{align-items:flex-start;flex-direction:column}}@media(max-width:560px){.public-profile-fields{grid-template-columns:1fr}.public-profile-fields__wide{grid-column:span 1}.hours-editor label{grid-template-columns:1fr}}
</style>