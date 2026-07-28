import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const isSidebarCollapsed = ref(false);
  const isMobileSidebarOpen = ref(false);

  function toggleSidebarCollapsed() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
  }

  function openMobileSidebar() {
    isMobileSidebarOpen.value = true;
  }

  function closeMobileSidebar() {
    isMobileSidebarOpen.value = false;
  }

  return {
    isSidebarCollapsed,
    isMobileSidebarOpen,
    toggleSidebarCollapsed,
    openMobileSidebar,
    closeMobileSidebar
  };
});