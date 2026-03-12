# AGENTS.md — Reglas y Estándares del Proyecto ecommerce_3d_print

## 1. VISIÓN DEL NEGOCIO

Plataforma de e-commerce especializada en productos impresos en 3D (Bambu Lab P2S), con motor de precios dinámico por dimensiones, materiales configurables (PLA, PETG, ASA, TPU), gestión de pedidos, puntos de fidelidad, panel de administración y pagos vía Stripe. Idiomas: español (predeterminado) / inglés.

---

## 2. PILA TECNOLÓGICA OFICIAL

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

## 3. ESTRUCTURA DE DIRECTORIOS

```
ecommerce_3d_print/
├── app/                    # Next.js App Router (componentes de servidor por defecto)
│   ├── _components/        # Componentes exclusivos del layout raíz
│   ├── api/                # Controladores de rutas (API REST)
│   │   ├── admin/          # Endpoints protegidos por rol admin
│   │   ├── auth/           # Endpoints de NextAuth
│   │   ├── cart/           # Carrito (requiere autenticación)
│   │   ├── checkout/       # Sesiones de Stripe y checkout
│   │   ├── coupons/        # Cupones de descuento
│   │   ├── materials/      # Materiales públicos
│   │   ├── newsletter/     # Suscripción a la newsletter
│   │   ├── orders/         # Pedidos de usuario
│   │   ├── points/         # Puntos de fidelidad
│   │   ├── products/       # Catálogo público
│   │   ├── profile/        # Perfil de usuario
│   │   ├── search/         # Búsqueda
│   │   ├── signup/         # Registro
│   │   ├── webhook/        # Webhooks de Stripe
│   │   └── wishlist/       # Lista de deseos
│   ├── admin/              # Panel admin (protegido)
│   ├── catalog/            # Página catálogo
│   ├── cart/               # Página carrito
│   ├── checkout/           # Página checkout
│   ├── orders/             # Historial de pedidos
│   ├── wishlist/           # Lista de deseos
│   ├── login/              # Autenticación
│   ├── signup/             # Registro
│   └── product/[id]/       # Detalle de producto
├── components/             # Componentes compartidos
├── hooks/                  # Hooks personalizados
├── lib/                    # Utilidades, servicios y almacenes de estado
│   ├── auth-options.ts     # Configuración NextAuth
│   ├── cart-store.ts       # Carrito en Zustand (persistente)
│   ├── db.ts               # Prisma singleton
│   ├── language-store.ts   # Internacionalización en Zustand (persistente)
│   ├── price-calculator.ts # Motor de precios (funciones puras)
│   ├── pricing-service.ts  # Servicio de precios en servidor con Prisma
│   ├── stripe.ts           # Instancia de Stripe
│   └── types.ts            # Interfaces globales de TypeScript
├── prisma/
│   ├── schema.prisma       # Schema fuente de verdad
│   └── migrations/         # Migraciones versionadas
├── public/
│   └── images/             # Imágenes locales de productos
├── scripts/
│   └── seed.ts             # Datos iniciales deterministas
├── workers/
│   └── pricing.worker.ts   # Web Worker para cálculos de precio
├── __tests__/
│   ├── unit/               # Tests unitarios (Vitest)
│   └── integration/        # Tests integración (Vitest + MSW)
└── e2e/                    # Tests end-to-end (Playwright)
```

---

## 4. MODELO DE DATOS (Prisma — fuente de verdad)

### 4.1 Invariantes del Schema

- **NUNCA** modificar el schema sin crear una migración con `prisma migrate dev --name <descripcion>`.
- **NUNCA** usar `prisma db push` en producción — siempre migraciones.
- Todos los IDs usan `@id @default(cuid())`.
- Todas las entidades tienen `createdAt DateTime @default(now())` y `updatedAt DateTime @updatedAt`.
- Las relaciones de cascade se declaran explícitamente: `onDelete: Cascade` para datos dependientes del usuario.
- Los campos de tipo `String` que son texto largo usan `@db.Text`.
- El `DATABASE_URL` siempre proviene de variable de entorno, nunca hardcodeado.

### 4.2 Modelos Core

| Modelo            | Rol                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| User              | Usuario con roles: `user` / `admin`                                                                            |
| Product           | Producto imprimible con dimensiones, peso, color, material, acabado, multimágenes, tiempo de impresion y stock |
| Material          | PLA / PETG / ASA / TPU con precio/kg y densidad                                                                |
| Color             | Colores Bambu Lab con código hex                                                                               |
| MaterialColor     | Relación N:M material-color con stock en gramos                                                                |
| Cart / CartItem   | Carrito persistido en BD                                                                                       |
| Order / OrderItem | Pedido completado con ítems                                                                                    |
| Wishlist          | Lista de deseos por usuario                                                                                    |
| Review            | Valoraciones con rating 1-5                                                                                    |
| Coupon            | Descuentos por código                                                                                          |
| Inventory         | Stock por material y producto                                                                                  |
| Printer           | Impresoras disponibles (Bambu Lab P2S)                                                                         |
| ProductPrice      | Precios materiales para un producto                                                                            |
| PricingConfig     | Configuración de precios global                                                                                |
| Alert             | Alertas de stock y operación                                                                                   |
| PointsTransaction | Historial de puntos de fidelidad                                                                               |

### 4.3 Reglas de Precios

- El precio se calcula **siempre** en el servidor usando `lib/pricing-service.ts` o `lib/price-calculator.ts`.
- En el frontend el cálculo es **solo orientativo** via Web Worker.
- Fórmula base: `precio_base = peso_real_g / 1000`
- Coste base: `materialCost + machineCost + maintenanceCost + operationCost + consumablesCost + finishCost`
- Márgenes: ×2.5 (1–4 uds), ×2.0 (5–9 uds), ×1.5 (10+ uds)
- Precio Bambu Lab P2S: amortización €0.12/h, electricidad €0.04/h, consumibles €0.02/h

---

## 5. REGLAS DE TYPESCRIPT

- **STRICT MODE OBLIGATORIO** — `tsconfig.json` debe tener `"strict": true`.
- **CERO `any` explícito** — usar `unknown` y type guards.
- **CERO `as any`** — usar tipos definidos o type predicates.
- **CERO errores en `tsc --noEmit`** — CI bloquea en error de tipos.
- Todos los tipos públicos van en `lib/types.ts`.
- Los tipos de Prisma se importan desde `@prisma/client`, no se duplican en `lib/types.ts`.
- Las interfaces de los componentes props se declaran en el mismo archivo del componente.
- Usar `satisfies` operator donde aporte claridad sin perder inferencia.
- Los callbacks de NextAuth usan tipos propios `(user as { role?: string })` hasta que next-auth exporte tipos extendibles — documentar el motivo.

---

## 6. REGLAS DE CÓDIGO

### 6.1 Rutas API (controladores de rutas de Next.js)

- Toda route de API comienza con `export const dynamic = "force-dynamic"` si lee sesión o BD dinámica.
- Toda route de API tiene manejo de errores con `try/catch` y responde `NextResponse.json({ error }, { status })`.
- **NUNCA** exponer stack traces al cliente — solo mensajes genéricos en producción.
- Toda route admin verifica que `session.user.role === "admin"` antes de ejecutar lógica.
- Usar `getServerSession(authOptions)` para verificar autenticación en server.
- Validar el body con Zod antes de procesar datos de entrada.

### 6.2 Componentes React

- Usar `"use client"` **solo** cuando el componente usa hooks, eventos del browser o estado local.
- Los Componentes de servidor no tienen `"use client"` y pueden hacer fetch directo a BD vía Prisma.
- Los componentes `_components/` de page son privados a esa ruta.
- Los componentes en `components/` son compartidos globalmente.
- Nunca importar `prisma` desde un componente cliente.
- Props con tipado estricto — sin `any`, sin `object`, sin `{}` sin restricciones.

### 6.3 Estado Global (Zustand)

- Dos stores únicos: `cart-store` y `language-store`.
- Ambos stores usan `persist` middleware con `localStorage`.
- El store tiene `_hasHydrated` para evitar hydration mismatch.
- Acceder al store con selectores granulares: `useCartStore((s) => s.items)` — nunca desestructurar el store completo.
- Los stores no contienen lógica de negocio — solo estado y mutaciones primitivas.

### 6.4 Imágenes

- **Solo imágenes locales** en `public/images/` — formato `.jpg` preferido.
- Usar `<Image>` de Next.js con `unoptimized: true` (configurado en `next.config.js`).
- Todo `<Image>` requiere `alt` descriptivo, `width`, `height` o `fill` con `className`.
- Las rutas de imágenes en BD son relativas: `/images/product-01.jpg`.
- El fallback de imagen es `/og-image.png`.

### 6.5 i18n (Internacionalización)

- Solo dos idiomas: `es` (predeterminado) y `en`.
- Las traducciones son objetos inline en cada componente bajo `const t = { es: {...}, en: {...} }`.
- Usar `useLanguage()` de `lib/language-store.ts` para obtener el idioma.
- **NUNCA** hardcodear texto visible al usuario sin alternativa en ambos idiomas.
- El idioma persiste en localStorage via Zustand persist.
- El SSR siempre renderiza en `es` — el switch ocurre en cliente tras hydration.

---

## 7. SEGURIDAD

### 7.1 Autenticación y Autorización

- Estrategia JWT mediante NextAuth con `secret: process.env.NEXTAUTH_SECRET`.
- El `NEXTAUTH_SECRET` debe ser un string criptográficamente aleatorio de 32+ caracteres.
- El token JWT incluye `id` y `role` del usuario.
- Las rutas admin en el frontend usan middleware de Next.js (`middleware.ts`) para redirigir si no hay sesión admin.
- **NUNCA** hacer llamadas a endpoints admin desde el cliente sin verificar sesión.
- Los endpoints admin verifican rol en servidor — la UI es solo UX, no seguridad.

### 7.2 Datos Sensibles

- **NUNCA** loguear contraseñas, tokens, datos de tarjeta o PII.
- **NUNCA** retornar el campo `password` del usuario en respuestas de API.
- El campo `password` de User se excluye con `select: { password: false }` en Prisma.
- Las variables de entorno sensibles (`NEXTAUTH_SECRET`, `STRIPE_SECRET_KEY`, `DATABASE_URL`) solo en servidor.
- Las variables públicas (`NEXT_PUBLIC_*`) no deben contener secretos.

### 7.3 Stripe Webhooks

- Verificar la firma del webhook con `stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)`.
- El endpoint webhook lee el raw body (`req.text()` o Buffer), no `req.json()`.
- Los webhooks actualizan pedidos de forma idempotente verificando `stripeSessionId`.

### 7.4 Input Validation

- Validar con Zod todos los inputs de API antes de tocar la BD.
- Sanitizar búsquedas de texto para evitar injection (Prisma ya parametriza, pero validar longitud máxima).

---

## 8. PRUEBAS

### 8.1 Pruebas unitarias (Vitest)

- Toda función pura en `lib/` tiene tests en `__tests__/unit/`.
- Cobertura mínima objetivo: **80%** en `lib/`, **70%** en `components/`.
- Los tests no hacen llamadas de red reales — mock con `vi.mock` o MSW.
- Los tests del price calculator verifican: cálculo de peso, escalado de tiempo, precios escalonados, casos borde (dimensiones cero, materiales inválidos).
- Usar `describe/it` con nombres descriptivos en español.

### 8.2 Pruebas de integración (Vitest + MSW)

- Los tests de API en `__tests__/integration/api/` usan un cliente HTTP real contra handlers mockeados.
- Verificar: códigos HTTP correctos, estructura del JSON response, manejo de errores, autenticación requerida.
- Mock de Prisma con `vi.mock("@/lib/db")` para aislar de la BD.

### 8.3 Pruebas E2E (Playwright)

- Flujos críticos cubiertos: home, catálogo, carrito, checkout (modo test Stripe), registro, login.
- Usar `test.describe` por página/flujo.
- No usar `page.waitForTimeout()` — usar `page.waitForSelector()` o `page.waitForResponse()`.
- Screenshots en fallo: configurado en `playwright.config.ts`.

### 8.4 Comandos

```bash
npm run test           # Vitest en modo watch
npm run test:ci        # Vitest sin watch (CI)
npx playwright test    # Tests E2E
npm run lint           # ESLint
npx tsc --noEmit       # Type check
npx prisma validate    # Validar schema
```

---

## 9. BASE DE DATOS

### 9.1 Migraciones

- Crear migración: `npx prisma migrate dev --name <descripcion_snake_case>`
- Aplicar en producción: `npx prisma migrate deploy`
- **NUNCA** `prisma db push` en producción.
- Las migraciones son inmutables una vez en producción — crear nueva migración para corregir.

### 9.2 Seed

- Ejecutar seed: `npx prisma db seed`
- El seed es **determinista** — si se ejecuta dos veces no crea duplicados (usar `upsert`).
- El seed cubre: 1 admin, 5 usuarios test, 4 materiales (PLA/PETG/ASA/TPU), colores Bambu Lab, 30 productos, coupones, configuración de precios.
- Contraseñas en seed: `admin123` / `test123` — NUNCA en producción.

### 9.3 Prisma Client

- Singleton en `lib/db.ts` via `globalThis` para evitar múltiples instancias en dev.
- Importar siempre como `import { prisma } from "@/lib/db"` (named export).
- `app/api/wishlist/route.ts` usa importación por defecto — debe corregirse a named export.
- Usar `select` para proyectar solo los campos necesarios.
- Usar `include` con cuidado — evitar N+1 queries.
- Transactions para operaciones atómicas: `prisma.$transaction([...])`.

### 9.4 Índices Recomendados

Añadir en `schema.prisma` para búsquedas frecuentes:

```prisma
model Product {
  @@index([category])
  @@index([material])
  @@index([featured])
}

model Order {
  @@index([userId])
  @@index([status])
}
```

---

## 10. MOTOR DE PRECIOS

### 10.1 Arquitectura

```
Frontend (orientativo) → Web Worker (pricing.worker.ts) → price-calculator.ts (puro)
Backend (definitivo)   → pricing-service.ts (Prisma)   → price-calculator.ts (puro)
```

### 10.2 Invariantes

- El precio que el usuario **paga** siempre lo calcula el servidor en el momento del checkout.
- El precio mostrado en UI corresponde a sus dimensiones explicitas en la tarjeta del producto.
- El tiempo de impresión se calcula en función de las dimensiones y el material.
- Los márgenes son configurables via `PricingConfig` en BD — no hardcodeados.

### 10.3 Configuración Base (Bambu Lab P2S - ES 2025)

```
Amortización máquina: €0.12/hora (P2S €750 / 6000h vida útil)
Electricidad:         €0.04/hora (150W × €0.27/kWh)
Consumibles:          €0.02/hora (boquilla E6 ~300h + lubricación)
Márgenes:             ×2.5 (1-4ud) / ×2.0 (5-9ud) / ×1.5 (10+ud)
```

---

## 11. FLUJO DE CHECKOUT

```
1. Usuario → /cart       → verifica items y precios
2. Usuario → /checkout   → formulario de envío
3. POST /api/checkout    → crea Stripe Session + Order (status: pending)
4. Stripe               → redirect a success/cancel URL
5. Stripe Webhook        → POST /api/webhook → actualiza Order (status: paid)
6. Stripe Webhook        → descuenta stock, genera puntos de fidelidad
7. Usuario → /orders     → ve historial de pedidos
```

### 11.1 Reglas

- El Order se crea con `status: "pending"` antes de redirigir a Stripe.
- Solo el webhook de Stripe cambia el status a `"paid"` — nunca el frontend.
- El webhook verifica firma antes de procesar.
- Los ítems del pedido incluyen dimensiones, material, color y precio final.
- El descuento de cupón se aplica en checkout y se registra en el Order.
- Estados válidos: `pending → paid → processing → shipped → delivered | cancelled`.

---

## 12. PANEL DE ADMINISTRACIÓN

- Acceso exclusivo a usuarios con `role === "admin"`.
- Protección doble: middleware Next.js (frontend) + verificación de sesión en cada endpoint admin.
- Funcionalidades: gestión de productos, materiales, colores, pedidos, usuarios, cupones, inventario, impresoras, estadísticas, alertas, precios.
- Las operaciones destructivas (DELETE) requieren confirmación explícita.
- Los cambios de precio de materiales recalculan `ProductPrice` asociados.

---

## 13. RENDIMIENTO

- Componentes de servidor por defecto — Componentes cliente solo cuando sea necesario.
- `export const dynamic = "force-dynamic"` en routes que leen sesión/BD.
- Paginación obligatoria en listados (predeterminado: 12 items/página).
- Los cálculos de precio en frontend usan Web Worker para no bloquear el hilo principal.
- Las imágenes de productos: formato `.jpg`, comprimidas (objetivo: <200KB), en `public/images/`.
- `next/image` con `unoptimized: true` — solo imágenes locales.
- Zustand stores con selectores granulares para minimizar re-renders.

---

## 14. VARIABLES DE ENTORNO

### Requeridas

```env
DATABASE_URL=postgresql://user:pass@host:5432/ecommerce_3d_print
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<string_aleatorio_32_chars>
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

### Opcionales

```env
NEXT_DIST_DIR=.next
```

### Reglas

- `.env.local` nunca se commitea — está en `.gitignore`.
- `.env.example` existe con todas las variables sin valores.
- Las variables `NEXT_PUBLIC_*` son visibles en el browser — NUNCA poner secretos.

---

## 15. CONVENCIONES DE CÓDIGO

### Nomenclatura

- Archivos de componentes: `kebab-case.tsx`
- Archivos de utilidades: `kebab-case.ts`
- Componentes React: `PascalCase`
- Funciones y variables: `camelCase`
- Constantes globales: `UPPER_SNAKE_CASE`
- Tipos e interfaces: `PascalCase` con sufijo `Type` para interfaces en `lib/types.ts`
- Enums: evitar — usar `as const` objects

### Imports

- Paths absolutos con alias `@/` — nunca paths relativos que suban más de un nivel.
- Orden: externos → internos `@/lib` → internos `@/components` → internos `@/app`.
- Sin circular imports.

### Logs

- **PROHIBIDO** `console.log` en código de producción.
- Los `console.error` en catch blocks de API routes están permitidos (stack trace en server).
- **PROHIBIDO** loguear datos de sesión, tokens o datos de usuario.
- En `lib/auth-options.ts` NO debe haber `console.log` de sesión/token.

### Comentarios

- Solo cuando la lógica no es autoevidente.
- En español para lógica de negocio.
- JSDoc en funciones públicas de `lib/`.

---

## 16. CI/CD CHECKLIST

Antes de cualquier merge/deploy:

- [ ] `npx tsc --noEmit` — sin errores
- [ ] `npm run lint` — sin warnings ni errores
- [ ] `npm run test:ci` — todos los tests pasan
- [ ] `npx prisma validate` — schema válido
- [ ] Sin `console.log` en código (excepto `console.error` en server)
- [ ] Sin `any` explícito nuevo
- [ ] Sin secretos hardcodeados
- [ ] Imágenes nuevas en `public/images/` (<200KB)
- [ ] Variables de entorno documentadas en `.env.example`

---

## 17. ERRORES CONOCIDOS Y SOLUCIONES

| Error                                         | Causa                                                                        | Solución                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Hydration mismatch en language                | Zustand persist + SSR                                                        | `useLanguage()` retorna `"es"` hasta que `_hasHydrated === true` |
| `usePathname()` en RootLayout                 | Los hooks de navegación no están disponibles en componentes de servidor raíz | Usar `BodyClassController` (componente cliente)                  |
| Importación por defecto de prisma en wishlist | `import prisma from "@/lib/db"` en vez de named export                       | Cambiar a `import { prisma } from "@/lib/db"`                    |
| `console.log` en auth-options                 | Debug logs en callbacks de JWT/session                                       | Eliminar los 4 console.log de `lib/auth-options.ts`              |
| `(user as any)?.role` en auth-options         | NextAuth no extiende el tipo User                                            | Usar `(user as { role?: string })?.role`                         |

---

## 18. MODELO DE NEGOCIO — REGLAS DE DOMINIO

1. **Un producto puede imprimirse en cualquier material disponible** — el precio varía por material.
2. **El cliente elige dimensiones dentro del rango [min, max] del producto** — el precio se recalcula.
3. **El cliente elige color** — el color pertenece a un material, se verifica stock de `MaterialColor`.
4. **El stock de material se descuenta en gramos** al confirmar el pedido (webhook Stripe).
5. **Los puntos de fidelidad** se acreditan al confirmar pago: 1 punto por cada €1 gastado.
6. **Los cupones** son de uso único por usuario o de uso múltiple según configuración.
7. **El IVA es 21%** (España) — se aplica sobre subtotal + envío - descuento.
8. **El envío es gratuito** para pedidos >€50 (configurable en `PricingConfig`).
9. **Las reseñas** requieren haber comprado el producto (verificar en Order items).
10. **El rating del producto** se recalcula al agregar una reseña: media ponderada.
11. **Los pedidos** tienen estados: `pending → paid → processing → shipped → delivered | cancelled`.
12. **Las impresoras** tienen estados: `available | busy | maintenance`.
13. **Las alertas** se generan automáticamente cuando el stock de un material cae bajo umbral.

---

## 19. ANTI-PATRONES PROHIBIDOS

- Calcular precios solo en frontend y confiar en ese valor en el servidor
- Actualizar el status del pedido desde el frontend
- Exponer el campo `password` del usuario en cualquier respuesta
- Usar `prisma db push` en producción
- Hardcodear URLs, secretos o credenciales en el código
- Componentes cliente que importan Prisma directamente
- `console.log` con datos de sesión o tokens en producción
- Tests que hacen llamadas reales a BD o red externa
- `any` explícito sin comentario justificado
- Imágenes externas (URLs de otros dominios) — solo `public/images/`
- Modificar migraciones ya aplicadas
- Endpoints admin sin verificación de rol en servidor
