# Tasks

## Completed

### Email Notification System

Fully implemented `packages/email` (React Email + Resend): 4 templates, high-level senders, integrated across all apps.

### Flow 1: Authentication & Access (8 tasks)

Login (email/password + Google OAuth), invite acceptance, password reset, rate limiting, post-login pending invite prompt, brand assets, auth error hardening, 129 tests.

### Flow 2: Organization Management (6 tasks)

Facility card actions, deactivation dialog, empty state, URL-persisted filters, org switcher, "Agregar Local" button.

### Image System (10 tasks)

`@wifo/images` package, Cloudflare Images integration (Direct Creator Upload), URL builder, tRPC images router, ImageUpload/Preview/Gallery components, integrated into facility photos, court photos, and org logo. 21 tests.

### Flow 3: Team & Roles - RBAC (8 tasks)

Last admin protection, facility manager invite scoping, `usePermission` hook, role-based sidebar filtering, route-level access guards, team table polish, invite/edit dialog enhancements, 35 tests.

### Flow 4: Facility Onboarding (11 tasks)

Schema migration (slug + geocoding), setup progress API, default operating hours, district autocomplete + geocoding, courts wizard redesign (individual CRUD + pricing), schedule wizard enhancement ("Aplicar a todos"), photos & amenities step, completion screen + activation gate, setup banner with progress, resume from correct step, slug auto-generation. 52 tests (setup: 37, slugify: 15).

---

## Next

_No tasks defined yet. Use `/scope-task` to scope the next feature._
