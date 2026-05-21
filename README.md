# BiblioScan

Plataforma institucional de inventario y reconciliación patrimonial con **PostgreSQL** y escaneo móvil continuo.

## Stack

- Next.js 15 · TypeScript · Tailwind · shadcn/ui
- **PostgreSQL** (`pg`) · JWT + cookies · bcrypt
- ZXing · PWA (Serwist) · Railway / Docker

## Inicio rápido (local)

### 1. Base de datos

```bash
npm run db:up          # Docker: Postgres en localhost:5432
npm run db:migrate     # Aplica db/migrations/*.sql + seed
```

O en un solo paso: `npm run db:setup`

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

```env
DATABASE_URL=postgresql://biblioscan:biblioscan@localhost:5432/biblioscan
JWT_SECRET=tu-secreto-largo-minimo-32-chars
```

### 3. App

```bash
npm install
npm run dev
```

Abre **http://localhost:3000**

**Usuarios demo** (tras migración):

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@biblioscan.local | admin123 | admin |
| operador@biblioscan.local | admin123 | operator |

### 4. Importar Excel institucional

```bash
npm run seed:excel
```

## Arquitectura

```
db/migrations/     → Esquema PostgreSQL + función process_scan()
src/lib/db/        → Pool + queries
src/lib/auth/      → JWT, sesión, bcrypt
src/app/api/       → REST API
```

## API

| Ruta | Descripción |
|------|-------------|
| POST `/api/auth/login` | Iniciar sesión |
| POST `/api/auth/logout` | Cerrar sesión |
| GET `/api/auth/me` | Usuario actual |
| POST `/api/scans` | Procesar escaneo |
| GET `/api/reconciliation` | Reconciliación |
| GET/POST `/api/sessions` | Sesiones |
| POST `/api/import` | Excel |

## Railway

1. Añade un servicio **PostgreSQL** en Railway.
2. Variables en la app:
   - `DATABASE_URL` (desde el plugin Postgres)
   - `JWT_SECRET`
   - `DATABASE_SSL=true` (si aplica)
3. Deploy con `Dockerfile` — healthcheck: `/api/health`

## Modo demo (sin Postgres)

En `.env.local`:

```env
BIBLIOSCAN_DEV_MODE=true
NEXT_PUBLIC_BIBLIOSCAN_DEV_MODE=true
```

Datos en memoria; útil solo para probar UI sin base de datos.

## Licencia

Uso institucional — BiblioScan © 2025
