<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    required: true
  },
  tone: {
    type: String,
    default: ''
  }
});

const normalized = computed(() => props.status.trim().toUpperCase());

const badgeClass = computed(() => {
  if (props.tone) {
    return `status-badge status-badge--${props.tone}`;
  }

  if (normalized.value === 'ACTIVE' || normalized.value === 'PAID') {
    return 'status-badge status-badge--success';
  }

  if (normalized.value === 'EXPIRING SOON' || normalized.value === 'PENDING') {
    return 'status-badge status-badge--warning';
  }

  if (
    normalized.value === 'EXPIRED' ||
    normalized.value === 'CANCELLED' ||
    normalized.value === 'REFUNDED'
  ) {
    return 'status-badge status-badge--danger';
  }

  if (normalized.value === 'PARTIAL') {
    return 'status-badge status-badge--accent';
  }

  return 'status-badge status-badge--neutral';
});
</script>

<template>
  <span :class="badgeClass">{{ status }}</span>
</template>