# FortisCoach API

Backend **solo API** para FortisCoach (SaaS multi-tenant). Un solo Postgres (Supabase); cada gimnasio se identifica por `gimnasio_id` y por subdominio `subdivinio_slug` (ej. `primefitness.fortiscoach.cl`).

## Requisitos

- Node.js 18+
- Supabase con el schema `bd/fortiscoach_saas_01_schema_completo.sql` aplicado

## Instalación

```bash
npm install
cp .env.example .env
# Editar .env con DATABASE_URL y JWT_SECRET
```

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string Postgres (Supabase) |
| `JWT_SECRET` | Firma JWT (mismo valor que en el frontend) |
| `TENANT_BASE_DOMAIN` | Dominio base (default `fortiscoach.cl`) |
| `DEV_TENANT_SLUG` | Slug del gym en local sin subdominio |
| `CORS_DEFAULT_ORIGIN` | Fallback CORS |
| `ALLOW_VERCEL_PREVIEW` | `true` para permitir `*.vercel.app` |
| SMTP / mail | Ver `.env.example` |

## Multi-tenant

El frontend debe enviar el header **`X-FortisCoach-Tenant`** con el `subdivinio_slug` del gimnasio (el middleware del web lo deriva del host). También se acepta `subdivinio_slug` en el body del login.

CORS permite `https://*.fortiscoach.cl`, `localhost` y `*.localhost`.

## Ejecución en local

```bash
npm run dev
```

API en `http://localhost:4000`. Frontend en `http://primefitness.localhost:3000` o `localhost:3000` con `DEV_TENANT_SLUG=primefitness` en **ambos** proyectos.

## Endpoints principales

- **POST /api/auth/login** — `{ correo, contraseña, rol? }` + tenant por header/host
- **POST /api/auth/change-password** — JWT; actualiza usuario del `gimnasio_id` del token
- **PATCH /api/socios/:id** — recepción (y roles autorizados)

Ver rutas en `app/api/`.

## Despliegue (Render)

- Build: `npm install && npm run build`
- Start: `npm run start`
- Variables: `DATABASE_URL`, `JWT_SECRET`, `TENANT_BASE_DOMAIN`, mail, etc.
