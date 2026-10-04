<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';

import { useUiStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { useGymStore } from '../stores/gymStore';
import { PERMISSION } from '../constants/permissions';
import k3Logo from '../../designs/k3-oxygen-minimal.png';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const uiStore = useUiStore();
const authStore = useAuthStore();
const gymStore = useGymStore();

const { isSidebarCollapsed, isMobileSidebarOpen } = storeToRefs(uiStore);
const { userProfile } = storeToRefs(authStore);

onMounted(async () => {
  if (authStore.gymId && !gymStore.dataLoaded) {
    try {
      await gymStore.loadData();
    } catch (err) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load gym data.', life: 4000 });
    }
  }
});

const menuGroups = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', icon: 'pi pi-th-large', to: '/dashboard', permission: PERMISSION.VIEW_DASHBOARD }]
  },
  {
    title: 'Management',
    items: [
      { label: 'Members', icon: 'pi pi-users', to: '/members', permission: PERMISSION.VIEW_MEMBERS },
      { label: 'Attendance', icon: 'pi pi-calendar', to: '/attendance', permission: PERMISSION.VIEW_ATTENDANCE },
      { label: 'Memberships', icon: 'pi pi-id-card', to: '/memberships', permission: PERMISSION.VIEW_MEMBERSHIPS },
      { label: 'Payments', icon: 'pi pi-credit-card', to: '/payments', permission: PERMISSION.VIEW_PAYMENTS },
      { label: 'Messages', icon: 'pi pi-comments', to: '/messages', permission: PERMISSION.VIEW_MESSAGES },
      { label: 'Trainers', icon: 'pi pi-briefcase', to: '/trainers', permission: PERMISSION.MANAGE_TRAINERS },
      { label: 'PT Plans', icon: 'pi pi-list', to: '/pt-plans', permission: PERMISSION.MANAGE_PLANS }
    ]
  },
  {
    title: 'Analytics',
    items: [{ label: 'Reports', icon: 'pi pi-chart-line', to: '/reports', permission: PERMISSION.VIEW_REPORTS }]
  },
  {
    title: 'System',
    items: [{ label: 'Settings', icon: 'pi pi-cog', to: '/settings', permission: PERMISSION.MANAGE_SETTINGS }]
  }
];

const visibleMenuGroups = computed(() => menuGroups
  .map((group) => ({ ...group, items: group.items.filter((item) => authStore.can(item.permission)) }))
  .filter((group) => group.items.length));

const pageTitle = computed(() => route.meta.title || 'Dashboard');

const currentDate = computed(() => {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  }).format(new Date());
});

const userInitials = computed(() => {
  if (!userProfile.value) return 'U';
  const names = userProfile.value.name?.split(' ') || [];
  if (names.length >= 2) {
    return (names[0][0] + names[1][0]).toUpperCase();
  }
  return userProfile.value.name?.substring(0, 2).toUpperCase() || 'U';
});

const userRole = computed(() => {
  const role = userProfile.value?.role;
  const roleMap = {
    'OWNER': 'Owner',
    'MANAGER': 'Manager',
    'RECEPTIONIST': 'Receptionist',
    'TRAINER': 'Trainer'
  };
  return roleMap[role] || role || 'User';
});

function isRouteActive(targetPath) {
  return route.path === targetPath;
}

async function handleLogout() {
  try {
    await authStore.logout();
    toast.add({
      severity: 'info',
      summary: 'Logged Out',
      detail: 'You have been successfully logged out.',
      life: 3000
    });
    router.push({ name: 'public-gym-profile' });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Logout Failed',
      detail: error.message,
      life: 4000
    });
  }
}
</script>

<template>
  <div class="app-shell">
    <div
      v-if="isMobileSidebarOpen"
      class="app-shell__backdrop"
      @click="uiStore.closeMobileSidebar"
    />

    <aside
      class="app-sidebar"
      :class="{
        'app-sidebar--collapsed': isSidebarCollapsed,
        'app-sidebar--mobile-open': isMobileSidebarOpen
      }"
    >
      <div class="app-sidebar__brand">
        <img class="app-sidebar__brand-logo" :src="k3Logo" alt="K3 Oxygen Gym" />
        <div v-if="!isSidebarCollapsed" class="app-sidebar__brand-copy">
          <h1><span>K3</span> Oxygen</h1>
          <p>Gym</p>
        </div>
      </div>

      <button
        type="button"
        class="app-sidebar__collapse-btn"
        @click="uiStore.toggleSidebarCollapsed"
      >
        <i class="pi" :class="isSidebarCollapsed ? 'pi-angle-right' : 'pi-angle-left'" />
      </button>

      <nav class="app-sidebar__nav" aria-label="Main navigation">
        <div v-for="group in visibleMenuGroups" :key="group.title" class="menu-group">
          <p v-if="!isSidebarCollapsed" class="menu-group__title">{{ group.title }}</p>
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="menu-link"
            :class="{ 'menu-link--active': isRouteActive(item.to) }"
            @click="uiStore.closeMobileSidebar"
          >
            <i :class="item.icon" />
            <span v-if="!isSidebarCollapsed">{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>

      <div class="app-sidebar__footer">
        <div class="user-chip">
          <div class="user-chip__avatar">{{ userInitials }}</div>
          <div v-if="!isSidebarCollapsed">
            <p class="user-chip__name">{{ userProfile?.name || 'User' }}</p>
            <p class="user-chip__role">{{ userRole }}</p>
          </div>
        </div>
        <button
          type="button"
          class="logout-btn"
          :aria-label="isSidebarCollapsed ? 'Logout' : ''"
          @click="handleLogout"
        >
          <i class="pi pi-sign-out" />
          <span v-if="!isSidebarCollapsed">Logout</span>
        </button>
      </div>
    </aside>

    <div class="app-main">
      <header class="app-header">
        <div class="app-header__left">
          <button type="button" class="mobile-menu-btn" @click="uiStore.openMobileSidebar">
            <i class="pi pi-bars" />
          </button>
          <div>
            <h2>{{ pageTitle }}</h2>
            <p>{{ currentDate }}</p>
          </div>
        </div>

        <div class="app-header__right">
          <button type="button" class="header-icon-btn" aria-label="Notifications">
            <i class="pi pi-bell" />
          </button>
          <button type="button" class="header-icon-btn" aria-label="Profile menu">
            <i class="pi pi-user" />
          </button>
        </div>
      </header>

      <main class="app-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
