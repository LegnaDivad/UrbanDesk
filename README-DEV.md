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

