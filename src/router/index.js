import { createRouter, createWebHistory } from 'vue-router';

import AppLayout from '../layouts/AppLayout.vue';
import DashboardView from '../views/DashboardView.vue';
import MembersView from '../views/MembersView.vue';
import MemberFormView from '../views/MemberFormView.vue';
import MemberDetailsView from '../views/MemberDetailsView.vue';
import AttendanceView from '../views/AttendanceView.vue';
import MembershipsView from '../views/MembershipsView.vue';
import MembershipPlansView from '../views/MembershipPlansView.vue';
import PaymentsView from '../views/PaymentsView.vue';
import TrainersView from '../views/TrainersView.vue';
import ReportsView from '../views/ReportsView.vue';
import SettingsView from '../views/SettingsView.vue';

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: { title: 'Dashboard' }
      },
      {
        path: 'members',
        name: 'members',
        component: MembersView,
        meta: { title: 'Members' }
      },
      {
        path: 'members/new',
        name: 'member-new',
        component: MemberFormView,
        meta: { title: 'Add Member' }
      },
      {
        path: 'members/:id',
        name: 'member-details',
        component: MemberDetailsView,
        meta: { title: 'Member Details' }
      },
      {
        path: 'members/:id/edit',
        name: 'member-edit',
        component: MemberFormView,
        meta: { title: 'Edit Member' }
      },
      {
        path: 'attendance',
        name: 'attendance',
        component: AttendanceView,
        meta: { title: 'Attendance' }
      },
      {
        path: 'memberships',
        name: 'memberships',
        component: MembershipsView,
        meta: { title: 'Memberships' }
      },
      {
        path: 'memberships/plans',
        name: 'membership-plans',
        component: MembershipPlansView,
        meta: { title: 'Membership Plans' }
      },
      {
        path: 'payments',
        name: 'payments',
        component: PaymentsView,
        meta: { title: 'Payments' }
      },
      {
        path: 'trainers',
        name: 'trainers',
        component: TrainersView,
        meta: { title: 'Trainers' }
      },
      {
        path: 'reports',
        name: 'reports',
        component: ReportsView,
        meta: { title: 'Reports' }
      },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsView,
        meta: { title: 'Settings' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;