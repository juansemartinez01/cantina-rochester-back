# Roles permissions matrix

This document is the target access policy for Rochester Kiosco using the shared role contract:

- `Admin`
- `Vendedor`
- `Cocina`

## Current backend behavior

Kiosco currently applies a global JWT guard, but does not apply `@Roles(...)` restrictions to controllers.

The `RolesGuard` exists in `src/auth/roles.guard.ts`, but no endpoint currently declares role metadata with `@Roles(...)`.

## Target policy

| Area | Target roles | Notes |
| --- | --- | --- |
| General commerce/kiosco operations | `Admin`, `Vendedor` | Keep normal operational access away from `Cocina` unless a concrete screen requires it. |
| User management | `Admin` | User role assignment should remain admin-only if/when role restrictions are added. |
| Role catalog management | `Admin` | Creating a role must later sync by exact name with Viandas/Backoffice. |
| Cocina access | None by default | `Cocina` should have no general Kiosco permissions unless a specific operational workflow is defined. |

## Implementation notes for later stages

- Role names must be stored exactly as `Admin`, `Vendedor`, and `Cocina`.
- Kiosco role IDs are local integer IDs and must not be shared with Viandas/Backoffice.
- Cross-system role synchronization must use exact role names, not IDs.
- If Kiosco starts enforcing endpoint roles, controllers should use the shared constants from `src/auth/roles.constants.ts`.
