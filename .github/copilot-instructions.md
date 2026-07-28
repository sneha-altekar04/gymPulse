# Gym Management System — Copilot Instructions

## Product Overview

This repository contains a modern web-based Gym Management System for the Indian market.

The system is primarily used by:

- Gym owners
- Receptionists
- Trainers

The application manages:

- Members
- Memberships
- Membership plans
- Attendance
- Fingerprint attendance
- Payments
- Trainers
- Membership expiry
- Member inactivity
- Reports
- Gym settings

The most important product principle is:

> Help the gym owner understand what requires attention today.

Prefer actionable information over decorative analytics.

This is intended to become a multi-gym SaaS product eventually, even though the initial deployment may serve only one gym.

---

# Technology Stack

Use the following stack unless explicitly instructed otherwise.

## Frontend

- Vue 3
- Vite
- JavaScript
- Composition API
- Vue Router
- Pinia
- PrimeVue
- PrimeIcons

Use JavaScript, NOT TypeScript.

## Backend

Use Firebase:

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Cloud Functions
- Node.js for Cloud Functions

Do not create a traditional REST backend for ordinary CRUD operations.

Use the Firebase JavaScript SDK directly from Vue where appropriate.

Use Cloud Functions for privileged/server-side operations.

## Hosting

Frontend hosting:

- Vercel

Domain/DNS:

- GoDaddy

Source control:

- GitHub

Do NOT use Firebase Hosting.

---

# Technologies Not To Introduce

Do not introduce the following unless explicitly requested:

- TypeScript
- React
- Angular
- .NET
- Java backend
- Python backend
- SQL databases
- MongoDB
- AWS
- Azure
- Docker
- Kubernetes
- Nginx
- Dedicated VPS

Keep infrastructure simple and inexpensive.

---

# Architecture

Expected architecture:

Browser
→ Vercel
→ Vue 3 application
→ Firebase

Firebase provides:

- Authentication
- Firestore
- Storage
- Cloud Functions

Fingerprint attendance follows a separate path:

Fingerprint Device
→ Local Node.js Device Agent
→ Firebase Cloud Function
→ Firestore

Never attempt to communicate directly with a fingerprint device from browser/Vue code.

---

# Project Structure

Prefer the following organization:

src/
├── assets/
├── components/
│   ├── common/
│   ├── dashboard/
│   ├── members/
│   ├── attendance/
│   ├── memberships/
│   ├── payments/
│   ├── trainers/
│   └── reports/
├── layouts/
├── views/
├── router/
├── stores/
├── services/
├── composables/
├── utils/
├── App.vue
└── main.js

Firebase Cloud Functions:

functions/
├── index.js
├── attendance/
├── memberships/
├── payments/
└── notifications/

Fingerprint integration:

device-agent/
├── index.js
├── config.js
├── device/
└── services/

Do not create unnecessary files or abstractions.

Prefer small reusable components over very large Vue components.

Keep Firebase access in service modules rather than scattering Firestore calls throughout UI components.

---

# UI/UX Direction

The application must look like a polished modern SaaS product.

It should feel:

- Modern
- Clean
- Premium
- Energetic
- Professional
- Fitness-oriented
- Easy to navigate

Avoid the appearance of old-fashioned ERP/desktop management software.

## Color Direction

Use a restrained fitness-oriented palette.

Suggested colors:

Primary:
Deep Indigo / Royal Blue

Accent:
Electric Violet or Cyan

Success:
Emerald Green

Warning:
Amber

Danger:
Red

Background:
Very light cool gray

Cards:
White

Primary text:
Dark Slate

Secondary text:
Muted Slate Gray

Use CSS variables/design tokens so branding can be changed later.

Do not hardcode colors repeatedly across components.

---

# Design Principles

Use:

- Strong visual hierarchy
- Comfortable whitespace
- Consistent spacing
- Clear typography
- Subtle borders
- Subtle shadows
- Modern cards
- PrimeIcons
- Appropriate rounded corners
- Hover states
- Smooth but restrained transitions
- Status badges
- Skeleton loading states
- Toast notifications
- Confirmation dialogs
- Empty states
- Helpful error states
- Tooltips where appropriate

Avoid:

- Excessive gradients
- Excessive animations
- Too many colors
- Tiny text
- Overcrowded screens
- Decorative charts without business value
- Excessively rounded UI elements

Accessibility and readability take priority over decoration.

---

# Application Layout

Use a modern dashboard layout.

## Sidebar

The sidebar contains:

Gym logo
Gym name

Dashboard

MANAGEMENT

- Members
- Attendance
- Memberships
- Payments
- Trainers

ANALYTICS

- Reports

SYSTEM

- Settings

Bottom section:

- Logged-in user
- Role
- Logout

Requirements:

- Collapsible
- PrimeIcons
- Active route highlighting
- Easy to scan
- Smooth transitions

## Header

Keep the header simple.

Display:

- Page title
- Current date
- Notifications
- User avatar/menu

Do not overcrowd it.

---

# Dashboard

The Dashboard is the most important screen.

A gym owner should understand the state of the gym within approximately five seconds.

## Primary KPIs

Display:

### Today's Check-ins

Example:

74
+8% vs yesterday

### Active Members

Example:

312

### Expiring Soon

Example:

12
Next 7 days

### Monthly Collection

Example:

₹84,500

KPI cards should have:

- Icon
- Primary number
- Supporting information
- Subtle visual differentiation
- Click behavior where useful

---

# Action Required

The dashboard must contain a prominent:

## Action Required

Display:

- Memberships Expired
- Memberships Expiring Soon
- Payments Pending
- Inactive Members

Example:

8 Memberships Expired

12 Expiring This Week

7 Payments Pending

21 Members Inactive 10+ Days

Every item should eventually be clickable.

Clicking an item should navigate to the relevant filtered screen.

The dashboard should encourage action rather than simply display statistics.

---

# Recent Attendance

Dashboard should show today's recent attendance.

Display:

- Member avatar
- Member name
- Check-in time
- Membership
- Expiry
- Status

Status examples:

ACTIVE

EXPIRING SOON

EXPIRED

---

# Members

Members page should contain:

- Search
- Filters
- Add Member
- Pagination
- Member table

Search by:

- Name
- Mobile
- Member ID

Filters:

- Status
- Membership Plan
- Trainer
- Joining Date

Columns:

- Photo
- Member ID
- Name
- Mobile
- Membership
- Expiry Date
- Trainer
- Status
- Actions

Actions:

- View
- Edit
- Renew Membership
- Record Payment

---

# Member Registration

Organize member registration into logical sections.

## Personal Information

- Photo
- Full Name
- Mobile
- Email
- Gender
- Date of Birth
- Address
- Emergency Contact

## Gym Information

- Joining Date
- Membership Plan
- Trainer
- Fingerprint/Device User ID

## Payment

- Plan Amount
- Discount
- Final Amount
- Amount Paid
- Payment Mode

Payment modes:

- Cash
- UPI
- Card
- Bank Transfer

Do not create one intimidating unstructured form.

---

# Member Details

Member details should use a profile-oriented layout.

Header:

- Photo
- Name
- Member ID
- Mobile
- Membership status

Actions:

- Renew Membership
- Record Payment
- Edit Member

Tabs:

- Overview
- Attendance
- Membership History
- Payments

Overview displays:

- Current Membership
- Joining Date
- Expiry Date
- Trainer
- Total Visits
- Visits This Month
- Last Visit

---

# Memberships

Member and Membership are separate entities.

Never overwrite historical membership records when renewing.

A member may have multiple memberships over time.

Membership fields:

- memberId
- planId
- startDate
- endDate
- originalAmount
- discount
- finalAmount
- status
- createdAt
- updatedAt

Statuses:

- ACTIVE
- EXPIRED
- CANCELLED
- FROZEN

Renewing creates a NEW membership record.

---

# Membership Plans

Plans must be configurable.

Do not hardcode plan definitions.

Example plans:

Monthly
₹1,500
30 days

Quarterly
₹4,000
90 days

Half Yearly
₹7,500
180 days

Annual
₹12,000
365 days

Fields:

- name
- duration
- durationUnit
- price
- description
- active

Plans with historical usage should be deactivated rather than deleted.

---

# Attendance

Attendance page should contain:

- Today's attendance KPI
- Search
- Date/date-range filters
- Member filter
- Membership status filter
- Source filter
- Manual attendance action

Columns:

- Member
- Member ID
- Check-in
- Check-out
- Duration
- Membership Status
- Source

Sources:

- FINGERPRINT
- MANUAL

Attendance must support deduplication.

Never blindly insert fingerprint events.

---

# Payments

Payment page should contain:

KPIs:

- Collection Today
- Collection This Month
- Pending Amount

Columns:

- Receipt Number
- Member
- Date
- Membership
- Amount
- Payment Mode
- Status

Payment modes:

- CASH
- UPI
- CARD
- BANK_TRANSFER

Statuses:

- PAID
- PARTIAL
- PENDING
- REFUNDED

Receipt sequence generation must not happen insecurely in the browser.

---

# Trainers

Trainer information:

- Photo
- Name
- Mobile
- Assigned Members
- Status

Support:

- Add
- Edit
- Activate
- Deactivate

Trainer details should show assigned members.

---

# Reports

Reports should focus on business usefulness.

Provide:

- Attendance Report
- Membership Report
- Collection Report
- Member Activity Report

Support:

- Date filtering
- Search
- Filters
- CSV export

Useful charts include:

- Daily attendance trend
- Monthly revenue trend
- New members vs renewals
- Peak attendance hours

Do not create charts solely for decoration.

---

# Authentication

Use Firebase Authentication.

Initial authentication:

Email + Password

Roles:

OWNER
RECEPTIONIST
TRAINER

User document:

users/{uid}

Example fields:

name
email
role
gymId
active
createdAt

Use Vue Router authentication guards.

Unauthenticated users should be redirected to /login.

---

# Authorization

OWNER:

Full access.

RECEPTIONIST:

Members
Attendance
Memberships
Payments
Basic trainer functionality

TRAINER:

Restricted access to assigned members and relevant functionality.

Do not rely solely on hiding UI elements.

Enforce permissions through Firestore Security Rules and Cloud Functions where appropriate.

---

# Multi-Gym Architecture

Design Firestore for multiple gyms from the beginning.

Use:

gyms/{gymId}

Subcollections:

- members
- memberships
- membershipPlans
- attendance
- payments
- trainers
- devices
- dailyStats

Users are stored separately:

users/{uid}

Every application user belongs to a gym.

Never allow users belonging to one gym to access another gym's data.

---

# Firestore Models

## Member

gyms/{gymId}/members/{memberId}

Suggested fields:

memberCode
firstName
lastName
mobile
email
gender
dateOfBirth
photoUrl
address
emergencyContact
joiningDate
trainerId
deviceUserId
status
createdAt
updatedAt

## Attendance

gyms/{gymId}/attendance/{attendanceId}

Suggested fields:

memberId
deviceId
deviceUserId
checkInTime
checkOutTime
source
eventKey
createdAt

## Payment

gyms/{gymId}/payments/{paymentId}

Suggested fields:

memberId
membershipId
receiptNumber
amount
paymentMode
paymentDate
status
notes
createdAt

## Device

gyms/{gymId}/devices/{deviceId}

Suggested fields:

name
deviceCode
model
location
active
lastSyncAt
createdAt

Never store biometric fingerprint templates in Firestore.

Store only the device's user identifier.

---

# Firebase Dates

Use Firebase Timestamp for persistent date/time values where appropriate.

Do not store formatted date strings as the source of truth.

Initial target timezone:

Asia/Kolkata

Centralize date formatting.

Example display date:

27 Jul 2026

Example time:

07:42 AM

---

# Currency

Initial market:

India

Default currency:

INR

Use Intl.NumberFormat or a centralized formatter.

Example:

₹1,500

₹12,000

₹84,500

Do not concatenate currency symbols manually throughout components.

---

# Firebase Security

Security is critical.

Never create:

allow read, write: if true;

Users should only access their own gym's data.

Users must not be able to modify their own role or gymId to elevate privileges.

Use Cloud Functions/Admin SDK for privileged operations.

Do not trust browser-supplied gymId for sensitive operations.

---

# Firebase Storage

Use Firebase Storage for:

- Member photos
- Trainer photos
- Gym logo

Suggested paths:

gyms/{gymId}/members/{memberId}/profile.jpg

gyms/{gymId}/trainers/{trainerId}/profile.jpg

gyms/{gymId}/logo/logo.png

Use appropriate Storage Security Rules.

---

# Fingerprint Device Integration

Never communicate directly with fingerprint hardware from Vue.

Use:

Fingerprint Device
→ Node.js Device Agent
→ Cloud Function
→ Firestore

Create device integration behind an adapter.

Conceptual interface:

connect()

disconnect()

getUsers()

getAttendanceLogs()

listenForAttendance()

Do not assume a particular fingerprint protocol until the exact device protocol/SDK has been identified.

A mock adapter should be used during initial development.

---

# Device Agent

The future Node.js device agent should:

- Connect to fingerprint device
- Retrieve attendance
- Track synchronization state
- Upload new events
- Retry failed events
- Handle temporary internet failure
- Prevent duplicate uploads
- Log synchronization errors

Keep device integration independent from the Vue application.

---

# Firestore Cost Awareness

Avoid unnecessary reads.

Do not retrieve all historical attendance records to calculate dashboard KPIs.

Use aggregated documents where useful.

Example:

gyms/{gymId}/dailyStats/{YYYY-MM-DD}

Fields may include:

attendanceCount
collectionAmount
newMembers
renewals
updatedAt

Use pagination for large collections.

Avoid unnecessary real-time listeners.

---

# Search

Do not introduce paid search services initially.

Support practical member search using:

- memberCode
- mobile
- normalized name

Create normalized fields where required.

---

# Vercel

Frontend is hosted on Vercel.

Production build:

npm run build

Vite output:

dist

Vue Router routes must work when accessed directly or refreshed.

Examples:

/dashboard
/members
/members/:id
/attendance
/memberships
/payments
/trainers
/reports
/settings

Configure Vercel SPA rewrites when necessary.

---

# Environment Variables

Use Vite environment variables for public Firebase Web SDK configuration.

Expected variables:

VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID

Provide:

.env.example

Never commit .env.

Remember:

VITE_* variables are visible to browser users.

Never place Firebase Admin credentials, private keys, device secrets, or third-party API secrets in frontend environment variables.

---

# Loading States

Never display blank pages while data loads.

Use:

- Skeleton cards
- Skeleton tables
- Progress indicators where appropriate

---

# Empty States

Provide useful empty states.

Example:

No Members

"No members have been added yet."

[Add Your First Member]

Do not simply display empty tables.

---

# Error Handling

Do not expose raw Firebase errors to normal users.

Convert technical errors into understandable messages.

Example:

Instead of:

FirebaseError: Missing or insufficient permissions

Display:

"You don't have permission to perform this action."

Use toast notifications appropriately.

---

# Forms

Forms should:

- Clearly identify required fields
- Validate before submission
- Disable submit during save
- Prevent duplicate submission
- Display field-level validation
- Preserve entered values when save fails
- Display success feedback

Use PrimeVue components consistently.

---

# Confirmation

Use PrimeVue confirmation dialogs for important operations.

Examples:

- Deactivate Member
- Cancel Membership
- Deactivate Trainer
- Refund Payment

Do not use browser alert() or confirm().

---

# Performance

Use Firestore query limits and pagination.

Do not retrieve entire collections unnecessarily.

Use:

limit()
orderBy()
startAfter()

where appropriate.

Only use real-time listeners when real-time behavior provides clear business value.

---

# Code Quality

Prioritize:

- Readability
- Maintainability
- Reusable components
- Small functions
- Clear naming
- Separation of concerns
- Centralized Firebase services
- Centralized constants
- Centralized formatting

Avoid:

- Premature abstraction
- Unnecessary design patterns
- Excessive comments
- Magic strings
- Duplicated queries
- Business logic inside Vue templates
- Huge components

Do not overengineer the MVP.

---

# Constants

Centralize values such as:

MEMBER_STATUS

MEMBERSHIP_STATUS

PAYMENT_STATUS

PAYMENT_METHOD

ATTENDANCE_SOURCE

USER_ROLE

Do not repeatedly hardcode these strings.

---

# Reusable Components

Prefer reusable components such as:

PageHeader

StatCard

StatusBadge

EmptyState

LoadingTable

MemberAvatar

SearchInput

FilterBar

DateRangeFilter

CurrencyDisplay

Create abstractions only when they genuinely improve maintainability.

---

# Responsive Design

Primary target:

Desktop/laptop.

The application should still behave correctly on:

- Tablet
- Mobile browser

Sidebar should collapse on smaller screens.

Tables and filters should remain usable.

Do not make the website behave or look like a native mobile app.

---

# Demo Data

During UI development, use realistic demo data.

Use Indian names and INR values.

Examples:

Rahul Patil
Sneha More
Amit Jadhav
Priya Deshmukh
Rohan Kulkarni
Neha Joshi

Example plans:

Monthly — ₹1,500

Quarterly — ₹4,000

Half Yearly — ₹7,500

Annual — ₹12,000

Include:

- Active members
- Expired memberships
- Expiring memberships
- Attendance
- Payments
- Trainers

Keep mock data separate from production data access.

---

# Development Strategy

Work incrementally.

Do NOT attempt to implement the entire application in a single task.

Development phases:

## Phase 1

UI Foundation

## Phase 2

Core Screens

## Phase 3

Firebase Integration

## Phase 4

Business Logic

## Phase 5

Fingerprint Integration

## Phase 6

Reports

## Phase 7

Production Hardening

After significant changes:

- Run build
- Fix compilation errors
- Check imports
- Check console/runtime issues
- Preserve existing functionality
- Remove unused code

Do not proceed to another major phase unless requested.

---

# Current Development Priority

The initial priority is UI/UX.

Build a visually impressive, navigable application using mock data before integrating Firebase.

The owner should be able to review the application's appearance and workflow before backend development begins.

Do not implement Firebase prematurely unless specifically requested.