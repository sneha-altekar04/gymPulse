<script setup>
import { computed } from 'vue';

import { formatCurrency } from '../../utils/formatters';

const props = defineProps({
  clickable: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  helper: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    required: true
  },
  tone: {
    type: String,
    default: 'primary'
  },
  format: {
    type: String,
    default: 'number'
  },
  context: {
    type: String,
    default: ''
  },
  trendText: {
    type: String,
    default: ''
  },
  progress: {
    type: Number,
    default: null
  },
  variant: {
    type: String,
    default: 'default'
  },
  visualType: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['click']);

function activate() {
  if (props.clickable) emit('click');
}

const formattedValue = computed(() => {
  if (props.format === 'currency') {
    return formatCurrency(Number(props.value));
  }

  return new Intl.NumberFormat('en-IN').format(Number(props.value));
});

const clampedProgress = computed(() => Math.max(Math.min(Number(props.progress) || 0, 100), 0));

const sparkBars = computed(() => {
  const base = clampedProgress.value;
  return [
    Math.max(18, Math.round(base * 0.45)),
    Math.max(24, Math.round(base * 0.62)),
    Math.max(26, Math.round(base * 0.52)),
    Math.max(22, Math.round(base * 0.78)),
    Math.max(20, Math.round(base * 0.66))
  ];
});

const ringProgress = computed(() => {
  return {
    '--ring-progress': `${clampedProgress.value}%`
  };
});
</script>

<template>
  <article
    class="stat-card"
    :class="[`stat-card--${tone}`, `stat-card--${variant}`, { 'stat-card--clickable': clickable }]"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="activate"
    @keydown.enter="activate"
    @keydown.space.prevent="activate"
  >
    <div class="stat-card__icon-wrap">
      <i :class="icon" class="stat-card__icon" aria-hidden="true" />
    </div>
    <div class="stat-card__content">
      <p class="stat-card__title">{{ title }}</p>
      <h3 class="stat-card__value">{{ formattedValue }}</h3>
      <p class="stat-card__helper">{{ helper }}</p>
      <p v-if="context" class="stat-card__context">{{ context }}</p>
      <p v-if="trendText" class="stat-card__trend">{{ trendText }}</p>

      <div
        v-if="variant === 'dashboard' && visualType === 'spark'"
        class="stat-card__mini stat-card__mini--spark"
        role="presentation"
      >
        <span v-for="(bar, idx) in sparkBars" :key="idx" :style="{ height: `${bar}%` }" />
      </div>

      <div
        v-else-if="variant === 'dashboard' && visualType === 'ring'"
        class="stat-card__mini stat-card__mini--ring"
        role="presentation"
        :style="ringProgress"
      >
        <span>{{ clampedProgress }}%</span>
      </div>

      <div
        v-else-if="variant === 'dashboard' && visualType === 'urgency'"
        class="stat-card__mini stat-card__mini--urgency"
        role="presentation"
      >
        <span :style="{ width: `${clampedProgress}%` }" />
      </div>

      <div v-else-if="progress !== null" class="stat-card__progress" role="presentation">
        <span :style="{ width: `${clampedProgress}%` }" />
      </div>
    </div>
  </article>
</template>