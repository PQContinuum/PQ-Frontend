# Configuración de Google OAuth

Esta guía te ayudará a configurar Google OAuth para permitir que los usuarios inicien sesión con su cuenta de Google.

## Google OAuth

### 1. Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ (Google People API)

### 2. Configurar OAuth Consent Screen

1. Ve a **APIs & Services** > **OAuth consent screen**
2. Selecciona **External**
3. Completa la información:
   - App name: PQ Continuum
   - User support email: tu-email@ejemplo.com
   - Developer contact: tu-email@ejemplo.com
4. Guarda y continúa

### 3. Crear credenciales OAuth

1. Ve a **APIs & Services** > **Credentials**
2. Click en **Create Credentials** > **OAuth 2.0 Client ID**
3. Tipo de aplicación: **Web application**
4. Nombre: PQ Continuum Web
5. **Authorized JavaScript origins**:
   - `http://localhost:3000` (desarrollo)
   - `https://tu-dominio.com` (producción)
6. **Authorized redirect URIs**:
   - `http://localhost:3000/auth/callback` (desarrollo)
   - `https://tu-dominio.com/auth/callback` (producción)
7. Guarda y copia el **Client ID** y **Client Secret**

### 4. Configurar en Supabase

1. Ve a Supabase Dashboard > **Authentication** > **Providers**
2. Busca **Google** y haz click para expandir
3. Habilita Google provider
4. Pega el **Client ID** y **Client Secret**
5. Guarda

### 5. Configurar redirect URLs en Supabase

1. Ve a **Authentication** > **URL Configuration**
2. En **Redirect URLs**, agrega:
   - `http://localhost:3000/auth/callback`
   - `https://tu-dominio.com/auth/callback`
3. Guarda


## Verificar configuración

### 1. Verifica las URLs de redirección

En Supabase Dashboard > **Authentication** > **URL Configuration**:

**Site URL**: `http://localhost:3000` (desarrollo)

**Redirect URLs**:
- `http://localhost:3000/**`
- `http://localhost:3000/auth/callback`
- `https://tu-dominio.com/**` (producción)
- `https://tu-dominio.com/auth/callback` (producción)

### 2. Prueba el login

1. Ve a `http://localhost:3000/auth`
2. Haz click en **Continuar con Google**
3. Deberías ser redirigido a Google para autenticar
4. Después de autenticar, deberías volver a `/chat`

---

## Troubleshooting

### Error: "redirect_uri_mismatch" (Google)

**Causa**: La URL de redirección no coincide con las configuradas en Google Cloud Console.

**Solución**:
1. Verifica que la URL en Google Cloud Console sea exactamente: http://localhost:3000/auth/callback``
2. Asegúrate de incluir el protocolo (`http://` o `https://`)
3. No incluyas "/" al final

### Error: "Email not confirmed"

**Causa**: Supabase requiere confirmación de email por defecto.

**Solución**:
1. Ve a Supabase Dashboard > Authentication > Providers > Email
2. Desactiva **Confirm email** (solo para desarrollo)
3. En producción, deja esto activado para seguridad

### Los botones de OAuth no funcionan

**Verifica**:
1. Que los providers estén habilitados en Supabase
2. Que tengas las credenciales correctas (Client ID y Secret)
3. Que las redirect URLs estén configuradas correctamente
4. Que no haya errores en la consola del navegador

---

## Seguridad

### Producción

1. **HTTPS obligatorio**: Usa siempre HTTPS en producción
2. **Scopes mínimos**: Solo pide los permisos que necesites
3. **Valida tokens**: Supabase lo hace automáticamente
4. **Rotating secrets**: Rota los Client Secrets periódicamente

### Privacidad

Los datos que obtienes de OAuth (dependiendo del provider):
- Email
- Nombre
- Avatar/foto de perfil
- ID único del provider

**No** se obtiene:
- Contraseña
- Tokens de acceso a otros servicios
- Información privada adicional (a menos que lo solicites explícitamente)

---

## Próximos pasos opcionales

Después de configurar Google OAuth:

1. **Personalizar scopes**: Solicita permisos adicionales si necesitas más datos del usuario
2. **Agregar más providers**: GitHub, Apple, Twitter/X, Discord, etc.
3. **Perfiles personalizados**: Crea una tabla de perfiles en la base de datos
4. **Webhooks**: Configura webhooks para eventos de autenticación
5. **Recuperación de contraseña**: Implementa reset de contraseña por email
