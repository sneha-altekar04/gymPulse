<template>
  <Toast position="top-right" />
  <ConfirmDialog />
  <RouterView />
</template>

<script setup>
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
</script>