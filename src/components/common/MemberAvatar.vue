<script setup>
import { computed } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'md'
  },
  imageUrl: {
    type: String,
    default: ''
  }
});

const initials = computed(() => {
  return props.name
    .split(' ')
    .map((chunk) => chunk[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
});

const toneKey = computed(() => {
  const pinnedTones = {
    NJ: 'teal',
    RK: 'violet',
    AJ: 'coral',
    SM: 'amber',
    RP: 'cyan'
  };

  if (pinnedTones[initials.value]) {
    return pinnedTones[initials.value];
  }

  const palette = ['violet', 'teal', 'coral', 'amber', 'cyan'];
  const seed = props.name
    .split('')
    .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 0);

  return palette[seed % palette.length];
});
</script>

<template>
  <div
    class="member-avatar"
    :class="[`member-avatar--${size}`, `member-avatar--tone-${toneKey}`]"
  >
    <img v-if="imageUrl" :src="imageUrl" :alt="name" class="member-avatar__image" />
    <span v-else>{{ initials }}</span>
  </div>
</template>
