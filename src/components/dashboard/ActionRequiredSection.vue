<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
});

const router = useRouter();

function navigateTo(route) {
  router.push(route);
}
</script>

<template>
  <section class="dashboard-action-strip">
    <div class="dashboard-section-head">
      <div>
        <p class="dashboard-section-head__eyebrow">Priorities</p>
        <h2 class="dashboard-section-head__title">Action Required</h2>
      </div>
      <span class="dashboard-section-head__chip">Today</span>
    </div>

    <div class="action-strip-grid">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="action-strip-item"
        :class="`action-strip-item--${item.tone}`"
        @click="navigateTo(item.route)"
      >
        <p class="action-strip-item__count">{{ item.count }}</p>
        <p class="action-strip-item__title">{{ item.title }}</p>
        <p class="action-strip-item__detail">{{ item.detail }}</p>
        <p class="action-strip-item__cta">
          {{ item.tone === 'neutral' ? 'Re-engage' : item.tone === 'danger' ? 'Renew now' : item.tone === 'warning' ? 'Follow up' : 'Collect dues' }}
          <i class="pi pi-arrow-right" aria-hidden="true" />
        </p>
      </button>
    </div>
  </section>
</template>