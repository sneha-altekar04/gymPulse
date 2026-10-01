import test from 'node:test';
import assert from 'node:assert/strict';

import { USER_ROLE } from '../src/constants/domain.js';
import { PERMISSION, hasEveryPermission, hasPermission } from '../src/constants/permissions.js';

test('owner has every application permission', () => {
  assert.equal(hasEveryPermission(USER_ROLE.OWNER, Object.values(PERMISSION)), true);
});

test('receptionist can run front-desk workflows but cannot administer the gym', () => {
  assert.equal(hasPermission(USER_ROLE.RECEPTIONIST, PERMISSION.MANAGE_MEMBERS), true);
  assert.equal(hasPermission(USER_ROLE.RECEPTIONIST, PERMISSION.RECORD_PAYMENTS), true);
  assert.equal(hasPermission(USER_ROLE.RECEPTIONIST, PERMISSION.MANAGE_SETTINGS), false);
  assert.equal(hasPermission(USER_ROLE.RECEPTIONIST, PERMISSION.MANAGE_TRAINERS), false);
});

test('trainer access is limited to member, attendance, membership, and report views', () => {
  assert.equal(hasPermission(USER_ROLE.TRAINER, PERMISSION.MANAGE_ATTENDANCE), true);
  assert.equal(hasPermission(USER_ROLE.TRAINER, PERMISSION.VIEW_REPORTS), true);
  assert.equal(hasPermission(USER_ROLE.TRAINER, PERMISSION.VIEW_PAYMENTS), false);
  assert.equal(hasPermission(USER_ROLE.TRAINER, PERMISSION.MANAGE_MEMBERS), false);
});

test('unknown roles and permissions are denied', () => {
  assert.equal(hasPermission('UNKNOWN', PERMISSION.VIEW_DASHBOARD), false);
  assert.equal(hasPermission(USER_ROLE.OWNER, 'unknown.permission'), false);
});

