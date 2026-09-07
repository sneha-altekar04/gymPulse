<script setup>
import { computed, ref, watch } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';

import MemberAvatar from '../common/MemberAvatar.vue';
import StatusBadge from '../common/StatusBadge.vue';
import { MESSAGE_CHANNEL, RECIPIENT_TYPE } from '../../constants/domain';
import { sendMessageCampaign } from '../../services/firebase/messageService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { renderMessageTemplate } from '../../utils/messageUtils';

const props = defineProps({
  visible: { type: Boolean, default: false },
  members: { type: Array, default: () => [] },
  templates: { type: Array, default: () => [] },
  gymName: { type: String, default: 'Your Gym' },
  gymPhone: { type: String, default: '--' },
  initialMemberId: { type: String, default: '' },
  initialRecipientType: { type: String, default: '' }
});

const emit = defineEmits(['update:visible', 'sent']);
const confirm = useConfirm();
const toast = useToast();
const recipientType = ref(RECIPIENT_TYPE.SINGLE_MEMBER);
const selectedMemberIds = ref([]);
const templateId = ref('');
const sending = ref(false);

const recipientOptions = [
  { label: 'Single Member', value: RECIPIENT_TYPE.SINGLE_MEMBER },
  { label: 'Selected Members', value: RECIPIENT_TYPE.SELECTED_MEMBERS },
  { label: 'All Active Members', value: RECIPIENT_TYPE.ALL_ACTIVE },
  { label: 'Expiring Members', value: RECIPIENT_TYPE.EXPIRING_SOON },
  { label: 'Expired Members', value: RECIPIENT_TYPE.EXPIRED },
  { label: 'Pending Payment Members', value: RECIPIENT_TYPE.PENDING_PAYMENT },
  { label: 'All Members', value: RECIPIENT_TYPE.ALL_MEMBERS }
];

const activeTemplates = computed(() => props.templates.filter((template) => template.active));
const selectedTemplate = computed(() => activeTemplates.value.find((template) => template.id === templateId.value));
const requiresMemberSelection = computed(() => [RECIPIENT_TYPE.SINGLE_MEMBER, RECIPIENT_TYPE.SELECTED_MEMBERS].includes(recipientType.value));
const selectableMembers = computed(() => props.members.filter((member) => member.mobile));

const estimatedRecipients = computed(() => {
  if (requiresMemberSelection.value) return props.members.filter((member) => selectedMemberIds.value.includes(member.id));
  if (recipientType.value === RECIPIENT_TYPE.ALL_MEMBERS) return props.members;
  if (recipientType.value === RECIPIENT_TYPE.ALL_ACTIVE) {
    return props.members.filter((member) => ['ACTIVE', 'EXPIRING SOON'].includes(member.membershipStatus));
  }
  if (recipientType.value === RECIPIENT_TYPE.EXPIRING_SOON) return props.members.filter((member) => member.membershipStatus === 'EXPIRING SOON');
  if (recipientType.value === RECIPIENT_TYPE.EXPIRED) return props.members.filter((member) => member.membershipStatus === 'EXPIRED');
  if (recipientType.value === RECIPIENT_TYPE.PENDING_PAYMENT) return props.members.filter((member) => member.outstandingBalance > 0);
  return [];
});

const previewMember = computed(() => estimatedRecipients.value[0] || props.members[0]);
const preview = computed(() => {
  if (!selectedTemplate.value) return 'Select a template to preview the message.';
  const member = previewMember.value;
  return renderMessageTemplate(selectedTemplate.value.content, {
    memberName: member?.fullName || 'Rahul Patil',
    gymName: props.gymName,
    membershipPlan: member?.membershipPlanName || 'Quarterly',
    expiryDate: member?.membershipExpiryDate ? formatDate(member.membershipExpiryDate) : '28 Sep 2026',
    daysRemaining: member?.latestMembership ? Math.max(Math.ceil((new Date(member.latestMembership.endDate) - new Date()) / 86400000), 0) : 7,
    amountDue: formatCurrency(member?.outstandingBalance || 0),
    gymPhone: props.gymPhone
  });
});

const canSend = computed(() => selectedTemplate.value && estimatedRecipients.value.length > 0 && !sending.value);

watch(() => props.visible, (visible) => {
  if (!visible) return;
  recipientType.value = props.initialRecipientType || (props.initialMemberId ? RECIPIENT_TYPE.SINGLE_MEMBER : RECIPIENT_TYPE.SINGLE_MEMBER);
  selectedMemberIds.value = props.initialMemberId ? [props.initialMemberId] : [];
  templateId.value = activeTemplates.value[0]?.id || '';
});

watch(recipientType, (value) => {
  if (![RECIPIENT_TYPE.SINGLE_MEMBER, RECIPIENT_TYPE.SELECTED_MEMBERS].includes(value)) selectedMemberIds.value = [];
  if (value === RECIPIENT_TYPE.SINGLE_MEMBER && selectedMemberIds.value.length > 1) selectedMemberIds.value = selectedMemberIds.value.slice(0, 1);
});

function close() {
  if (!sending.value) emit('update:visible', false);
}

function requestSend() {
  if (!canSend.value) return;
  confirm.require({
    header: 'Confirm Message Campaign',
    message: `You are about to send this message to ${estimatedRecipients.value.length} member${estimatedRecipients.value.length === 1 ? '' : 's'}.`,
    icon: 'pi pi-send',
    acceptLabel: 'Send Messages',
    accept: send
  });
}

async function send() {
  sending.value = true;
  try {
    const result = await sendMessageCampaign({
      name: selectedTemplate.value.name,
      templateId: templateId.value,
      recipientType: recipientType.value,
      memberIds: selectedMemberIds.value
    });
    toast.add({ severity: result.failedCount ? 'warn' : 'success', summary: 'Campaign processed', detail: `${result.recipientCount} recipient${result.recipientCount === 1 ? '' : 's'} processed.`, life: 3500 });
    emit('sent', result);
    emit('update:visible', false);
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Message not sent', detail: error.message, life: 4500 });
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <Dialog :visible="visible" modal header="Send Message" :style="{ width: 'min(820px, 96vw)' }" @update:visible="emit('update:visible', $event)">
    <div class="message-composer">
      <div class="message-composer__fields">
        <label class="app-field">
          <span>Channel</span>
          <Dropdown :model-value="MESSAGE_CHANNEL.WHATSAPP" :options="[{ label: 'WhatsApp', value: MESSAGE_CHANNEL.WHATSAPP }]" option-label="label" option-value="value" disabled />
        </label>
        <label class="app-field">
          <span>Recipients</span>
          <Dropdown v-model="recipientType" :options="recipientOptions" option-label="label" option-value="value" />
        </label>
        <label class="app-field app-field--full">
          <span>Template</span>
          <Dropdown v-model="templateId" :options="activeTemplates" option-label="name" option-value="id" placeholder="Select an active template" />
        </label>
        <label v-if="requiresMemberSelection" class="app-field app-field--full">
          <span>{{ recipientType === RECIPIENT_TYPE.SINGLE_MEMBER ? 'Member' : 'Members' }}</span>
          <MultiSelect
            v-model="selectedMemberIds"
            :options="selectableMembers"
            option-label="fullName"
            option-value="id"
            filter
            :filter-fields="['fullName', 'mobile']"
            display="chip"
            :selection-limit="recipientType === RECIPIENT_TYPE.SINGLE_MEMBER ? 1 : undefined"
            placeholder="Search members"
          >
            <template #option="slotProps">
              <div class="message-member-option">
                <MemberAvatar :name="slotProps.option.fullName" />
                <div><strong>{{ slotProps.option.fullName }}</strong><small>{{ slotProps.option.mobile }} | {{ slotProps.option.membershipPlanName }}</small></div>
                <StatusBadge :status="slotProps.option.membershipStatus" />
              </div>
            </template>
          </MultiSelect>
        </label>
      </div>

      <div class="message-preview">
        <div class="message-preview__head"><span>Message preview</span><span>Selected: {{ estimatedRecipients.length }} members</span></div>
        <p>{{ preview }}</p>
        <small v-if="previewMember">Previewed with {{ previewMember.fullName }}'s current membership data.</small>
      </div>

      <div class="form-actions">
        <Button label="Cancel" severity="secondary" outlined :disabled="sending" @click="close" />
        <Button label="Send Message" icon="pi pi-send" :loading="sending" :disabled="!canSend" @click="requestSend" />
      </div>
    </div>
  </Dialog>
</template>