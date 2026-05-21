# Desplegar BiblioScan en Railway (App + PostgreSQL)

Guía para tener **la aplicación y la base de datos** en el mismo proyecto Railway.

## 1. Crear el proyecto

1. Entra a [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → selecciona `pumarejo075-commits/inventariobiblioteca`
3. Railway creará un servicio web (BiblioScan) automáticamente.

## 2. Añadir PostgreSQL

1. En el proyecto, clic **+ Create** (o **Add Service**)
2. Elige **Database** → **PostgreSQL**
3. Espera a que el servicio `Postgres` esté activo (luz verde).

No necesitas crear tablas a mano: el deploy de BiblioScan ejecuta las migraciones al arrancar.

## 3. Conectar la app con la base de datos

1. Abre el servicio **BiblioScan** (tu app web, no Postgres).
2. Pestaña **Variables** → **+ New Variable** → **Add Reference**
3. Referencia:
   - Variable: `DATABASE_URL`
   - Servicio: `Postgres` (o el nombre de tu BD)
   - Variable del servicio: `DATABASE_URL`

Railway insertará algo como `${{Postgres.DATABASE_URL}}`.

## 4. Variables obligatorias de la app

En el servicio **BiblioScan** → **Variables**, añade también:

| Variable | Valor |
|----------|--------|
| `JWT_SECRET` | Una cadena aleatoria larga (mín. 32 caracteres). Ej: genera con `openssl rand -base64 32` |
| `DATABASE_SSL` | `true` |

**No** copies `DATABASE_URL` a mano si ya usaste la referencia — Railway la actualiza sola.

## 5. Redeploy

1. **Deployments** → **Redeploy** (o push a `main` en GitHub).
2. En los logs deberías ver:
   ```
   [BiblioScan] Aplicando migraciones PostgreSQL...
   → 001_schema.sql
   → 002_functions.sql
   → 003_seed.sql
   [BiblioScan] Iniciando servidor...
   ```

## 6. Dominio público

1. Servicio BiblioScan → **Settings** → **Networking** → **Generate Domain**
2. Abre la URL (ej. `biblioscan-production.up.railway.app`).

## 7. Primer acceso

Usuarios creados por el seed (`003_seed.sql`):

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@biblioscan.local | admin123 | admin |
| operador@biblioscan.local | admin123 | operator |

**Cambia las contraseñas** después del primer login en producción.

## 8. Importar tu Excel en producción

Desde tu máquina local con la URL pública de Railway:

```bash
# Opcional: importar vía UI en /import dentro de la app
# O por script (necesitas DATABASE_URL pública de Postgres):
DATABASE_URL="postgresql://..." npm run seed:excel
```

La URL de Postgres la obtienes en: servicio **Postgres** → **Connect** → **Public URL** (solo para tareas admin, no la expongas).

## Arquitectura en Railway

```
┌─────────────────────┐     DATABASE_URL (red privada)
│  BiblioScan (web)   │ ─────────────────────────────► ┌──────────────┐
│  Docker + Next.js   │                                │  PostgreSQL  │
│  migrate al start   │                                │  Railway     │
└─────────────────────┘                                └──────────────┘
```

## Problemas frecuentes

**Build falla en `npm ci`**  
Ya corregido en el Dockerfile con `--omit=optional`. Haz pull de `main` y redeploy.

**`DATABASE_URL is not set`**  
Falta la referencia de variable desde Postgres al servicio web.

**Error SSL / connection**  
Añade `DATABASE_SSL=true` en variables de la app.

**Login no funciona**  
Verifica que las migraciones corrieron (logs de deploy). Prueba `admin@biblioscan.local` / `admin123`.

## Healthcheck

Railway usa: `GET /api/health` → debe responder `{"status":"ok",...}`.
