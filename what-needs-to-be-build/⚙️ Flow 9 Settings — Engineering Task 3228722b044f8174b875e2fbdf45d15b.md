# ⚙️ Flow 9: Settings — Engineering Task

Personal account settings and facility-level configuration. This is the "my account" and "this facility" layer — everything that doesn't belong to a dedicated flow like team management (Flow 3) or pricing (Flow 6).

---

## Context & Scope

**What Flow 9 owns:** User profile editing, access info display, facility info editing, facility-level team tab, notification preferences, and security settings (password, 2FA stub, sessions).

**What Flow 9 delegates:**

| Delegated to | What | Why |
| --- | --- | --- |
| Flow 2.5 | Org profile tab (name, description, contact, logo) | Org-level setting, lives on `/org/[slug]/settings` |
| Flow 2.6 | Billing tab | Org-level, feature-flagged stub |
| Flow 3 | Org-level team management (invite all roles, edit/remove) | Full RBAC flow with invite lifecycle |
| Flow 4 | Facility profile (photos, amenities) during onboarding | Setup wizard owns initial config |
| 🖼️ Image System | Avatar and facility photo uploads | Shared upload component |

**Two settings pages exist in the dashboard:**

1. **Org Settings** (`/org/[slug]/settings`) — owned by Flow 2 (profile tab) + Flow 3 (team tab) + Flow 2 (billing tab). Admin only.
2. **Facility Settings** (`/org/[slug]/f/[facilitySlug]/settings`) — owned by **Flow 9**. Admin + manager. Some tabs visible to staff.

---

## Prerequisites

- Flow 1 (Auth) — user is authenticated
- Flow 3 (RBAC) — role determines which tabs are visible
- 🖼️ Image System — for avatar upload
- `users` table ✅
- `facilities` table ✅

---

## RBAC: Who Sees What in Facility Settings

| Tab | `org_admin` | `facility_manager` | `staff` |
| --- | --- | --- | --- |
| Mi Perfil (9.1) | ✅ | ✅ | ✅ |
| Info del Local (9.3) | ✅ | ✅ | ❌ Hidden |
| Equipo del Local (9.4) | ✅ | ✅ | ❌ Hidden |
| Notificaciones (9.5) | ✅ | ✅ | ✅ |
| Seguridad (9.6/9.7) | ✅ | ✅ | ✅ |

Staff sees only: Mi Perfil, Notificaciones, Seguridad. They cannot edit facility info or manage the facility team.

---

## Sub-flows

| # | Sub-flow | Route / Component | Priority |
| --- | --- | --- | --- |
| 9.1 | User profile (name, email, phone, avatar) | Facility Settings → Mi Perfil tab | P0 |
| 9.2 | User access info (read-only: org, role, facilities) | Mi Perfil tab → Access section | P0 |
| 9.3 | Facility info editing | Facility Settings → Info del Local tab | P0 |
| 9.4 | Facility team tab (view + manage staff) | Facility Settings → Equipo tab | P1 |
| 9.5 | Notification preferences | Facility Settings → Notificaciones tab | P2 |
| 9.6 | Security — change password | Facility Settings → Seguridad tab | P0 |
| 9.7 | Security — 2FA + session management | Seguridad tab → stubs | P2 |

---

## Sub-flow Specifications

---

### 9.1 User Profile

**Tab:** Mi Perfil

**Priority:** P0

**Access:** All three roles

**Reference:** [Facility Settings screen — Tab 1](https://www.notion.so/Dashboard-Facility-Settings-screen-30a8722b044f81828c98ffc65ad79e22?pvs=21)

#### Form Fields

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| Avatar | Image upload (circular) | No | PNG/JPG/WebP, max 2MB, uses `AvatarUpload` from Image System |
| Nombre | Text | Yes | 2-100 chars |
| Email | Email | Yes | Valid format. Changing email requires re-verification (future) |
| Teléfono | Tel | No | Peruvian format or E.164 |

#### Avatar Upload

- Circular crop preview using `AvatarUpload` component (variant of `ImageUpload` from 🖼️ Image System)
- Click to upload or drag-and-drop
- Fallback: initials on primary-500 background
- Stored as Cloudflare Image ID in `users.avatar_url`
- Google OAuth users: show their Google avatar by default, can override with custom upload

#### Acceptance Criteria

- [ ]  Form pre-filled with current user data
- [ ]  Avatar upload with circular preview and initials fallback
- [ ]  Google OAuth avatar shown by default if no custom avatar
- [ ]  Name field required, 2-100 chars
- [ ]  Email shown but **read-only for MVP** (changing email is complex — verification, re-auth). Show subtle note: "Para cambiar tu email, contacta a soporte"
- [ ]  Phone optional with format hint
- [ ]  "Guardar Cambios" disabled until form is dirty
- [ ]  Save → toast: "Perfil actualizado"
- [ ]  Unsaved changes warning when navigating away
- [ ]  Updated name/avatar reflected immediately in sidebar user section

#### API

```tsx
account.getProfile.query()
// Returns: { displayName, email, phone, avatarUrl, authProvider }

account.updateProfile.mutate({
  displayName?: string,
  phone?: string,
})
// Note: email change not supported in MVP
```

---

### 9.2 User Access Info (Read-Only)

**Tab:** Mi Perfil → Access section (below profile form)

**Priority:** P0

#### Display

Read-only section showing what the user has access to:

```
┌─ Tu Acceso ───────────────────────────────────────┐
│                                                    │
│  Organización:  [Logo] OnePadel                    │
│  Rol:           [🔴 Administrador]                 │
│  Locales:       Todos los locales                  │
│                                                    │
│  ℹ️ Para cambiar tu rol o acceso, contacta al      │
│     administrador de tu organización.              │
└────────────────────────────────────────────────────┘
```

For facility managers and staff:

```
│  Rol:           [🔵 Manager de Local]              │
│  Locales:       [Trigal] [Olgín]                   │
```

#### Acceptance Criteria

- [ ]  Shows current org name + logo
- [ ]  Shows role with colored badge (Admin=red, Manager=blue, Staff=green)
- [ ]  Admin: shows "Todos los locales"
- [ ]  Manager/Staff: shows assigned facility pills
- [ ]  Help text: "Para cambiar tu rol o acceso, contacta al administrador de tu organización."
- [ ]  All fields read-only — no edit actions
- [ ]  Staff sees their role and assigned facilities

---

### 9.3 Facility Info Editing

**Tab:** Info del Local

**Priority:** P0

**Access:** `org_admin` + `facility_manager` only

#### Form Fields

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| Nombre del Local | Text | Yes | 2-200 chars |
| Teléfono de contacto | Tel | No | Peruvian format |
| Email del local | Email | No | Valid format |
| Dirección | Text | Yes | Non-empty |
| Descripción | Textarea | No | Max 500 chars |

#### Read-Only Info

Displayed below the form as reference cards:

- **Canchas:** "4 canchas" → link to Courts page (Flow 5)
- **Horarios:** Summary → link to Schedule page (Flow 6)
- **Precios:** "S/ 80 - S/ 120 /hr" → link to Pricing page (Flow 6)
- **Estado:** Active/Inactive badge (only org_admin can change, via Flow 2.3)

#### Acceptance Criteria

- [ ]  Form pre-filled with current facility data
- [ ]  Editable fields: name, phone, email, address, description
- [ ]  Read-only info cards with quick links to Courts, Schedule, Pricing
- [ ]  Status badge shown but not editable here (link to org settings for admins)
- [ ]  "Guardar Cambios" disabled until dirty
- [ ]  Save → toast: "Información del local actualizada"
- [ ]  Tab hidden for `staff` role
- [ ]  Facility scoping: manager can only edit their assigned facilities

#### API

```tsx
facility.get.query({ facilitySlug: string })
facility.update.mutate({
  facilitySlug: string,
  name?: string,
  phone?: string,
  email?: string,
  address?: string,
  description?: string,
})
```

---

### 9.4 Facility Team Tab

**Tab:** Equipo (at facility level)

**Priority:** P1

**Access:** `org_admin` + `facility_manager`

#### Behavior

Shows team members who have access to **this specific facility**. For managers, this is where they manage their staff. The actual invite/edit/remove mutations come from Flow 3 — this tab is a **filtered view** of the org team, scoped to the current facility.

#### Table Content

Same table structure as Flow 3.1, but filtered to show only members with access to this facility:

- Org admins (always shown — they have access to all facilities)
- Facility managers assigned to this facility
- Staff assigned to this facility

#### Actions Available

- **Org admin:** Can invite any role, edit any member, remove any member (uses Flow 3 modals)
- **Facility manager:** Can invite `staff` for this facility, edit staff, remove staff (uses Flow 3 modals scoped to this facility)
- **Staff:** Tab hidden entirely

#### Acceptance Criteria

- [ ]  Tab shows team members who have access to the current facility
- [ ]  Org admins always listed (access all facilities)
- [ ]  Managers and staff filtered to those assigned to this facility
- [ ]  "Invitar Staff" button for managers (opens Flow 3.2 modal, pre-scoped to this facility)
- [ ]  "Invitar Miembro" button for admins (opens Flow 3.2 modal)
- [ ]  Edit/remove actions use the same modals from Flow 3.3 / 3.4
- [ ]  Pending invites for this facility shown at bottom
- [ ]  Tab hidden for `staff` role
- [ ]  Empty state: "No hay equipo asignado a este local" with invite CTA

---

### 9.5 Notification Preferences

**Tab:** Notificaciones

**Priority:** P2 — Stub for MVP

**Access:** All three roles

#### MVP State

Show the toggle UI but with a "Próximamente" banner at the top. Toggles are visible but non-functional for MVP. This gives users a preview of what's coming without building the full notification infrastructure.

```
┌─────────────────────────────────────────────────────┐
│  ℹ️ Las notificaciones estarán disponibles pronto.  │
│     Por ahora, recibirás emails importantes         │
│     automáticamente.                                │
└─────────────────────────────────────────────────────┘

Nuevas Reservas              [Email ☑] [Push ☐]  (disabled)
Cancelaciones                [Email ☑] [Push ☐]  (disabled)
Resumen Diario               [Email ☐] [Push ☐]  (disabled)
Alertas de Baja Ocupación    [Email ☐] [Push ☐]  (disabled)
```

#### Acceptance Criteria

- [ ]  "Próximamente" banner at top explaining status
- [ ]  Toggle rows rendered with correct UI but disabled (grayed out)
- [ ]  No API calls on toggle change (they're non-functional)
- [ ]  All three roles can see this tab
- [ ]  Future: toggles become functional when notification infra is built

---

### 9.6 Security — Change Password

**Tab:** Seguridad

**Priority:** P0

**Access:** All three roles

#### Change Password Card

```
┌─ Contraseña ──────────────────────────────────────┐
│  🔒  Contraseña                                    │
│  Última actualización: hace 15 días                │
│                                                    │
│  [Cambiar Contraseña]                              │
└────────────────────────────────────────────────────┘
```

#### Change Password Modal

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| Contraseña actual | Password | Yes | Must match current password |
| Nueva contraseña | Password | Yes | Min 8 chars |
| Confirmar contraseña | Password | Yes | Must match new password |

#### Acceptance Criteria

- [ ]  Security tab shows password card with last-changed date
- [ ]  "Cambiar Contraseña" opens modal
- [ ]  Current password required (validates against Better-Auth)
- [ ]  New password: min 8 chars, strength indicator (weak/medium/strong)
- [ ]  Confirm must match new password
- [ ]  Wrong current password → "Contraseña actual incorrecta"
- [ ]  Success → toast: "Contraseña actualizada" → modal closes
- [ ]  Google OAuth users: show message "Tu cuenta usa Google para iniciar sesión. No tienes contraseña configurada." with option to set one
- [ ]  After password change, all other sessions invalidated (logged out on other devices)

#### API

```tsx
security.changePassword.mutate({
  currentPassword: string,
  newPassword: string,
})
// Validates: currentPassword matches
// Updates: password via Better-Auth
// Invalidates: all other sessions
```

---

### 9.7 Security — 2FA + Session Management

**Tab:** Seguridad (below password card)

**Priority:** P2 — Stubs for MVP

#### 2FA Card (Stub)

```
┌─ Autenticación de Dos Factores ───────────────────┐
│  🔐  Autenticación de Dos Factores                 │
│  Agrega una capa extra de seguridad                │
│                                                    │
│  [Activar 2FA]  (Coming Soon badge)                │
└────────────────────────────────────────────────────┘
```

#### Active Sessions Card (Stub)

```
┌─ Sesiones Activas ────────────────────────────────┐
│  📱  Sesiones Activas                              │
│  1 dispositivo conectado                           │
│                                                    │
│  [Administrar Sesiones]  (Coming Soon badge)        │
└────────────────────────────────────────────────────┘
```

#### Acceptance Criteria

- [ ]  2FA card shown with "Próximamente" badge on button
- [ ]  2FA button disabled (not functional)
- [ ]  Sessions card shows count of active sessions (from Better-Auth)
- [ ]  "Administrar Sesiones" button disabled with "Próximamente" badge
- [ ]  Future: 2FA enables TOTP, sessions list shows devices + locations + revoke

---

## Implementation Order

| Order | Sub-flow | Rationale | Estimate |
| --- | --- | --- | --- |
| 1 | Settings page shell + tab structure | The container for all tabs. Role-based tab visibility | 2h |
| 2 | 9.1 + 9.2 — User profile + access info | P0. Every user needs to see/edit their profile | 4-5h |
| 3 | 9.6 — Change password | P0. Security essential. Modal + Better-Auth integration | 3-4h |
| 4 | 9.3 — Facility info editing | P0. Facility config form with read-only quick links | 3-4h |
| 5 | 9.7 — 2FA + sessions stubs | P2. Quick stubs with disabled buttons | 1h |
| 6 | 9.5 — Notification preferences stub | P2. Toggle UI with "coming soon" banner | 1-2h |
| 7 | 9.4 — Facility team tab | P1. Filtered view of Flow 3 team table, scoped to this facility | 3-4h |

**Total estimate:** ~17-22 hours

---

## Files to Touch

```
apps/dashboard/
├── app/(dashboard)/org/[orgSlug]/f/[facilitySlug]/
│   └── settings/
│       └── page.tsx                       # 9.1-9.7 — Settings page with tabs
├── components/
│   └── settings/
│       ├── SettingsTabs.tsx                # Tab structure with role-based visibility
│       ├── ProfileForm.tsx                # 9.1 — Name, email, phone form
│       ├── AvatarUpload.tsx               # 9.1 — Circular avatar upload (Image System)
│       ├── AccessInfo.tsx                 # 9.2 — Read-only org/role/facilities
│       ├── FacilityInfoForm.tsx           # 9.3 — Facility editing form
│       ├── FacilityQuickLinks.tsx         # 9.3 — Read-only links to courts/schedule/pricing
│       ├── FacilityTeamTab.tsx            # 9.4 — Filtered team view for facility
│       ├── NotificationsStub.tsx          # 9.5 — Toggle UI (disabled)
│       ├── SecurityTab.tsx                # 9.6/9.7 — Password card + stubs
│       └── ChangePasswordModal.tsx        # 9.6 — Password change modal

packages/api/src/router/
├── account.ts                             # getProfile, updateProfile
└── security.ts                            # changePassword
```

---

## Dependencies

| Dependency | Status | Blocks |
| --- | --- | --- |
| Flow 1 (Auth) — Better-Auth configured | ✅ | 9.6 password change uses Better-Auth |
| Flow 3 (RBAC) — role-based tab visibility | 🔲 | Staff sees 3 tabs, manager sees 5, admin sees 5 |
| 🖼️ Image System — avatar upload | 🔲 | 9.1 avatar. Can use initials fallback without it |
| Flow 3 — team table + invite modals | 🔲 | 9.4 facility team tab reuses Flow 3 components |
| `users` table | ✅ | — |
| `facilities` table | ✅ | — |

---

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| Google OAuth user tries to change password | Show message: "Tu cuenta usa Google para iniciar sesión." Offer option to set a password (adds email/password auth alongside Google) |
| User changes their name | Updated immediately in sidebar, team tables, booking details across all views |
| Staff navigates to facility info tab via direct URL | Tab not rendered. If somehow accessed, redirect to Mi Perfil tab |
| Manager edits facility they're not assigned to (URL manipulation) | Facility scoping from Flow 3.8 blocks access — redirect to their facility |
| Last admin changes their own password | Works normally. Other sessions invalidated but they stay logged in on current session |
| Weak password entered | Strength indicator shows "Débil". Not blocked (min 8 chars is the only hard rule) but visual nudge to make it stronger |
| User uploads very large avatar | Client-side validation rejects >2MB before upload. Error: "Imagen muy grande. Máximo 2MB." |

---

## Testing Checklist

### User Profile

- [ ]  Form loads with current user data
- [ ]  Avatar upload works (circular preview)
- [ ]  Google OAuth user sees Google avatar by default
- [ ]  Edit name → save → sidebar updates immediately
- [ ]  Email shown as read-only with note

### Access Info

- [ ]  Admin sees "Todos los locales" with red Admin badge
- [ ]  Manager sees assigned facility pills with blue Manager badge
- [ ]  Staff sees assigned facility pills with green Staff badge
- [ ]  Help text shown about contacting admin

### Facility Info

- [ ]  Form pre-filled with facility data
- [ ]  Edit name + address → save → toast
- [ ]  Quick links navigate to courts/schedule/pricing
- [ ]  Tab hidden for staff

### Facility Team

- [ ]  Shows members with access to this facility (filtered from full org team)
- [ ]  Manager sees "Invitar Staff" button (scoped to their facility)
- [ ]  Admin sees full "Invitar Miembro" button
- [ ]  Tab hidden for staff

### Security

- [ ]  Password card shows last-changed date
- [ ]  Change password modal validates current password
- [ ]  New password strength indicator works
- [ ]  Successful change → toast → other sessions invalidated
- [ ]  Google OAuth user sees appropriate message
- [ ]  2FA and sessions cards show as stubs with "Próximamente"

### Notifications

- [ ]  "Próximamente" banner shown
- [ ]  Toggle UI renders but is non-functional

### RBAC

- [ ]  Admin sees all 5 tabs
- [ ]  Manager sees all 5 tabs (for assigned facilities)
- [ ]  Staff sees 3 tabs: Mi Perfil, Notificaciones, Seguridad
- [ ]  Staff cannot navigate to hidden tabs via URL

---

## Definition of Done

- [ ]  Facility settings page with role-based tab visibility
- [ ]  User profile editing with avatar upload
- [ ]  Access info showing org, role, and facilities (read-only)
- [ ]  Facility info editing with quick links (admin + manager only)
- [ ]  Facility team tab showing scoped members (admin + manager only)
- [ ]  Change password working with Better-Auth integration
- [ ]  2FA and session management stubs with "Próximamente" badges
- [ ]  Notification preferences stub with disabled toggles
- [ ]  All three roles see appropriate tabs
- [ ]  All UI copy in Spanish
- [ ]  QA Flow Tracker updated to ✅ for all passing sub-flows