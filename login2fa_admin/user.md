# Login 2FA Admin/User — Plan de Implementación

## Decisiones

- Cookies **separadas** por host (sin `Domain=.freck.lat`).
- Enrolamiento 2FA admin **obligatorio en gate** del panel (primer acceso).

## Arquitectura

| Portal | Dominio | Cookie | Login | 2FA |
|--------|---------|--------|-------|-----|
| Usuarios | freck.lat | host-scoped | `/login` | Opcional en `/settings/security` |
| Admin | admin.freck.lat | host-scoped | `/login` (rewrite → `/admin/login`) | Obligatorio — gate en layout |

### Flujo admin

1. `admin.freck.lat/login` — login con email + contraseña.
2. Si `role !== admin` — error "Solo cuentas administrador".
3. Si tiene TOTP activado — paso código TOTP.
4. Si no tiene TOTP — `setToken` + redirect `/` — gate obliga enrolamiento QR.
5. Tras enrolamiento — clear token — volver a login — ahora pide TOTP — panel carga.

### Flujo usuario

1. `freck.lat/login` — login con email + contraseña.
2. Si tiene TOTP — paso código TOTP.
3. Redirect a `/dashboard`.
4. `/settings/security` — enrolamiento 2FA opcional.
5. `/login/recover` — recuperación con backup codes.

## Middleware (proxy.ts → middleware.ts)

- Host `admin.*` + path no empieza con `/admin` → rewrite interno a `/admin/{path}`.
- Host no-admin + path empieza con `/admin` → redirect 302 a `https://admin.freck.lat/`.

## API

- `GET /auth/me` (authenticate) — devuelve `{ id, email, role, totp_enabled }`.

## Estructura de rutas

    app/admin/
      layout.tsx                    ← passthrough (solo children)
      (public)/
        layout.tsx                  ← sin sidebar, sin guard
        login/page.tsx              ← login admin
        login/recover/page.tsx      ← recover admin con backup codes
      (protected)/
        layout.tsx                  ← guard JWT + check admin + check 2FA + sidebar
        page.tsx                    ← dashboard admin
        orders/page.tsx
        notifications/page.tsx
        dlq/page.tsx
        users/page.tsx

    app/(user)/
      page.tsx                      ← landing
      login/page.tsx                ← login user
      login/recover/page.tsx        ← recover user con backup codes
      register/page.tsx
      dashboard/page.tsx
      settings/security/page.tsx    ← enrolamiento 2FA opcional

## Componentes compartidos

| Componente | Ubicación | Uso |
|-----------|-----------|-----|
| AuthShell | `components/layout/AuthShell.tsx` | Centra contenido auth, fondo, orbe decorativo |
| PageHeader | `components/layout/PageHeader.tsx` | Título + descripción + acciones en panel admin |
| LoginForm | `components/auth/LoginForm.tsx` | Email + password + 2FA step (variant: user/admin) |
| TwoFactorEnroll | `components/auth/TwoFactorEnroll.tsx` | QR + secret + confirm + backup codes |
| RecoverForm | `components/auth/RecoverForm.tsx` | Email + password + backup code |
| FormField | `components/ui/FormField.tsx` | Label + input con icono, consistente |

## Sistema de diseño

- **Fuentes:** DM Sans (body) + IBM Plex Mono (códigos, IDs).
- **Tokens CSS:** `auth-shell`, `auth-card`, `container-page`, `table-wrap`.
- **Lang:** `es`.
- **Tema:** fondo oscuro `#0a0a14`, acento verde `#00ed64`.

## Deploy

1. Build local `ec2-dashboard`: `npm run build`.
2. Push a GitHub.
3. En ec2-api-orders: `git pull`, `pm2 restart orders-api`, `npm run build` (dashboard), `pm2 restart dashboard`.
4. Nginx: sin cambios (ya proxy ambos hosts al puerto 3001).

## Checklist

| Test | Esperado |
|------|----------|
| `admin.freck.lat` sin cookie | `/login` con branding admin |
| Login cliente en admin | Error "Solo cuentas administrador" |
| Login admin sin 2FA | Gate QR + backup codes |
| Tras enroll, re-login admin | Paso TOTP → panel carga datos |
| `freck.lat/login` | Login normal, no redirige a admin |
| User settings activa 2FA | Próximo login pide código |
| Recover backup (user y admin) | Token válido, acceso restaurado |
| Logout admin | Cookie borrada solo en admin |
| Cookie freck.lat no visible en admin | Sesiones separadas |
