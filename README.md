# Ecommerce 3D Print

> Plataforma robusta para venta de productos impresos en 3D, con motor de precios avanzado, panel de administración, integración de pagos, tests automatizados y arquitectura modular.

---

## Tabla de Contenidos

- [Ecommerce 3D Print](#ecommerce-3d-print)
  - [Tabla de Contenidos](#tabla-de-contenidos)
  - [Arquitectura](#arquitectura)
  - [Backend](#backend)
    - [Ejemplo de endpoint](#ejemplo-de-endpoint)
  - [Frontend](#frontend)
  - [Base de datos](#base-de-datos)
  - [Estructura de carpetas](#estructura-de-carpetas)
  - [Comandos útiles](#comandos-útiles)
  - [Variables de entorno](#variables-de-entorno)
  - [Estado del proyecto](#estado-del-proyecto)
  - [Despliegue y recomendaciones](#despliegue-y-recomendaciones)
  - [Contacto](#contacto)
  - [Comandos útiles](#comandos-útiles-1)
  - [Stack](#stack)
  - [Estructura](#estructura)
# Ecommerce 3D Print

Plataforma de e-commerce especializada en productos impresos en 3D (Bambu Lab P2S), con motor de precios dinámico, materiales configurables, gestión de pedidos, puntos de fidelidad, panel de administración y pagos vía Stripe.

---

## Stack Tecnológico

| Capa                   | Tecnología                      | Versión      |
| ---------------------- | ------------------------------- | ------------ |
| Marco de trabajo       | Next.js App Router              | 13.x         |
| Lenguaje               | TypeScript                      | 5.2 (strict) |
| ORM                    | Prisma                          | 6.7          |
| Base de datos          | PostgreSQL                      | 15+          |
| Autenticación          | NextAuth.js JWT + PrismaAdapter | 4.x          |
| Pagos                  | Stripe                          | más reciente |
| Estado                 | Zustand + persist               | más reciente |
| Estilos                | Tailwind CSS                    | 3.3          |
| Animaciones            | Framer Motion                   | más reciente |
| Pruebas unitarias      | Vitest                          | 4.x          |
| Pruebas E2E            | Playwright                      | 1.58+        |
| Validación             | Zod                             | más reciente |
| Primitivas de interfaz | Radix UI                        | más reciente |
| Iconos                 | Lucide React                    | más reciente |
| Trabajadores           | Web Workers API                 | nativo       |

---

## Estructura de Carpetas

```
- **Carrito:** `/app/cart/`, integración con motor de precios
- **Checkout:** `/app/checkout/`, pagos con Stripe

---

## Base de datos

- **ORM:** Prisma
- **Schema:** `prisma/schema.prisma`
- **Migraciones:** `prisma/migrations/`
- **Seed:** `scripts/seed.ts`
- **Modelo principal:** Producto, Usuario, Pedido, Material, Inventario

---

## Estructura de carpetas

```
├── app/                # Rutas, vistas y lógica principal
│   ├── admin/          # Panel de administración
│   ├── cart/           # Carrito
│   ├── catalog/        # Catálogo
│   ├── checkout/       # Checkout
│   ├── product/        # Detalle de producto
│   └── ...
├── components/         # Componentes reutilizables
│   ├── ui/             # Componentes UI (botón, input, etc.)
│   └── ...
├── lib/                # Lógica de negocio y utilidades
├── prisma/             # Migraciones y schema
├── public/             # Assets estáticos
├── scripts/            # Scripts de utilidad
├── workers/            # Web workers (motor de precios)
├── __tests__/          # Tests unitarios e integración
├── e2e/                # Tests E2E
├── private/            # Documentación interna, propuestas, notas
└── ...
```

---

## Comandos útiles

- `yarn dev` — servidor de desarrollo
- `yarn build` — build de producción
- `yarn start` — servidor de producción
- `npx vitest` — tests unitarios e integración
- `npx playwright test` — tests E2E
- `yarn prisma migrate dev` — migraciones
- `yarn prisma db seed` — seed de datos
- `yarn prisma studio` — interfaz gráfica de BD

---

---

## Modelo de Datos (Prisma)

- User (roles: user/admin)
- Product (dimensiones, peso, color, material, acabado, imágenes, stock)
- Material (PLA/PETG/ASA/TPU, precio/kg, densidad)
- Color (colores Bambu Lab)
- MaterialColor (relación N:M material-color, stock en gramos)
- Cart/CartItem (carrito persistido)
- Order/OrderItem (pedido completado)
- Wishlist (lista de deseos)
- Review (valoraciones)
- Coupon (descuentos)
- Inventory (stock por material y producto)
- Printer (impresoras disponibles)
- ProductPrice (precios materiales por producto)
- PricingConfig (configuración de precios global)
- Alert (alertas de stock y operación)
- PointsTransaction (historial de puntos de fidelidad)

---

## Comandos Útiles

```bash

## Variables de entorno

Ver `.env.example` para configuración. Variables principales:

- `DATABASE_URL` — conexión a base de datos
- `STRIPE_SECRET_KEY` — clave de Stripe
- `NEXTAUTH_URL` — URL base para autenticación

---

---

## Variables de Entorno

Requeridas:

```env
DATABASE_URL=postgresql://user:pass@host:5432/ecommerce_3d_print
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<string_aleatorio_32_chars>
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

Opcionales:

```env
NEXT_DIST_DIR=.next
```

---

## Estado del Proyecto

- Todos los tests unitarios y de integración pasan (Vitest)
- Tests E2E cubren flujos críticos (Playwright)
- Cobertura mínima: 80% en lib/, 70% en components/
- Sin advertencias ni errores de TypeScript
- Sin any explícito
- Sin secretos hardcodeados
- Imágenes locales (<200KB)
- Variables de entorno documentadas

---

## Reglas de Desarrollo

- Migraciones Prisma siempre versionadas
- Validación de inputs con Zod
- Autenticación JWT NextAuth
- Panel admin protegido por middleware y verificación de rol
- Motor de precios solo en backend
- Estado global con Zustand persist
- Tests sin llamadas reales a red o BD
- SSR en español, i18n con Zustand
- Imágenes solo locales
- Sin console.log en producción

---

## Contacto

Para dudas o soporte, contacta a: rejanerodrigues@gmail.com

## Estado del proyecto

- Tests unitarios: Vitest (100% verde, sin advertencias)
- Tests E2E: Playwright (100% verde, sin advertencias)
- Linter: ESLint (sin errores ni advertencias)
- Rama principal: main (desarrollo directo, sin ramas extra)

---

## Despliegue y recomendaciones

- Ignora carpetas: `node_modules`, `.next`, `__tests__`, `e2e`, `private`, `playwright-report`, `test-results`, `logs`, `.env*`, `.vscode`, `.idea`, `.DS_Store`, etc.
- Solo sube a producción: `app/`, `components/`, `lib/`, `prisma/`, `public/`, `workers/`, `package.json`, `next.config.js`, `tsconfig.json`, etc.
- Revisa dependencias y scripts antes de deploy.
- Usa `yarn build` y `yarn start` para producción.

---

## Contacto

Proyecto desarrollado y mantenido por una sola persona. Para dudas, revisa este README o la documentación interna.

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

Proyecto desarrollado y mantenido por una sola persona. Para dudas, revisa este README o la documentación interna.
