# GymFlow Backend: desplegar en Render y conectar con el frontend

## 1. ¿El frontend se dañó?

**No.** El backend se creó dentro de `gymflow/backend` y luego se movió a `gymflow-backend`. En el proyecto del frontend (`gymflow`) **no se modificó ningún archivo**: ni `package.json`, ni rutas, ni config. Solo existió (y después se eliminó) la carpeta `backend`.

**Comprobar que el frontend sigue funcionando:**

```bash
cd /home/sergio/Escritorio/gymflow
npm install
npm run dev
```

Abre http://localhost:3000 y revisa que el login y las vistas carguen igual que antes. Hoy el login usa **auth demo** (JWT generado en el navegador); cuando conectes el backend, cambiarás eso por llamadas a la API.

---

## 2. Paso a paso: subir el backend a Render

### 2.1 Repositorio del backend

- Si **gymflow-backend** es su propio repo:
  - En GitHub/GitLab crea un repo nuevo (ej. `gymflow-backend`).
  - En tu máquina:
    ```bash
    cd /home/sergio/Escritorio/gymflow-backend
    git init
    git add .
    git commit -m "Backend GymFlow API"
    git remote add origin https://github.com/TU_USUARIO/gymflow-backend.git
    git push -u origin main
    ```
- Si el backend sigue dentro del mismo repo que el frontend (monorepo), en Render más adelante usarás **Root Directory** = la carpeta del backend (ej. `backend` o `gymflow-backend` según cómo esté en el repo).

### 2.2 Crear el servicio en Render

1. Entra en [render.com](https://render.com) e inicia sesión.
2. **Dashboard** → **New** → **Web Service**.
3. Conecta el repositorio donde está el backend:
   - Si el backend es un repo solo: selecciona ese repo.
   - Si es monorepo: selecciona el repo y en **Root Directory** pon la carpeta del backend (ej. `gymflow-backend` o `backend`).
4. Configuración del servicio:
   - **Name:** por ejemplo `gymflow-api`.
   - **Region:** la que prefieras (ej. Frankfurt).
   - **Branch:** `main` (o la que uses).
   - **Runtime:** Node.
   - **Build Command:**  
     `npm install && npm run build`
   - **Start Command:**  
     `npm run start`  
     (o `node .next/standalone/server.js` si usas `output: 'standalone'` y quieres usar el servidor standalone).
   - **Instance type:** Free (o el plan que quieras).

### 2.3 Variables de entorno en Render

En el mismo Web Service: **Environment** (o **Environment Variables**).

Añade:

| Key             | Value / Notas |
|-----------------|----------------|
| `DATABASE_URL`  | Connection string de Supabase (Postgres). En Supabase: Project Settings → Database → Connection string (URI, modo Session o Transaction). |
| `JWT_SECRET`    | Una clave secreta de al menos 32 caracteres (genera una aleatoria y guárdala). |
| `FRONTEND_URL`  | URL del frontend en producción para CORS. Ejemplo: `https://tu-app.vercel.app` (la que te dé Vercel al desplegar el frontend). |

No subas valores reales a ningún repo; solo en el panel de Render (y luego en Vercel para el frontend).

### 2.4 Desplegar

- Pulsa **Create Web Service**. Render hará el primer deploy.
- Cuando termine, te dará una URL base, por ejemplo:  
  `https://gymflow-api.onrender.com`

### 2.5 Probar la API

Desde tu máquina (o Postman):

```bash
curl -X POST https://gymflow-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin.test@gymflow.local","contraseña":"Admin1234*","rol":"admin_ti"}'
```

Si la base de datos tiene ese usuario y rol, deberías recibir `token` y `usuario` en JSON.

---

## 3. Conectar el frontend con el backend

### 3.1 Variable de entorno en el frontend

En el proyecto del frontend (`gymflow`):

- Crea o edita `.env.local` (y en Vercel, más adelante, las mismas variables en **Settings → Environment Variables**):

```env
# URL base del backend (sin barra final)
NEXT_PUBLIC_API_URL=http://localhost:4000
```

En **producción** (Vercel) pon la URL de Render:

```env
NEXT_PUBLIC_API_URL=https://gymflow-api.onrender.com
```

### 3.2 Usar la API en el frontend

Hoy el login de recepción (y los demás) usan **auth demo**: generan un JWT en el navegador con `lib/auth/recepcion.ts` (y similares). Para usar el backend real:

1. **Login:** en cada pantalla de login (recepcion, gerencia, admin_ti, socio, etc.), en lugar de llamar a `createRecepcionJwt` (o el equivalente), haz:
   - `POST ${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`
   - Body: `{ "correo", "contraseña", "rol" }` (el `rol` según la pantalla: `"recepcion"`, `"gerencia"`, `"admin_ti"`, `"socio"`, etc.).
   - Guarda en memoria o en `localStorage` el `token` y los datos de `usuario` que devuelve el backend.
2. **Peticiones protegidas:** en cualquier llamada a la API (por ejemplo editar socio), envía el token en el header:
   - `Authorization: Bearer <token>`.

Así el frontend “echa a andar” igual que antes (auth demo), y cuando quieras, cambias solo la lógica de login y las llamadas a la API para usar `NEXT_PUBLIC_API_URL` y el token del backend.

### 3.3 CORS y producción

En Render ya tienes `FRONTEND_URL` para CORS. Cuando tengas la URL final del frontend en Vercel, actualiza `FRONTEND_URL` en Render con esa URL exacta (con `https://` y sin barra final) para que el navegador permita las peticiones desde el frontend.

---

## 4. Resumen rápido

| Paso | Dónde | Acción |
|------|--------|--------|
| 1 | Local | `cd gymflow && npm run dev` → comprobar que el frontend sigue bien. |
| 2 | GitHub/GitLab | Repo del backend (o monorepo con Root Directory en Render). |
| 3 | Render | New → Web Service → repo + Root Directory si aplica. |
| 4 | Render | Build: `npm install && npm run build`, Start: `npm run start`. |
| 5 | Render | Env: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`. |
| 6 | Render | Deploy y copiar URL del servicio (ej. `https://gymflow-api.onrender.com`). |
| 7 | Frontend | `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:4000` (dev) o URL de Render (prod). |
| 8 | Frontend | Cambiar login (y demás llamadas) para usar `NEXT_PUBLIC_API_URL` y el token del backend. |
| 9 | Vercel | Desplegar frontend y poner en Render `FRONTEND_URL` = URL de Vercel. |

Si quieres, el siguiente paso puede ser implementar en el frontend una función `loginWithBackend(correo, contraseña, rol)` y usarla en la pantalla de login de recepción (y luego en el resto).
