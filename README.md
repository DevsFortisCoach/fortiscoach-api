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
| `SMTP_HOST` | Host SMTP de Brevo (`smtp-relay.brevo.com`) |
| `SMTP_PORT` | Puerto SMTP (`587`) |
| `SMTP_SECURE` | `false` para Brevo SMTP estándar |
| `SMTP_USER` | Login SMTP entregado por Brevo |
| `SMTP_PASS` | SMTP key generada en Brevo |
| `MAIL_FROM_EMAIL` | Correo remitente (`no-reply@fortiscoach.cl`) |
| `MAIL_FROM_NAME` | Nombre del remitente (`FortisCoach`) |
| `MAIL_REPLY_TO` | Correo de respuesta |
| `SOCIO_APP_URL` | URL del acceso de socios (`https://app.fortiscoach.cl`) |

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

Los roles admitidos por la API son: `admin_ti`, `gerencia`, `recepcion`, `entrenador`, `socio`.

## Correos

- `POST /api/mail/send-test`
  Requiere `Authorization: Bearer <token>` con rol `admin_ti`, `gerencia` o `recepcion`.
  Body:

```json
{ "to": "correo@ejemplo.com", "recipientName": "Nombre" }
```

- `POST /api/mail/send-access-credentials`
  Requiere `Authorization: Bearer <token>` con rol `admin_ti`, `gerencia` o `recepcion`.
  Body:

```json
{
  "to": "correo@ejemplo.com",
  "recipientName": "Nombre",
  "gymName": "FortisCoach",
  "temporaryPassword": "Clave1234*",
  "rol": "socio",
  "loginUrl": "https://app.fortiscoach.cl"
}
```

Sender esperado:

```text
FortisCoach <no-reply@fortiscoach.cl>
```

- `POST /api/auth/button-login`
  Ruta exclusiva para el botón del correo. Recibe un `accessToken` temporal y devuelve la sesión normal de la app.

## Despliegue (Render)

- Build: `npm install && npm run build`
- Start: `npm run start`
- `FRONTEND_URL=https://app.fortiscoach.cl`
- Variables SMTP configuradas en Render con la cuenta Brevo autenticada para `fortiscoach.cl`
