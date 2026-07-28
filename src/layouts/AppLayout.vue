<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useUiStore } from '../stores/uiStore';

const route = useRoute();
const uiStore = useUiStore();

const { isSidebarCollapsed, isMobileSidebarOpen } = storeToRefs(uiStore);

const menuGroups = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', icon: 'pi pi-th-large', to: '/dashboard' }]
  },
  {
    title: 'Management',
    items: [
      { label: 'Members', icon: 'pi pi-users', to: '/members' },
      { label: 'Attendance', icon: 'pi pi-calendar', to: '/attendance' },
      { label: 'Memberships', icon: 'pi pi-id-card', to: '/memberships' },
      { label: 'Payments', icon: 'pi pi-credit-card', to: '/payments' },
      { label: 'Trainers', icon: 'pi pi-briefcase', to: '/trainers' }
    ]
  },
  {
    title: 'Analytics',
    items: [{ label: 'Reports', icon: 'pi pi-chart-line', to: '/reports' }]
  },
  {
    title: 'System',
    items: [{ label: 'Settings', icon: 'pi pi-cog', to: '/settings' }]
  }
];

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

function isRouteActive(targetPath) {
  return route.path === targetPath;
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
        <div class="app-sidebar__brand-mark" aria-hidden="true">
          <i class="pi pi-bolt" />
          <span>GP</span>
        </div>
        <div v-if="!isSidebarCollapsed" class="app-sidebar__brand-copy">
          <h1>GymPulse</h1>
          <p>Downtown Fitness</p>
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
        <div v-for="group in menuGroups" :key="group.title" class="menu-group">
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
          <div class="user-chip__avatar">SP</div>
          <div v-if="!isSidebarCollapsed">
            <p class="user-chip__name">Sneha Patil</p>
            <p class="user-chip__role">Owner</p>
          </div>
        </div>
        <button type="button" class="logout-btn" :aria-label="isSidebarCollapsed ? 'Logout' : ''">
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