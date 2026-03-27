# Bugs

Bug reports for PadelHub. Use `/report-bug [description]` to add new entries.

---

(No active bugs)

---

## Archived (Fixed)

All prior bugs have been fixed. See git history for details.

- **BUG-001** (Fixed): Post-login redirect 404 — added `[orgSlug]/page.tsx` with role-based redirect
- **BUG-002** (Fixed): Hydration mismatch in facility sidebar — deferred Sheet mount after hydration
- **BUG-003** (Fixed): Dev overlay blocks clicks — resolved by BUG-002 fix
- **BUG-004** (Fixed): "Limpiar filtros" navigates away — replaced relative `"."` with `usePathname()`
- **BUG-005** (Fixed): Hydration mismatch on bookings page — deferred Radix Select/Popover mount
