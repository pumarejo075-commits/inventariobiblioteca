# BiblioScan en Railway — Paso a paso (desde cero)

Guía para quien **aún no ha configurado nada**. Sigue el orden exacto.

---

## Parte A — En GitHub (ya hecho)

El código está en: https://github.com/pumarejo075-commits/inventariobiblioteca

Railway lo lee desde la rama `main`.

---

## Parte B — Crear proyecto en Railway

1. Entra a https://railway.app e inicia sesión.
2. **New Project** → **Deploy from GitHub repo**.
3. Autoriza GitHub y elige el repo **inventariobiblioteca**.
4. Railway crea un servicio web (tu app). Espera el primer deploy (puede fallar hasta configurar variables; es normal).

---

## Parte C — Añadir PostgreSQL

1. En el mismo proyecto, clic **+ Create** (arriba a la derecha).
2. Elige **Database** → **PostgreSQL**.
3. Espera que el recuadro **Postgres** diga **Online** (verde).

No crees tablas manualmente. La app las crea al arrancar.

---

## Parte D — Conectar la app con Postgres (MUY IMPORTANTE)

**NO uses** los valores que Railway sugiere con `localhost` — esos son para tu PC, no para la nube.

### Paso 1: Abre el servicio de la APP

- Clic en el recuadro **inventariobiblioteca** (icono de GitHub), **no** en Postgres.

### Paso 2: Variables → referencia a la base de datos

1. Pestaña **Variables**.
2. Clic **+ New Variable**.
3. Elige **Add Reference** (referencia), no "Raw" con localhost.

Configura:

| Campo | Valor |
|-------|--------|
| Variable name | `DATABASE_URL` |
| Service | **Postgres** (o como se llame tu BD) |
| Variable | `DATABASE_URL` |

4. Guarda. Debe verse algo como `${{Postgres.DATABASE_URL}}`, **no** `localhost`.

### Paso 3: Añadir las otras variables (escribir a mano)

Clic **+ New Variable** → **New Variable** (valor fijo):

| Nombre | Valor |
|--------|--------|
| `JWT_SECRET` | Una frase larga aleatoria, mínimo 32 caracteres. Ejemplo: `BiblioScan2025ProduccionClaveSecretaLarga` |
| `DATABASE_SSL` | `true` |

**No añadas** `NEXT_PUBLIC_APP_URL` con localhost todavía; lo pondrás después del dominio.

### Paso 4: NO pulses "Add" en la lista gris de sugerencias

Si ves sugerencias con `localhost` o `change-me`, **ignóralas** o bórralas. Solo deben quedar las 3 de arriba.

---

## Parte E — Redeploy

1. Servicio **inventariobiblioteca** → pestaña **Deployments**.
2. Clic **Deploy** o **Redeploy** en el último deployment.
3. Abre **View logs** y espera ver:

```
[BiblioScan] Aplicando migraciones PostgreSQL...
→ 001_schema.sql
→ 002_functions.sql
→ 003_seed.sql
[BiblioScan] Iniciando servidor...
```

Si el **build** falla antes, espera el push más reciente del repo (Dockerfile corregido) y redeploy otra vez.

---

## Parte F — Dominio público

1. Servicio **inventariobiblioteca** → **Settings** → **Networking**.
2. **Generate Domain**.
3. Copia la URL (ej. `inventariobiblioteca-production-xxxx.up.railway.app`).
4. Opcional: en Variables añade `NEXT_PUBLIC_APP_URL` = esa URL con `https://`.

Abre la URL en el celular o PC.

---

## Parte G — Inventario completo (automático)

Al arrancar, la app carga **113 activos** desde `db/seed/inventory-uach-2025.json` (relación UACH Oct 2025).

- En **Activos** debes ver ~113 registros (no solo 3).
- En el listado la **clave** aparece **con espacios** (como el Excel).
- En el **sticker** el código va **sin espacios**; el escáner normaliza automáticamente.

Si ves solo 3 ítems: redeploy y revisa logs → `[BiblioScan] Seed inventario: 113 upserts`.

---

## Parte H — Primer login

| Email | Contraseña |
|-------|------------|
| admin@biblioscan.local | admin123 |
| operador@biblioscan.local | admin123 |

Cambia contraseñas después en producción.

---

## Resumen visual

```
┌─────────────────────┐
│  inventariobiblioteca│  ← Variables: DATABASE_URL (ref), JWT_SECRET, DATABASE_SSL
│  (App Next.js)       │
└──────────┬──────────┘
           │ red interna Railway
           ▼
┌─────────────────────┐
│  Postgres           │  ← Online, sin tocar
└─────────────────────┘
```

---

## Si algo falla

| Síntoma | Qué hacer |
|---------|-----------|
| Build failed en `npm ci` / `npm install` | Redeploy tras actualizar repo (último commit) |
| `lightningcss` / webpack | Mismo: último Dockerfile usa Debian, no Alpine |
| App arranca pero login no funciona | Revisa que `DATABASE_URL` sea **referencia** a Postgres, no localhost |
| Error SSL en logs | `DATABASE_SSL=true` |
| "DATABASE_URL is not set" | Falta la referencia en Variables del servicio web |

---

## Checklist rápido

- [ ] Postgres **Online**
- [ ] `DATABASE_URL` = referencia `${{Postgres.DATABASE_URL}}`
- [ ] `JWT_SECRET` = texto largo
- [ ] `DATABASE_SSL` = `true`
- [ ] Sin variables con `localhost`
- [ ] Redeploy con logs OK
- [ ] Dominio generado y app abre en navegador
