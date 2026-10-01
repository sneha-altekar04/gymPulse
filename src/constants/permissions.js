import { USER_ROLE } from './domain.js';

export const PERMISSION = Object.freeze({
  VIEW_DASHBOARD: 'dashboard.view',
  VIEW_MEMBERS: 'members.view',
  MANAGE_MEMBERS: 'members.manage',
  VIEW_ATTENDANCE: 'attendance.view',
  MANAGE_ATTENDANCE: 'attendance.manage',
  VIEW_MEMBERSHIPS: 'memberships.view',
  MANAGE_MEMBERSHIPS: 'memberships.manage',
  MANAGE_PLANS: 'plans.manage',
  VIEW_PAYMENTS: 'payments.view',
  RECORD_PAYMENTS: 'payments.record',
  VIEW_MESSAGES: 'messages.view',
  SEND_MESSAGES: 'messages.send',
  MANAGE_TRAINERS: 'trainers.manage',
  VIEW_REPORTS: 'reports.view',
  MANAGE_SETTINGS: 'settings.manage',
  SEED_DATABASE: 'database.seed'
});

const operationalPermissions = [
  PERMISSION.VIEW_DASHBOARD,
  PERMISSION.VIEW_MEMBERS,
  PERMISSION.MANAGE_MEMBERS,
  PERMISSION.VIEW_ATTENDANCE,
  PERMISSION.MANAGE_ATTENDANCE,
  PERMISSION.VIEW_MEMBERSHIPS,
  PERMISSION.MANAGE_MEMBERSHIPS,
  PERMISSION.VIEW_PAYMENTS,
  PERMISSION.RECORD_PAYMENTS,
  PERMISSION.VIEW_MESSAGES,
  PERMISSION.SEND_MESSAGES,
  PERMISSION.VIEW_REPORTS
];

export const ROLE_PERMISSIONS = Object.freeze({
  [USER_ROLE.OWNER]: Object.freeze(Object.values(PERMISSION)),
  [USER_ROLE.MANAGER]: Object.freeze([
    ...operationalPermissions,
    PERMISSION.MANAGE_PLANS,
    PERMISSION.MANAGE_TRAINERS
  ]),
  [USER_ROLE.RECEPTIONIST]: Object.freeze(operationalPermissions),
  [USER_ROLE.TRAINER]: Object.freeze([
    PERMISSION.VIEW_DASHBOARD,
    PERMISSION.VIEW_MEMBERS,
    PERMISSION.VIEW_ATTENDANCE,
    PERMISSION.MANAGE_ATTENDANCE,
    PERMISSION.VIEW_MEMBERSHIPS,
    PERMISSION.VIEW_REPORTS
  ])
});

export function hasPermission(role, permission) {
  return Boolean(role && permission && ROLE_PERMISSIONS[role]?.includes(permission));
}

export function hasEveryPermission(role, permissions = []) {
  return permissions.every((permission) => hasPermission(role, permission));
}

