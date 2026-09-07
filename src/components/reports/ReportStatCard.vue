<script setup>
import { computed } from 'vue';
import { formatCurrency } from '../../utils/formatters';

const props = defineProps({ metric: { type: Object, required: true } });
const value = computed(() => {
  if (props.metric.format === 'currency') return formatCurrency(Number(props.metric.value || 0));
  if (props.metric.format === 'percent') return `${Number(props.metric.value || 0).toFixed(1)}%`;
  if (props.metric.format === 'decimal') return Number(props.metric.value || 0).toFixed(1);
  if (props.metric.format === 'date' || props.metric.format === 'text') return props.metric.value;
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(Number(props.metric.value || 0));
});
const comparisonClass = computed(() => {
  if (props.metric.comparison === null) return '';
  const favorable = props.metric.inverse ? props.metric.comparison < 0 : props.metric.comparison > 0;
  return favorable ? 'report-stat__comparison--positive' : props.metric.comparison === 0 ? 'report-stat__comparison--neutral' : 'report-stat__comparison--negative';
});
</script>

<template>
  <article class="report-stat" :class="`report-stat--${metric.accent}`">
    <div class="report-stat__icon"><i :class="metric.icon" /></div>
    <div><p class="report-stat__label">{{ metric.label }}</p><p class="report-stat__value">{{ value }}</p><p v-if="metric.subtitle" class="report-stat__subtitle">{{ metric.subtitle }}</p><p v-if="metric.comparison !== null" class="report-stat__comparison" :class="comparisonClass"><i :class="metric.comparison > 0 ? 'pi pi-arrow-up' : metric.comparison < 0 ? 'pi pi-arrow-down' : 'pi pi-minus'" /> {{ Math.abs(metric.comparison) }}% vs previous period</p></div>
  </article>
</template>