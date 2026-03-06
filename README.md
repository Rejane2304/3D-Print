# 🎨 3D Print — Ecommerce de Productos Impresos en 3D

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-6.7-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?logo=postgresql)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe)

**Tienda online especializada en productos impresos en 3D con materiales PLA y PETG**

</div>

---

## 🚀 Características Principales

### 🛒 Tienda Online
- Catálogo con **30 productos** y filtros avanzados (material, categoría, precio)
- Configurador dinámico de productos (dimensiones, color, material)
- Calculadora de precios en tiempo real
- **Paleta de colores** visible en tarjetas de productos
- Carrito de compras persistente
- Checkout integrado con Stripe
- Sistema de reseñas y valoraciones

### 👤 Usuarios
- Autenticación (Email/Password + Google SSO)
- Perfil de usuario editable
- Historial de pedidos
- Lista de deseos (Wishlist)
- Sistema de puntos de fidelización

### 📊 Panel de Administración
- Dashboard con métricas en tiempo real
- Gestión CRUD de productos
- Gestión de pedidos y estados
- Gestión de usuarios y roles
- **Admins no pueden realizar compras** (control de roles)

### 🌍 Internacionalización
- Soporte para Español e Inglés
- Cambio de idioma dinámico

### 🔍 Búsqueda Inteligente
- Autocompletado en tiempo real
- Búsqueda por nombre, descripción y categoría

---

## 🛠️ Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| **Next.js 14** | Framework React con App Router |
| **TypeScript** | Tipado estático |
| **Tailwind CSS** | Estilos utilitarios |
| **Prisma ORM** | Gestión de base de datos |
| **PostgreSQL** | Base de datos relacional |
| **NextAuth.js** | Autenticación |
| **Stripe** | Procesamiento de pagos |
| **Zustand** | Estado global del cliente |
| **Framer Motion** | Animaciones |
| **Jest + Playwright** | Testing |

---

## 📁 Estructura del Proyecto

```
ecommerce_3d_print/
├── app/                    # App Router (páginas y API)
│   ├── api/                # Endpoints API REST
│   ├── admin/              # Panel de administración
│   ├── catalog/            # Catálogo de productos
│   ├── product/[id]/       # Detalle de producto
│   ├── cart/               # Carrito de compras
│   └── checkout/           # Proceso de checkout
├── components/             # Componentes reutilizables (header, footer, providers, UI)
├── lib/                    # Utilidades y configuración (Prisma, auth, stores, helpers)
├── prisma/                 # Esquema de base de datos
├── scripts/
│   └── seed.ts             # Datos iniciales (usuarios + 30 productos)
├── private/                # Documentación privada del proyecto
│   ├── PROMPT_MAESTRO.md
│   ├── PROPUESTA_SIMPLIFICADA.md
│   ├── PLAN_IMPLEMENTACION.md
│   ├── INSTALACION_Y_DESPLIEGUE.md
│   └── COMANDOS_TERMINAL.md
├── __tests__/              # Tests unitarios e integración
├── e2e/                    # Tests end-to-end (Playwright)
├── .env                    # Variables de entorno (no versionado)
├── .env.example            # Plantilla de variables
└── package.json            # Dependencias y scripts
```

---

## 🗄️ Modelos de Base de Datos

| Modelo | Descripción |
|--------|-------------|
| `User` | Usuarios con roles (user/admin), puntos de fidelidad |
| `Product` | 30 productos con configuración 3D |
| `Cart` / `CartItem` | Carrito de compras |
| `Order` / `OrderItem` | Pedidos con estado y envío |
| `Review` | Reseñas de productos |
| `Wishlist` | Lista de deseos |
| `PointsTransaction` | Historial de puntos |

---

## 🔗 Endpoints API

### Públicos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products` | Listar productos (filtros, paginación) |
| GET | `/api/products/[id]` | Detalle de producto |
| GET | `/api/search?q=` | Búsqueda con autocompletado |

### Usuario Autenticado
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET/POST/DELETE | `/api/cart` | Gestión del carrito |
| POST | `/api/checkout` | Iniciar pago Stripe |
| GET | `/api/orders` | Historial de pedidos |
| GET/PUT | `/api/profile` | Perfil de usuario |
| GET/POST/DELETE | `/api/wishlist` | Lista de deseos |
| GET | `/api/points` | Puntos e historial |

### Administración (rol admin)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Estadísticas del dashboard |
| GET/POST/PUT/DELETE | `/api/admin/products` | CRUD productos |
| GET/PUT | `/api/admin/orders` | Gestión de pedidos |
| GET/PUT | `/api/admin/users` | Gestión de usuarios |

---

## 💰 Fórmulas de Precios

### Cálculo de Peso
```
peso (g) = volumen (cm³) × densidad (g/cm³) × factor_relleno (0.2)
volumen = dimX × dimY × dimZ
```

### Propiedades de Materiales
| Material | Densidad | Precio/g | Color Tema |
|----------|----------|----------|------------|
| PLA | 1.24 g/cm³ | €0.03-0.05 | Cyan |
| PETG | 1.27 g/cm³ | €0.04-0.06 | Amber |

### Sistema de Puntos
```
puntos_ganados = total_pedido_euros × 1 punto/€
valor_punto = €0.01
```

---

## 🧪 Testing

```bash
# Tests Unitarios (22 tests)
npx jest __tests__/unit

# Tests de Integración
npx jest __tests__/integration

# Tests E2E (Playwright)
npx playwright test --ui

# Cobertura
npx jest --coverage
```

---

## 🔐 Credenciales por Defecto

| Tipo | Email | Password |
|------|-------|----------|
| **Admin** | john@doe.com | johndoe123 |
| **Cliente** | cliente@test.com | cliente123 |

> ⚠️ **Control de roles:** Los administradores no pueden realizar compras y los usuarios normales no pueden acceder al panel de administración.

---

## 💳 Costes de Servicios

| Servicio | Coste |
|----------|-------|
| PostgreSQL (Abacus.AI) | ✅ Gratuito |
| Hosting (Abacus.AI) | ✅ Gratuito hasta tráfico significativo |
| NextAuth | ✅ Gratuito (open source) |
| Stripe | ⚠️ 2.9% + €0.30 por transacción |

---

## 📚 Documentación Adicional

Consulta la carpeta `private/` para:

| Archivo | Contenido |
|---------|----------|
| `PROMPT_MAESTRO.md` | Documento origen del proyecto |
| `PROPUESTA_SIMPLIFICADA.md` | Estrategia de implementación |
| `PLAN_IMPLEMENTACION.md` | Guía paso a paso completa |
| `INSTALACION_Y_DESPLIEGUE.md` | Instalación y deploy |
| `COMANDOS_TERMINAL.md` | Referencia de comandos |

---

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencias
cd nextjs_space
yarn install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Configurar base de datos
yarn prisma generate
yarn prisma migrate dev
yarn prisma db seed

# 4. Iniciar servidor
yarn dev
```

Abre http://localhost:3000

---

<div align="center">

**Desarrollado con ❤️ para 3D Print**

*Barcelona, España — Marzo 2026*

</div>
