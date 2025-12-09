# 🚀 SimpleShop - SaaS Backend Multi-Tenant

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

**SimpleShop** es una plataforma SaaS (Software as a Service) diseñada para ayudar a pequeñas empresas (Pymes) a resolver dos problemas clave: **Gestión de Inventario** y **Presencia Digital**.

Este repositorio contiene el **Backend Core**, construido con una arquitectura robusta que permite a múltiples tiendas operar en una sola instancia de forma segura y aislada.

---

## 🏛️ Arquitectura & Decisiones Técnicas

Este no es un backend CRUD tradicional. Implementa una arquitectura **Multi-Tenant Real** (Single Database / Logical Isolation).

### 🔥 Key Features Técnicos:
* **Aislamiento Automático de Datos:** Implementación de `BaseTenantService` y `BaseTenantController`. Los desarrolladores no necesitan filtrar manualmente por `tenantId`; el sistema lo inyecta automáticamente desde el contexto de la petición (JWT).
* **Request Context:** Uso de `AsyncLocalStorage` para manejar el contexto del usuario y del tenant a través de toda la cadena de la petición.
* **Inventario Transaccional:** Uso de `QueryRunner` y transacciones de base de datos para asegurar la integridad del stock (Atomicidad en movimientos de entrada/salida).
* **Seguridad Basada en Roles:** Decoradores personalizados (`@Roles`) y Guards para manejar permisos (Owner, Admin, Staff).
* **Dual API Approach:**
    * **Backoffice API:** Rutas protegidas para la gestión interna de la tienda.
    * **Storefront API:** Rutas públicas optimizadas para la vitrina digital, accesibles mediante `slug`.

---

## 🛠️ Tech Stack

* **Framework:** NestJS (Node.js)
* **Lenguaje:** TypeScript
* **Base de Datos:** PostgreSQL 15
* **ORM:** TypeORM
* **Almacenamiento:** Cloudinary (Imágenes y Assets)
* **Contenedores:** Docker & Docker Compose
* **Seguridad:** Passport, JWT, Bcrypt

---

## 🚧 Estado del Proyecto (Roadmap)

El desarrollo se divide en fases. Actualmente completando la **Fase 1 (Backend Core)**.

### ✅ Backend Core (Completado)
- [x] **Auth Module:** Registro, Login, Hash de contraseñas, JWT Strategy.
- [x] **Tenancy Module:** Creación automática de Tenants al registrar usuario.
- [x] **Users Module:** Gestión de staff con roles y seguridad de tenant.
- [x] **Products Module:** CRUD de productos con filtrado automático por tienda.
- [x] **Categories Module:** Organización de catálogo.
- [x] **Inventory Module:** Bitácora de movimientos (IN/OUT) con actualización transaccional de stock.
- [x] **Uploads Module:** Integración con Cloudinary para subida de imágenes.
- [x] **StoreConfig Module:** Personalización de marca (Logo, Colores, Info) por tienda.
- [x] **Storefront Module:** API pública para visualizar productos sin autenticación.
- [x] **Logging:** Sistema de logs personalizado con contexto.

### ⏳ Pendiente (Próximos pasos)
- [ ] **Orders Module:** Gestión de pedidos y carritos de compra.
- [ ] **Subscription Module:** Gestión de planes SaaS (Free, Pro).
- [ ] **Frontend (Angular):** Desarrollo de la interfaz de usuario (Angular 19/20 + TailwindCSS).

---

## ⚙️ Instalación y Despliegue Local

Sigue estos pasos para levantar el proyecto en tu máquina local.

### 1. Prerrequisitos
* Node.js (v18 o superior)
* Docker & Docker Compose
* Cuenta de Cloudinary (para imágenes)

### 2. Clonar el repositorio
```bash
git clone [https://github.com/tu-usuario/simpleshop-backend.git](https://github.com/tu-usuario/simpleshop-backend.git)
cd simpleshop-backend
3. Configurar Variables de Entorno
Crea un archivo .env en la raíz del proyecto basándote en el siguiente ejemplo:

Fragmento de código

# APP
PORT=3000
NODE_ENV=development
APP_NAME=SimpleShop
API_PREFIX=api

# DATABASE (Docker connection)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=simpleshop
DATABASE_PASSWORD=dev123
DATABASE_NAME=simpleshop_dev
DB_SYNC=true
DB_LOGGING=true

# AUTH (JWT)
JWT_SECRET=tu_super_secreto_seguro
JWT_EXPIRES_IN=7d

# CLOUDINARY (Images)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

4. Levantar Base de Datos (Docker)
Bash

docker-compose up -d
5. Instalar Dependencias y Correr
Bash

npm install
npm run start:dev
El servidor estará corriendo en: http://localhost:3000/api

📡 Endpoints Principales
🔐 Auth & Admin (Privado)

POST /auth/register - Crear nueva cuenta y tienda.

POST /auth/login - Obtener JWT.

POST /products - Crear producto (Tenant inyectado).

POST /inventory - Registrar entrada/salida de stock.

POST /uploads - Subir imagen a Cloudinary.

PATCH /store-config - Personalizar la tienda.

🌍 Storefront (Público)
GET /storefront/:slug - Obtener info de una tienda.

GET /storefront/:slug/products - Ver catálogo de una tienda específica.

👤 Autor
Oscar - Full Stack Developer LinkedIn | GitHub

Este proyecto es parte de un portafolio profesional para demostrar dominio en arquitecturas escalables con NestJS.