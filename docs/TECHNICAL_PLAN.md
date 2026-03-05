# Flow 2: Organization Management — Technical Plan

## 1. Context

### What Exists Today

Flow 2 is **substantially built**. The codebase already has:

| Component | Status | Location |
|-----------|--------|----------|
| Facilities page (KPIs + cards + grid) | ✅ Built | `(org-view)/facilities/` |
| Search, filter, sort controls | ✅ Built | `facilities-filters.tsx` |
| Facility card with stats | ✅ Built | `facility-card.tsx` |
| Org settings with 4 tabs | ✅ Built | `(org-view)/settings/` |
| Org profile form (CRUD) | ✅ Built | `org-profile-tab.tsx` |
| Billing stub | ✅ Built | `billing-tab.tsx` |
| Org switcher dropdown | ✅ Built | `org-selector.tsx` |
| Toggle facility status (API) | ✅ Built | `org.updateFacilityStatus` |
| Loading skeletons | ✅ Built | `FacilitiesPageSkeleton` |
| Empty state (filter no results) | ✅ Built | `facilities-grid.tsx` |
| tRPC org router (all queries/mutations) | ✅ Built | `packages/api/src/router/org.ts` |

### Patterns to Follow

- **Server-first data**: `prefetch()` in server components, `useSuspenseQuery` in client
- **Forms**: Zod + `react-hook-form` + `standardSchemaResolver`
- **UI**: shadcn components (`Card`, `Badge`, `Dialog`, `DropdownMenu`, `Select`, `Tabs`)
- **Spanish localization**: All UI copy in es-PE, currency as "S/ X,XXX"
- **Route groups**: `(org-view)` for org sidebar, `(facility-view)` for facility sidebar

## 2. Gap Analysis — What's Missing

### P0 Gaps

**2.1/2.3 — Facility Card Actions Menu + Toggle from Card**
- Card has no "⋯" dropdown menu (spec requires: Ver Dashboard, Editar, Desactivar/Reactivar)
- No confirmation dialog for deactivation from card
- No toast feedback on toggle
- No optimistic UI update
- No inactive card styling (75% opacity, gray gradient)
- Missing manager avatars on card
- Card body not clickable (only footer link)
- Role check missing (only `org_admin` should see toggle)

**2.7 — First-Time Empty State**
- Current empty state is for "no filter results" only
- Need differentiated "zero facilities" empty state with illustration + CTA
- KPIs should show "0" with no trend indicators when zero facilities

**2.2 — Filter URL Persistence + Result Count**
- Filters use React state only, not URL query params
- No result count display ("Mostrando 3 de 5 locales")
- Active filter count badge not shown

### P1 Gaps

**2.4 — Org Switcher Polish**
- No single-org behavior (should hide chevron, disable dropdown)
- No checkmark indicator on current org

**2.5 — Logo Upload**
- Currently shows placeholder text: "La carga de logo estará disponible próximamente"
- No `org.uploadLogo` mutation exists
- No Supabase Storage bucket configured
- No unsaved changes warning on navigation

### P2 Gaps (minimal)

**2.6 — Billing Tab**
- Minor copy difference from spec (heading says "Facturación" not "Facturación y Suscripción")
- Essentially complete

## 3. Risk Assessment

**Low risk** — All changes are incremental enhancements to existing, working code.

| Risk | Impact | Mitigation |
|------|--------|------------|
| Card menu breaking existing click behavior | Low | Add menu with `stopPropagation` |
| URL filter persistence causing extra rerenders | Low | Use `useSearchParams` with debounce |
| Logo upload requires Supabase Storage | Medium | Defer to P1, initials fallback already works |
| Manager data not included in getFacilities | Low | Use existing `getFacilityManagers` query |

## 4. Architecture Decisions

- **Card actions menu**: Use existing `DropdownMenu` from shadcn. Add to facility-card.tsx.
- **Confirmation dialog**: Create reusable `ConfirmDialog` component or use `AlertDialog` from shadcn.
- **URL persistence**: Use Next.js `useSearchParams` + `useRouter` for filter state sync.
- **Empty state**: Differentiate in `FacilitiesView` — check `stats.totalFacilities === 0` before rendering filters/grid.
- **Logo upload**: Defer entirely. Current placeholder is acceptable for MVP P1.
- **Unsaved changes**: Use `beforeunload` event + Next.js `useRouter` events.

## 5. What to Skip for Now

- **Logo upload (2.5)**: Requires Supabase Storage configuration. Placeholder already works. Can be a separate task.
- **Billing copy tweaks (2.6)**: Already functionally complete. Trivial to adjust if needed.
- **Manager avatars on card**: Requires joining `getFacilities` with `getFacilityManagers` data. Nice-to-have but adds complexity to an already working card.
