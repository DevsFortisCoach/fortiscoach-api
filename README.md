# FortisCoach API

Backend **solo API** para FortisCoach. Un Postgres (Supabase); aislamiento por **`gimnasio_id`** en JWT. App única en **`app.fortiscoach.cl`**; login por **correo global único**.

## Instalación

```bash
npm install
cp .env.example .env
```

## Variables

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Postgres (Supabase) |
| `JWT_SECRET` | Igual que en el web |
| `FRONTEND_URL` | Orígenes CORS (`https://app.fortiscoach.cl,http://localhost:3000`) |
| `ALLOW_VERCEL_PREVIEW` | `true` para `*.vercel.app` |
| SMTP / mail | Ver `.env.example` |

## Desarrollo local

```bash
npm run dev
```

API en `http://localhost:4000`. Web en `http://localhost:3000`.

**Conexión Supabase:** usa el connection string **Session pooler** del dashboard (`aws-0-…pooler.supabase.com`), no solo el host `db.….supabase.co`, si ves `ENETUNREACH` a una dirección IPv6. El código prioriza IPv4 (`ipv4first` en `lib/db.ts`).

## Login

`POST /api/auth/login`

```json
{ "correo": "usuario@ejemplo.com", "contraseña": "..." }
```

Respuesta incluye `token`, `usuario` (con `gimnasio_id`, `gimnasio_nombre`) y `gimnasio: { id, nombre }`.

## Despliegue (Render)

- Build: `npm install && npm run build`
- Start: `npm run start`
- `FRONTEND_URL=https://app.fortiscoach.cl`
