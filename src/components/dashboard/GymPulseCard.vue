<script setup>
defineProps({
  stats: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <section class="gym-pulse-card panel-card">
    <div class="dashboard-section-head">
      <div>
        <p class="dashboard-section-head__eyebrow">Signature Insight</p>
        <h2 class="dashboard-section-head__title">Gym Pulse</h2>
      </div>
      <span class="gym-pulse-card__dot" aria-hidden="true" />
    </div>

    <p class="gym-pulse-card__subtitle">Today's activity snapshot</p>

    <div class="gym-pulse-meta">
      <div>
        <p>Check-ins</p>
        <h3>{{ stats.todayCheckIns }}</h3>
      </div>
      <div>
        <p>Peak Time</p>
        <h3 class="gym-pulse-meta__peak">{{ stats.peakTime }}</h3>
      </div>
      <div>
        <p>Most Active</p>
        <h3>{{ stats.mostActivePeriod }}</h3>
      </div>
      <div>
        <p>vs Yesterday</p>
        <h3 :class="stats.comparedToYesterday >= 0 ? 'gym-pulse-meta__delta gym-pulse-meta__delta--up' : 'gym-pulse-meta__delta gym-pulse-meta__delta--down'">
          {{ stats.comparedToYesterday >= 0 ? '+' : '' }}{{ stats.comparedToYesterday }}%
        </h3>
      </div>
    </div>

    <div class="gym-pulse-bars" role="img" aria-label="Hourly activity bars">
      <div v-for="slot in stats.hourly" :key="slot.label" class="gym-pulse-bars__row">
        <span>{{ slot.label }}</span>
        <div class="gym-pulse-bars__track">
          <div class="gym-pulse-bars__fill" :style="{ width: `${slot.intensity}%` }" />
        </div>
      </div>
    </div>
  </section>
</template>
