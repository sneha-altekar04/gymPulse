<script setup>
import { onMounted, reactive, ref } from 'vue';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import InputSwitch from 'primevue/inputswitch';
import InputText from 'primevue/inputtext';
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

onMounted(load);
</script>

<template>
  <section class="stack-16 messaging-settings">
    <PageHeader title="Settings" subtitle="Configure gym-specific messaging, reminders, and templates." />

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