<script setup>
import { computed } from 'vue';

import { formatCurrency } from '../../utils/formatters';

const props = defineProps({
  value: {
    type: Number,
    required: true
  }
});

const text = computed(() => formatCurrency(props.value));
</script>

<template>
  <span>{{ text }}</span>
</template>
