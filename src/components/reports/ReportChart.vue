<script setup>
import { computed } from 'vue';
import { Bar, Doughnut, Line } from 'vue-chartjs';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip);
const props = defineProps({ chart: { type: Object, required: true } });
const components = { bar: Bar, doughnut: Doughnut, line: Line };
const chartComponent = computed(() => components[props.chart.type] || Bar);
const hasData = computed(() => props.chart.datasets?.some((dataset) => dataset.data?.some((value) => Number(value) !== 0)));
const data = computed(() => ({ labels: props.chart.labels, datasets: props.chart.datasets }));

function getNumericValues(datasets = []) {
  return datasets.flatMap((dataset) => (Array.isArray(dataset.data) ? dataset.data : [])).map((value) => Number(value)).filter((value) => Number.isFinite(value));
}

const options = computed(() => {
  if (props.chart.type === 'doughnut') {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } }, tooltip: { callbacks: {} } }
    };
  }

  const numericValues = getNumericValues(props.chart.datasets);
  const isIntegerSeries = numericValues.length > 0 && numericValues.every((value) => Number.isInteger(value));
  const maxValue = numericValues.length ? Math.max(...numericValues) : 0;
  const stepSize = isIntegerSeries ? Math.max(1, Math.ceil(maxValue / 5)) : undefined;

  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true } }, tooltip: { callbacks: undefined } },
    scales: {
      x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 9 } },
      y: { beginAtZero: true, grid: { color: '#ecece7' }, ticks: isIntegerSeries ? { precision: 0, stepSize } : undefined }
    }
  };
});
</script>

<template>
  <section class="report-chart">
    <h3>{{ chart.title }}</h3>
    <div v-if="hasData" class="report-chart__canvas"><component :is="chartComponent" :data="data" :options="options" /></div>
    <div v-else class="report-chart__empty"><i class="pi pi-chart-line" /><p>{{ chart.emptyMessage }}</p></div>
  </section>
</template>