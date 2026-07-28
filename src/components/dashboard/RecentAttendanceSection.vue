<script setup>
import { computed } from 'vue';

import MemberAvatar from '../common/MemberAvatar.vue';
import StatusBadge from '../common/StatusBadge.vue';
import { formatDate, formatTime } from '../../utils/formatters';

const props = defineProps({
  items: {
    type: Array,
    required: true
  }
});

const normalizedItems = computed(() => {
  const now = Date.now();

  return props.items.map((item) => {
    const minsAgo = Math.floor((now - new Date(item.checkInAt).getTime()) / 60000);
    return {
      ...item,
      minsAgo,
      isJustCheckedIn: minsAgo >= 0 && minsAgo <= 25
    };
  });
});
</script>

<template>
  <section class="dashboard-attendance-panel">
    <div class="dashboard-section-head">
      <div>
        <p class="dashboard-section-head__eyebrow">Live Floor Activity</p>
        <h2 class="dashboard-section-head__title">Today's Recent Attendance</h2>
      </div>
      <button type="button" class="dashboard-section-head__action">
        View All
        <i class="pi pi-arrow-right" aria-hidden="true" />
      </button>
    </div>

    <div class="attendance-list" role="table" aria-label="Recent attendance list">
      <div class="attendance-list__head" role="row">
        <span>Member</span>
        <span>Check-in</span>
        <span>Plan</span>
        <span>Expiry</span>
        <span>Status</span>
      </div>

      <div v-for="item in normalizedItems" :key="item.id" class="attendance-list__row" role="row">
        <div class="attendance-list__member">
          <MemberAvatar :name="item.name" />
          <div>
            <p class="attendance-list__name">{{ item.name }}</p>
            <p class="attendance-list__id">{{ item.id }}</p>
          </div>
        </div>

        <div>
          <p class="attendance-list__value attendance-list__value--strong">{{ formatTime(item.checkInAt) }}</p>
          <p v-if="item.isJustCheckedIn" class="attendance-list__live-tag">Just checked in</p>
        </div>
        <p class="attendance-list__value">{{ item.membershipPlan }}</p>
        <p class="attendance-list__value">{{ item.expiryDate ? formatDate(item.expiryDate) : '--' }}</p>
        <StatusBadge :status="item.status" />
      </div>
    </div>
  </section>
</template>