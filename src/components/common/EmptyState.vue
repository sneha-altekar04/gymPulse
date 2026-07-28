<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  actionLabel: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['action']);
</script>

<template>
  <div class="empty-state">
    <i class="pi pi-inbox empty-state__icon" aria-hidden="true" />
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <button v-if="actionLabel" type="button" class="app-btn app-btn--secondary" @click="emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>
