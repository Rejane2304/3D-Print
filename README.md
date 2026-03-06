# 3D Print — Ecommerce de Productos Impresos en 3D

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6.7-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?logo=postgresql)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe)

**Tienda online especializada en productos impresos en 3D — motor de precios Bambu Lab P2S**

</div>

---

## Caracteristicas Principales

### Tienda Online
- Catalogo con **30 productos** y filtros avanzados (material, categoria, precio)
- Configurador dinamico de productos (dimensiones, color, material)
- **Calculadora de precios avanzada** con 4 materiales (PLA / PETG / ASA / TPU)
- **Precios escalonados por volumen**: 1–4 uds (×2.5), 5–9 uds (×2.0), 10+ uds (×1.5)
- Desglose de costes por linea (material, maquina, mantenimiento, electricidad)
- Carrito de compras persistente
- **Sistema de cupones de descuento** (porcentaje y monto fijo)
- Checkout integrado con Stripe
- Sistema de resenas y valoraciones

### Usuarios
- Autenticacion (Email/Password + Google SSO)
- Perfil de usuario editable
- Historial de pedidos
- Lista de deseos (Wishlist)
- Sistema de puntos de fidelizacion

### Panel de Administracion
- Dashboard con metricas en tiempo real
- Gestion CRUD de productos
- Gestion de pedidos y estados
- Gestion de usuarios y roles
- **Gestion de materiales** (PLA/PETG/ASA/TPU con costes, densidad, mantenimiento)
- **Gestion de cupones de descuento** (tipo, valor, fechas, limite de usos)
- **Control de inventario** por material con alertas de stock minimo
- **Recalculo masivo de precios** cuando cambian los costes de material
- Admins no pueden realizar compras (control de roles)

### Internacionalizacion
- Soporte para Espanol e Ingles
- Cambio de idioma dinamico

### Busqueda Inteligente
- Autocompletado en tiempo real
- Busqueda por nombre, descripcion y categoria

---

## Stack Tecnologico

| Tecnologia | Uso |
|------------|-----|
| **Next.js 14** | Framework React con App Router |
| **TypeScript** | Tipado estatico estricto (strict: true, 0 errores) |
| **Tailwind CSS** | Estilos utilitarios |
| **Prisma ORM** | Gestion de base de datos |
| **PostgreSQL** | Base de datos relacional |
| **NextAuth.js** | Autenticacion JWT + Google OAuth |
| **Stripe** | Procesamiento de pagos, webhooks |
| **Zustand** | Estado global del cliente (carrito + idioma) |
| **Web Workers** | Calculo de precios en background sin bloquear UI |
| **Framer Motion** | Animaciones |
| **Jest** | Testing unitario e integracion (40 tests) |

---

## Estructura del Proyecto

```
ecommerce_3d_print/
├── app/                    # App Router (paginas y API)
│   ├── api/
│   │   ├── materials/          # GET materiales publicos
│   │   ├── coupons/validate/   # POST validar cupon
│   │   ├── admin/
│   │   │   ├── materials/      # CRUD materiales (admin)
│   │   │   ├── coupons/        # CRUD cupones  (admin)
│   │   │   ├── inventory/      # GET/PUT inventario (admin)
│   │   │   └── pricing/recalculate/  # POST recalculo masivo
│   │   └── ...                 # checkout, webhook, products, etc.
│   ├── admin/
│   │   ├── materials/          # Pagina gestion materiales
│   │   ├── coupons/            # Pagina gestion cupones
│   │   └── ...                 # dashboard, products, orders, users
│   ├── catalog/            # Catalogo de productos
│   ├── product/[id]/       # Detalle de producto con precios avanzados
│   ├── cart/               # Carrito de compras
│   └── checkout/           # Proceso de checkout con cupones
├── components/             # Componentes reutilizables
├── hooks/
│   └── use-pricing-worker.ts   # Hook React para el Web Worker
├── workers/
│   └── pricing.worker.ts       # Web Worker — calcula precios en background
├── lib/
│   ├── price-calculator.ts     # Motor de precios avanzado (p2s)
│   ├── pricing-service.ts      # Servicio Prisma: calcula y persiste precios
│   └── types.ts                # Tipos TS: Material, Coupon, Inventory, Worker
├── prisma/
│   ├── schema.prisma           # Esquema completo (ver modelos abajo)
│   └── migrations/             # Migraciones SQL
├── scripts/
│   └── seed.ts                 # Seed: materiales + cupones + 30 productos + precios
├── private/                    # Documentacion privada (no versionada)
│   └── p2s-pricing-system/     # Sistema de precios original Bambu P2S (referencia)
├── __tests__/              # Tests unitarios e integracion (40 tests, 8 suites)
└── e2e/                    # Tests end-to-end (Playwright)
```

---

## Modelos de Base de Datos

| Modelo | Descripcion |
|--------|-------------|
| `User` | Usuarios con roles (user/admin), puntos de fidelidad |
| `Product` | 30 productos con dimensiones, material, `printTimeMinutes`, `isActive` |
| `Material` | PLA/PETG/ASA/TPU con `pricePerKg`, `maintenanceFactor`, `density` |
| `ProductPrice` | Cache de precios calculados por producto × material |
| `Inventory` | Stock por material con `minStock` y alertas de bajo inventario |
| `Coupon` | Cupones PERCENTAGE/FIXED con fechas, limite de usos y `usedCount` |
| `Cart` / `CartItem` | Carrito de compras con `materialId` opcional |
| `Order` / `OrderItem` | Pedidos con `discount`, `couponId`, `materialId` opcional |
| `Review` | Resenas de productos |
| `Wishlist` | Lista de deseos |
| `PointsTransaction` | Historial de puntos |

---

## Endpoints API

### Publicos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/products` | Listar productos (filtros, paginacion) |
| GET | `/api/products/[id]` | Detalle de producto |
| GET | `/api/search?q=` | Busqueda con autocompletado |
| GET | `/api/materials` | Materiales disponibles (inStock) |
| POST | `/api/coupons/validate` | Validar cupon (codigo + subtotal) |

### Usuario Autenticado
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET/POST/DELETE | `/api/cart` | Gestion del carrito |
| POST | `/api/checkout` | Iniciar pago Stripe (acepta `couponCode`) |
| GET | `/api/orders` | Historial de pedidos |
| GET/PUT | `/api/profile` | Perfil de usuario |
| GET/POST/DELETE | `/api/wishlist` | Lista de deseos |
| GET | `/api/points` | Puntos e historial |

### Administracion (rol admin)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Estadisticas del dashboard |
| GET/POST/PUT/DELETE | `/api/admin/products` | CRUD productos |
| GET/PUT | `/api/admin/orders` | Gestion de pedidos |
| GET/PUT | `/api/admin/users` | Gestion de usuarios |
| GET/POST | `/api/admin/materials` | Listar y crear materiales |
| GET/PUT/DELETE | `/api/admin/materials/[id]` | Actualizar/eliminar material (recalcula precios) |
| GET/POST | `/api/admin/coupons` | Listar y crear cupones |
| PUT/DELETE | `/api/admin/coupons/[id]` | Actualizar/eliminar cupon |
| GET/PUT | `/api/admin/inventory` | Stock por material (alerta lowStock) |
| POST | `/api/admin/pricing/recalculate` | Recalculo masivo de todos los precios |

---

## Motor de Precios (Bambu Lab P2S)

### Formula de coste base

```
peso_kg    = (dimX × dimY × dimZ / 1000) × densidad × infill(0.2) / 1000
horas      = printTimeMinutes / 60

coste_material     = peso_kg × material.pricePerKg
coste_maquina      = horas  × 0.25  (amortizacion $1500 P2S / 6000h)
coste_mantenimiento= horas  × material.maintenanceFactor
coste_operacion    = horas  × 0.05  (electricidad ~0.15kW × $0.30/kWh)
coste_base         = suma de los 4 + finishCost
```

### Precios escalonados por volumen

| Cantidad | Margen | Descuento vs. unit |
|----------|--------|--------------------|
| 1–4 uds | ×2.5 | — |
| 5–9 uds | ×2.0 | −20% |
| 10+ uds | ×1.5 | −40% |

### Propiedades de Materiales

| Material | Densidad | Precio/kg | Factor mantenimiento |
|----------|----------|-----------|----------------------|
| PLA | 1.24 g/cm³ | €20 | 0.03 |
| PETG | 1.27 g/cm³ | €25 | 0.04 |
| ASA | 1.07 g/cm³ | €30 | 0.05 |
| TPU | 1.21 g/cm³ | €35 | 0.06 |

### Sistema de Cupones

```
discountType = PERCENTAGE  → descuento = subtotal × (valor / 100)
discountType = FIXED       → descuento = valor (€)

Validaciones: isActive, validUntil, maxUses, minPurchase
usedCount se incrementa solo en webhook Stripe (checkout.session.completed)
```

### Sistema de Puntos
```
puntos_ganados = total_pedido_euros × 1 punto/€
valor_punto    = €0.01
```

---

## Web Worker de Precios

El calculo de la matriz de precios (todos los productos × todos los materiales) se ejecuta en un Web Worker para no bloquear el hilo principal de la UI.

```typescript
// Hook React
const { prices, isCalculating, progress } = usePricingWorker();
calculate(products, materials);  // lanza el worker en background

// Worker reporta PROGRESS cada 5 calculos y RESULT al terminar
```

---

## Testing

```bash
# Todos los tests
npx jest --no-coverage

# Tests unitarios
npx jest __tests__/unit

# Tests de integracion
npx jest __tests__/integration

# Cobertura
npx jest --coverage

# TypeScript (0 errores)
npx tsc --noEmit
```

**Estado actual: 40/40 tests, 8 suites, 0 errores TypeScript**

---

## Inicio Rapido

```bash
# 1. Instalar dependencias
yarn install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (DATABASE_URL, NEXTAUTH_SECRET, STRIPE_*)

# 3. Generar cliente Prisma y aplicar migraciones
yarn prisma generate
yarn prisma migrate dev

# 4. Poblar base de datos (materiales + cupones + 30 productos + precios)
yarn prisma db seed

# 5. Iniciar servidor
yarn dev
```

Abre http://localhost:3000

---

## Credenciales por Defecto (seed)

| Tipo | Email | Password |
|------|-------|----------|
| **Admin** | john@doe.com | johndoe123 |
| **Cliente** | cliente@test.com | cliente123 |

**Cupones de prueba:**

| Codigo | Tipo | Valor | Min. compra |
|--------|------|-------|-------------|
| `BIENVENIDO10` | % | 10% | €20 |
| `PROMO5EUR` | Fijo | €5 | €30 |
| `VERANO20` | % | 20% | €50 |

> **Control de roles:** Los administradores no pueden realizar compras y los usuarios normales no pueden acceder al panel de administracion.

---

## Ramas Git

| Rama | Descripcion |
|------|-------------|
| `main` | Baseline inicial del proyecto |
| `dev` | Integracion del motor de precios p2s + materiales + cupones + inventario |

---

## Costes de Servicios

| Servicio | Coste |
|----------|-------|
| PostgreSQL (Abacus.AI) | Gratuito |
| Hosting (Abacus.AI) | Gratuito hasta trafico significativo |
| NextAuth | Gratuito (open source) |
| Stripe | 2.9% + €0.30 por transaccion |

---

## Documentacion Adicional

Consulta la carpeta `private/` para:

| Archivo | Contenido |
|---------|----------|
| `PROMPT_MAESTRO.md` | Documento origen del proyecto |
| `PROPUESTA_SIMPLIFICADA.md` | Estrategia de implementacion |
| `PLAN_IMPLEMENTACION.md` | Guia paso a paso completa |
| `INSTALACION_Y_DESPLIEGUE.md` | Instalacion y deploy |
| `COMANDOS_TERMINAL.md` | Referencia de comandos |
| `p2s-pricing-system/` | Sistema de precios Bambu P2S original (referencia) |

---

<div align="center">

**Desarrollado para 3D Print**

*Barcelona, Espana — Marzo 2026*

</div>
