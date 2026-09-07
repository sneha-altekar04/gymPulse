<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';

import EmptyState from '../components/common/EmptyState.vue';
import MemberAvatar from '../components/common/MemberAvatar.vue';
import MessageComposerDialog from '../components/messages/MessageComposerDialog.vue';
import PageHeader from '../components/common/PageHeader.vue';
import StatCard from '../components/common/StatCard.vue';
import StatusBadge from '../components/common/StatusBadge.vue';
import { MESSAGE_STATUS } from '../constants/domain';
import { getMessageLogs, getMessageTemplates, retryFailedMessage } from '../services/firebase/messageService';
import { useAuthStore } from '../stores/authStore';
import { useGymStore } from '../stores/gymStore';
import { formatDateTime } from '../utils/formatters';

const authStore = useAuthStore();
const gymStore = useGymStore();
const route = useRoute();
const toast = useToast();
const composerVisible = ref(false);
const loading = ref(false);
const logs = ref([]);
const templates = ref([]);
const search = ref('');
const selectedStatus = ref('ALL');
const selectedType = ref('ALL');
const selectedChannel = ref('ALL');
const statusOptions = ['ALL', ...Object.values(MESSAGE_STATUS)];
const channelOptions = ['ALL', 'WHATSAPP'];

const templateNames = computed(() => Object.fromEntries(templates.value.map((template) => [template.id, template.name])));
const typeOptions = computed(() => ['ALL', ...new Set(templates.value.map((template) => template.type))]);
const filteredLogs = computed(() => {
  const term = search.value.trim().toLowerCase();
  return logs.value.filter((log) => {
    const searchMatch = !term || log.memberName?.toLowerCase().includes(term) || log.phone?.includes(term);
    return searchMatch && (selectedStatus.value === 'ALL' || log.status === selectedStatus.value) &&
      (selectedType.value === 'ALL' || log.messageType === selectedType.value) &&
      (selectedChannel.value === 'ALL' || log.channel === selectedChannel.value);
  });
});
const counts = computed(() => ({
  sent: logs.value.filter((log) => log.status === MESSAGE_STATUS.SENT).length,
  delivered: logs.value.filter((log) => log.status === MESSAGE_STATUS.DELIVERED).length,
  failed: logs.value.filter((log) => log.status === MESSAGE_STATUS.FAILED).length,
  pending: logs.value.filter((log) => log.status === MESSAGE_STATUS.QUEUED).length
}));

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  return value;
}

async function loadMessages() {
  if (!authStore.gymId) return;
  loading.value = true;
  try {
    [logs.value, templates.value] = await Promise.all([
      getMessageLogs(authStore.gymId),
      getMessageTemplates(authStore.gymId)
    ]);
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Messages unavailable', detail: error.message, life: 4000 });
  } finally {
    loading.value = false;
  }
}

async function retry(log) {
  try {
    await retryFailedMessage(log.id);
    toast.add({ severity: 'success', summary: 'Retry submitted', detail: `Message for ${log.memberName} was sent again.`, life: 3000 });
    await loadMessages();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Retry failed', detail: error.message, life: 4000 });
  }
}

onMounted(async () => {
  await loadMessages();
  if (route.query.compose === '1') composerVisible.value = true;
});
</script>

<template>
  <section class="stack-16 messages-view">
    <PageHeader title="Messages" subtitle="Send member updates and monitor delivery outcomes.">
      <template #actions><Button label="Send Message" icon="pi pi-plus" @click="composerVisible = true" /></template>
    </PageHeader>

    <div class="dashboard-grid-kpis">
      <StatCard title="Messages Sent" :value="counts.sent" helper="Accepted by provider" icon="pi pi-send" tone="primary" />
      <StatCard title="Messages Delivered" :value="counts.delivered" helper="Confirmed delivery" icon="pi pi-check-circle" tone="success" />
      <StatCard title="Messages Failed" :value="counts.failed" helper="Require attention" icon="pi pi-exclamation-triangle" tone="danger" />
      <StatCard title="Messages Pending" :value="counts.pending" helper="Queued for processing" icon="pi pi-clock" tone="warning" />
    </div>

    <div class="panel-card stack-16">
      <div class="panel-card__header">
        <div><p class="panel-card__eyebrow">Communication log</p><h3 class="panel-card__title">Message History</h3></div>
        <Button icon="pi pi-refresh" text aria-label="Refresh history" title="Refresh history" :loading="loading" @click="loadMessages" />
      </div>
      <div class="message-filters">
        <span class="p-input-icon-left"><i class="pi pi-search" /><InputText v-model="search" placeholder="Search member or mobile" /></span>
        <Dropdown v-model="selectedStatus" :options="statusOptions" placeholder="Status" />
        <Dropdown v-model="selectedType" :options="typeOptions" placeholder="Message type" />
        <Dropdown v-model="selectedChannel" :options="channelOptions" placeholder="Channel" />
      </div>

      <div v-if="filteredLogs.length" class="app-table-wrap">
        <table class="app-table">
          <thead><tr><th>Member</th><th>Message</th><th>Channel</th><th>Sent At</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="log.id">
              <td><div class="message-history-member"><MemberAvatar :name="log.memberName" /><div><strong>{{ log.memberName }}</strong><small>{{ log.phone }}</small></div></div></td>
              <td><div class="message-history-content"><strong>{{ templateNames[log.templateId] || log.messageType }}</strong><span>{{ log.content }}</span></div></td>
              <td><i class="pi pi-whatsapp" /> {{ log.channel }}</td>
              <td>{{ log.sentAt ? formatDateTime(toDate(log.sentAt)) : '--' }}</td>
              <td><StatusBadge :status="log.status" /></td>
              <td><Button v-if="log.status === MESSAGE_STATUS.FAILED" icon="pi pi-replay" label="Retry" text aria-label="Retry message" title="Retry message" @click="retry(log)" /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState v-else title="No messages found" description="Send a message or adjust the current filters." action-label="Send Message" @action="composerVisible = true" />
    </div>

    <MessageComposerDialog
      v-model:visible="composerVisible"
      :members="gymStore.membersDetailed"
      :templates="templates"
      :gym-name="authStore.userProfile?.gymName || 'Your Gym'"
      :gym-phone="authStore.userProfile?.gymPhone || '--'"
      :initial-member-id="typeof route.query.memberId === 'string' ? route.query.memberId : ''"
      :initial-recipient-type="typeof route.query.recipientType === 'string' ? route.query.recipientType : ''"
      @sent="loadMessages"
    />
  </section>
</template>