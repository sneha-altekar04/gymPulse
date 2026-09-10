import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

import AppLayout from '../layouts/AppLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import MembersView from '../views/MembersView.vue';
import MemberFormView from '../views/MemberFormView.vue';
import MemberDetailsView from '../views/MemberDetailsView.vue';
import AttendanceView from '../views/AttendanceView.vue';
import MembershipsView from '../views/MembershipsView.vue';
import MembershipPlansView from '../views/MembershipPlansView.vue';
import PaymentsView from '../views/PaymentsView.vue';
import MessagesView from '../views/MessagesView.vue';
import TrainersView from '../views/TrainersView.vue';
import SettingsView from '../views/SettingsView.vue';
import LoginView from '../views/LoginView.vue';
import ForgotPasswordView from '../views/ForgotPasswordView.vue';
import PublicGymProfileView from '../views/PublicGymProfileView.vue';

const routes = [
  {
    path: '/',
    name: 'public-gym-profile',
    component: PublicGymProfileView,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: 'Login', requiresAuth: false }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPasswordView,
    meta: { title: 'Forgot Password', requiresAuth: false }
  },
  {
    path: '/app',
    component: AppLayout,
    children: [
      {
        path: '/dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: { title: 'Dashboard', requiresAuth: true }
      },
      {
        path: '/members',
        name: 'members',
        component: MembersView,
        meta: { title: 'Members', requiresAuth: true }
      },
      {
        path: '/members/new',
        name: 'member-new',
        component: MemberFormView,
        meta: { title: 'Add Member', requiresAuth: true }
      },
      {
        path: '/members/:id',
        name: 'member-details',
        component: MemberDetailsView,
        meta: { title: 'Member Details', requiresAuth: true }
      },
      {
        path: '/members/:id/edit',
        name: 'member-edit',
        component: MemberFormView,
        meta: { title: 'Edit Member', requiresAuth: true }
      },
      {
        path: '/attendance',
        name: 'attendance',
        component: AttendanceView,
        meta: { title: 'Attendance', requiresAuth: true }
      },
      {
        path: '/memberships',
        name: 'memberships',
        component: MembershipsView,
        meta: { title: 'Memberships', requiresAuth: true }
      },
      {
        path: '/memberships/plans',
        name: 'membership-plans',
        component: MembershipPlansView,
        meta: { title: 'Membership Plans', requiresAuth: true }
      },
      {
        path: '/payments',
        name: 'payments',
        component: PaymentsView,
        meta: { title: 'Payments', requiresAuth: true }
      },
      {
        path: '/messages',
        name: 'messages',
        component: MessagesView,
        meta: { title: 'Messages', requiresAuth: true }
      },
      {
        path: '/trainers',
        name: 'trainers',
        component: TrainersView,
        meta: { title: 'Trainers', requiresAuth: true }
      },
      {
        path: '/reports',
        name: 'reports',
        component: () => import('../views/ReportsView.vue'),
        meta: { title: 'Reports', requiresAuth: true }
      },
      {
        path: '/settings',
        name: 'settings',
        component: SettingsView,
        meta: { title: 'Settings', requiresAuth: true }
      },
      {
        path: '/admin/seed',
        name: 'admin-seed',
        component: () => import('../components/admin/DatabaseSeedingView.vue'),
        meta: { title: 'Database Seeding', requiresAuth: true, requiresOwner: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

/**
 * Navigation guards for authentication and authorization
 */
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  // Wait for auth state to be fully loaded
  let attempts = 0;
  while (authStore.loading && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 50));
    attempts++;
  }

  // If route requires auth and user is not authenticated, redirect to login
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  const requiresOwner = to.matched.some(record => record.meta.requiresOwner);
  if (requiresOwner && !authStore.isOwner) {
    next({ name: 'dashboard' });
    return;
  }

  // If user is authenticated and tries to access login, redirect to dashboard
  if ((to.name === 'login' || to.name === 'forgot-password') && authStore.isAuthenticated) {
    next({ name: 'dashboard' });
    return;
  }

  // Update page title
  if (to.name !== 'public-gym-profile') document.title = to.meta.title ? `${to.meta.title} | K3 Oxygen` : 'K3 Oxygen';

  next();
});

export default router;