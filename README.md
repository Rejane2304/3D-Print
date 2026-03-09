# Ecommerce 3D Print

Plataforma de ecommerce para productos impresos en 3D. Incluye motor de precios avanzado, panel de administración, integración con Stripe, tests unitarios (Vitest) y E2E (Playwright).

## Comandos útiles

- `yarn dev` — servidor de desarrollo
- `yarn build` — build de producción
- `yarn start` — servidor de producción
- `npx vitest` — tests unitarios e integración
- `npx playwright test` — tests E2E

## Stack
- Next.js
- TypeScript
- Prisma
- Stripe
- Zustand
- Vitest
- Playwright

## Estructura
- `app/` — rutas, vistas y lógica principal
- `components/` — componentes reutilizables
- `lib/` — lógica de negocio y utilidades
- `prisma/` — migraciones y schema
- `__tests__/` — tests unitarios e integración
- `e2e/` — tests E2E
- `workers/` — web workers

## Variables de entorno
Ver `.env.example` para configuración.

## Estado
- Tests unitarios: Vitest (100% verde, sin advertencias)
- Tests E2E: Playwright (100% verde, sin advertencias)
- Linter: ESLint (sin errores ni advertencias)
- Rama principal: main (desarrollo directo, sin ramas extra)

## Contacto
Para dudas o soporte, consulta la documentación interna o contacta al equipo.

