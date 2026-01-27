## Babel
Expo Router is configured via `babel-preset-expo` (SDK 50+). We do not use the deprecated `expo-router/babel` plugin.

NativeWind is enabled via:
- `jsxImportSource: "nativewind"`
- `nativewind/babel` preset
- Reanimated plugin kept last
Checklist Universal
 TypeScript: npm run typecheck sin errores

 Web responsiva: npx expo start --clear → w sin errores

 Móvil: i y a abren sin crashes

 ## Linting
This repo enforces import/export ordering via `simple-import-sort`.

Run:
```bash
npm run lint
Autofix:

npm run lint:fix


## Checklist Universal
- [ ] TypeScript: `npm run typecheck` sin errores
- [ ] Web responsiva: `expo start` → `w` OK
- [ ] Móvil: `i` y/o `a` OK

---

Cuando `npm run lint` pase, respóndeme: **“F1.0 OK”** y avanzamos directo a **Fase 1.1: Router modular por grupos (public/app/admin)** sin construir UI final.
::contentReference[oaicite:0]{index=0}

## Routing (Expo Router)
We use route groups to keep navigation scalable:
- `(public)`: authentication routes
- `(app)`: end-user modules (reservas, inventario)
- `(admin)`: admin-only modules (space-builder)

`/` redirects to `/(public)/login` during early development.
Checklist Universal
 TypeScript: npm run typecheck sin errores

 Web responsiva: URLs funcionan (redirect + rutas)

 Móvil: abre y renderiza placeholders sin crashes

## Platform Abstractions
Platform-specific implementations live in `src/platform` using `.web.ts` / `.native.ts`.

To satisfy static tooling (ESLint resolution), we also provide a thin bridge module:
- `src/platform/kv.ts` → re-exports the platform module entry
The bundler still picks the correct platform file at runtime.
Checklist Universal
 TypeScript: npm run typecheck sin errores

 Web responsiva: login mock + redirects OK

 Móvil: iOS/Android OK

## State Management
We use Zustand with feature-level stores (vertical slices). Each feature owns its state and exposes a single store module to avoid cross-module duplication and naming collisions.
Checklist Universal
 TypeScript: npm run typecheck sin errores

 Web responsiva: / (app)/reservas renderiza estado sin errores

 Móvil: iOS/Android renderiza sin crashes

 ## Foundations: Workspace Config
Space Builder persists a `WorkspaceConfig` locally to enable dynamic spaces:
- Web: `localStorage`
- Native: `expo-secure-store`

Reservas hydrates and consumes the same `WorkspaceConfig` as the initial step toward dynamic booking flows.
Checklist Universal
 TypeScript: npm run typecheck sin errores

 Web responsiva: user/admin routes renderizan estado sin crashes

 Móvil: iOS/Android renderiza sin crashes

## Foundations: Inventario
Inventario uses a feature-level Zustand store backed by local persistence (KV):
- Web: localStorage
- Native: SecureStore

This is a temporary foundation that will be swapped to API-backed repositories later without changing UI wiring.
Checklist

 TypeScript OK

 Web OK

 Móvil OK

 ## Dev Utilities
A `/logout` route is available during development to clear the persisted session and return to `/login`.
Checklist Universal
 TypeScript: npm run typecheck

 Web: /login no redirige si estás signedOut; /logout limpia sesión

 Móvil: /logout limpia sesión y vuelve a /login

README.md (bloque listo)
## Reservas MVP
Reservas derives available spaces from the `WorkspaceConfig` created in Space Builder (admin).
Bookings are currently mocked and persisted locally per platform:
- Web: localStorage
- Native: SecureStore

MVP flow:
1) Admin seeds & saves WorkspaceConfig in Space Builder
2) User sees dynamic spaces in Reservas
3) User creates a 1-hour mock booking (persisted locally)

Checklist Universal

 TypeScript: npm run typecheck sin errores

 Web: seed config → ver spaces → crear booking → persiste tras reload

 Móvil: mismo flujo en iOS y Android (sin crashes)
 ### Booking counts (MVP)
The UI shows total bookings for debugging. Additional derived counts are displayed:
- bookings for selected space
- bookings for current user

README.md (bloque)
### Booking overlap guard
A minimal guard prevents creating a booking if the selected space already has an overlapping booking for the same time window.

Checklist Universal

 TypeScript OK

 Web OK

 Móvil OK

 ### Reservas F3.2
- Booking window controls: start time (+/- 15m) and duration (30/60)
- Occupancy indicator per space based on overlap detection
- Store initializes booking window defaults to avoid undefined state before hydration
Checklist Universal
 TypeScript: npm run typecheck

 Web: inicia, muestra ocupación, reservar/cancelar funciona

 Móvil: mismo flujo en iOS y Android

 ### Storage (KV)
The `kv` adapter provides low-level string storage and JSON helpers:
- `getItem/setItem/removeItem`
- `getJson/setJson` for typed persistence across features (reservas, space builder, auth, etc.)
Checklist Universal
 TypeScript OK

 Web OK

 Móvil OK

 ## Routing (Expo Router) y Router Root

- Se usa **Expo Router** con navegación basada en archivos bajo `app/`.
- Evitar colocar archivos no-route dentro de `app/` (por ejemplo `di.ts`), ya que Expo Router intenta interpretarlos como pantallas y puede causar **Unmatched Route**.
- La inyección de dependencias (DI) vive fuera del router root:
  - `src/di.ts`
  - Imports: `@/di`

### Run (Web/Mobile)
- Web: `npm run web`
- iOS: `npm run ios`
- Android: `npm run android`

### Tooling
- Aligned Expo patch versions to the expected SDK-compatible releases.
- Added `eslint-import-resolver-typescript` to correctly resolve TS path aliases (`@/*`) in ESLint.
Checklist universal
 TypeScript: npm run typecheck

 Web responsiva: abre / y rutas base en http://localhost:8081

 Móvil: iOS + Android abren sin warnings bloqueantes

 ### Fixes
- Reservas store now loads workspace configuration from `di.spaces.workspaceRepo` (correct DI boundary).
Checklist Universal
 TypeScript: npm run typecheck

 Web: /reservas carga y lista espacios

 Mobile: iOS/Android entra a Reservas sin error

### Chore
- Standardized DI module location to `src/di.ts` and unified imports to `@/di`.
- Pinned Expo Router root to `app/` to prevent non-route files from being treated as routes.
- Confirmed lint, typecheck, and web bundling green.
Checklist Universal
 TypeScript: npm run typecheck

 Web responsiva: carga en http://localhost:8081

 Mobile: (pendiente de confirmación rápida cuando corras iOS/Android, pero ya no hay señales de router/DI roto)

 ### Fixes
- Fixed TypeScript literal widening in Inventory store by explicitly typing mapped arrays and preserving union literal statuses.
Checklist Universal
 TypeScript: npm run typecheck

 Web: /inventory carga y permite mock asset/loan/return

 Mobile: /inventory abre y funciona igual

 ### Inventory (MVP)

- Added `seedMockAssets` action to preload sample assets.
- Inventory screen now uses the store API consistently for seeding.
Checklist Universal (3)
TypeScript: npm run typecheck sin errores.

Web Responsiva: abre /inventory y confirma render + botones.

Móvil: corre en Expo Go y valida que Seed mock assets actualiza la lista.

### Inventory

- Fixed `kv` helper to export a single implementation with `getJson/setJson`.
- Repaired inventory store parsing and completed `hydrate()` using `loadAssets/loadLoans`.
- Added `seedMockAssets()` for deterministic MVP data.
Checklist Universal
TypeScript: npm run typecheck ✅

Web: /inventory carga + seed persiste tras refresh ✅

Móvil: seed + préstamo + return persiste tras reload ✅

### Routing

- Added global auth + role guard in `app/_layout.tsx` to enforce `(public)/(app)/(admin)` zones.
- Introduced `(app)` Tabs layout for Reservas + Inventory.
- Added `(admin)` Stack layout for admin-only modules (e.g., Space Builder).
Checklist Universal
TypeScript: npm run typecheck ✅

Web responsiva: /login → login, signed-in → /reservas, tabs funcional ✅

Móvil: misma navegación y redirects en iOS/Android ✅

### Space Builder (Admin MVP)

- Added `/ (admin) /space-builder` MVP screen to seed, minimally edit, and persist `WorkspaceConfig` (areas/services/spaces).
- Reservas can navigate to Space Builder when user role is `admin`.
- Configuration persists via `di.spaces.workspaceRepo` and is shared across modules.
Checklist Universal
TypeScript: npm run typecheck ✅

Web: abrir /reservas → ir a Space Builder (admin) → seed → guardar → refrescar y persistencia ✅

Móvil: mismas rutas, sin prompts web-only, sin APIs exclusivas ✅

### Inventory (MVP hardening)

- Fixed `kv` helper to expose `getJson/setJson` with a single export.
- Reworked `inventory.store` to use strict `AssetStatus/LoanStatus` literals.
- Fixed Inventory screen to call `seedMockAssets`.
Checklist Universal
TypeScript: npm run typecheck ✅

Web: /inventory → Seed → Create Loan → Return Loan ✅

Móvil: mismas acciones, sin crashes ✅

### Inventory domain helpers

- Added inventory store selectors to query assets and loans by assetId.
Checklist
TS ok

Web ok

Móvil ok

