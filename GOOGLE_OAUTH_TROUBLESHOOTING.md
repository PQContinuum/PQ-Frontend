# Troubleshooting: redirect_uri_mismatch con Google OAuth

## El problema

El error `redirect_uri_mismatch` ocurre cuando la URL que Google recibe no coincide exactamente con las URLs autorizadas en Google Cloud Console.

## Entendiendo el flujo OAuth

```
Usuario → Tu App → Google → Supabase → Tu App
          (1)      (2)      (3)        (4)
```

1. Usuario hace clic en "Continuar con Google"
2. Se redirige a Google
3. Google redirige a **Supabase** (no a tu app directamente)
4. Supabase redirige a tu app (`/auth/callback`)

**Importante**: La URL que debes configurar en Google Cloud Console es la de **Supabase**, NO la de tu aplicación.

---

## Solución paso a paso

### Paso 1: Obtener la URL de callback de Supabase

1. Ve a **Supabase Dashboard** → https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Providers** (menú lateral)
4. Busca **Google** y expándelo
5. Copia la **Callback URL (for OAuth)**

   Debería verse así:
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```

### Paso 2: Configurar en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **Credentials**
4. Haz clic en tu OAuth 2.0 Client ID
5. En **Authorized redirect URIs**, agrega:
   ```
   https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
   ```
   ⚠️ **IMPORTANTE**: Usa EXACTAMENTE la URL que copiaste de Supabase

6. NO agregues `http://localhost:3000/auth/callback` aquí
7. Haz clic en **Save**

### Paso 3: Configurar en Supabase

1. En Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. Habilita el provider de Google
3. Pega tu **Client ID** de Google
4. Pega tu **Client Secret** de Google
5. Guarda

### Paso 4: Configurar Site URL en Supabase

1. Ve a **Authentication** → **URL Configuration**
2. Configura:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: Agrega estas URLs (una por línea):
     ```
     http://localhost:3000/**
     http://localhost:3000/auth/callback
     ```
3. Guarda

---

## Verificación

### Checklist completo

- [ ] **Google Cloud Console**:
  - [ ] Authorized redirect URIs contiene la URL de Supabase (`https://xxx.supabase.co/auth/v1/callback`)
  - [ ] NO contiene `http://localhost:3000/auth/callback`
  - [ ] No hay espacios ni "/" al final
  - [ ] El protocolo es `https://` (no `http://`)

- [ ] **Supabase Dashboard**:
  - [ ] Google provider está habilitado
  - [ ] Client ID y Client Secret están correctos
  - [ ] Site URL es `http://localhost:3000`
  - [ ] Redirect URLs contiene `http://localhost:3000/**`
  - [ ] Redirect URLs contiene `http://localhost:3000/auth/callback`

- [ ] **Código**:
  - [ ] Variables de entorno están configuradas:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Prueba del flujo

1. Abre la consola del navegador (F12) → Pestaña "Network"
2. Ve a `http://localhost:3000/auth`
3. Haz clic en "Continuar con Google"
4. Observa las redirecciones:
   - Primera redirección: A Google
   - Segunda redirección: A Supabase (`xxx.supabase.co/auth/v1/callback`)
   - Tercera redirección: A tu app (`localhost:3000/auth/callback`)
   - Cuarta redirección: A `/chat`

Si falla en la segunda redirección (Supabase), el problema está en Google Cloud Console.

---

## Errores comunes

### Error 1: "redirect_uri_mismatch"

**Mensaje completo**:
```
Error 400: redirect_uri_mismatch
The redirect URI in the request, https://xxx.supabase.co/auth/v1/callback,
does not match the ones authorized for the OAuth client.
```

**Causa**: La URL en Google Cloud Console no coincide con la de Supabase.

**Solución**:
1. Copia EXACTAMENTE la URL de Supabase
2. Pégala en Google Cloud Console
3. Espera 5-10 minutos (los cambios pueden tardar)
4. Limpia las cookies del navegador
5. Intenta de nuevo

### Error 2: "Invalid redirect_uri"

**Causa**: La URL tiene espacios, caracteres especiales o "/" al final.

**Solución**:
1. Verifica que la URL no tenga espacios
2. Verifica que no termine en "/"
3. Usa `https://` (no `http://`)

### Error 3: "Access denied"

**Causa**: El OAuth Consent Screen no está configurado correctamente.

**Solución**:
1. Ve a Google Cloud Console → OAuth consent screen
2. Verifica que esté configurado como "External"
3. Verifica que tu email esté como usuario de prueba (si está en modo testing)
4. Publica la app si es para producción

---

## Debug avanzado

### Ver la URL exacta que se está usando

Agrega esto temporalmente en `app/auth/page.tsx`:

```typescript
const handleGoogleSignIn = async () => {
  setLoading(true);
  setError(null);

  const supabase = createSupabaseBrowserClient();

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    // Debug: Ver la URL generada
    console.log('OAuth URL:', data?.url);
    console.log('Redirect To:', `${window.location.origin}/auth/callback`);

    if (error) throw error;
  } catch (err: any) {
    setError(err.message || 'Error al autenticar con Google');
    setLoading(false);
  }
};
```

Esto te mostrará en la consola la URL exacta que se está usando.

---

## Configuración de producción

Cuando despliegues a producción (ej: Vercel):

### 1. En Google Cloud Console

Agrega TAMBIÉN (no reemplaces):
```
https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback
```

### 2. En Supabase

- **Site URL**: `https://tu-dominio.com`
- **Redirect URLs**:
  ```
  https://tu-dominio.com/**
  https://tu-dominio.com/auth/callback
  http://localhost:3000/**
  http://localhost:3000/auth/callback
  ```

Esto permite que funcione tanto en desarrollo como en producción.

---

## ¿Sigue sin funcionar?

Si después de seguir todos estos pasos aún tienes problemas:

1. **Espera 10-15 minutos**: Los cambios en Google Cloud Console pueden tardar
2. **Limpia cookies**: Borra las cookies de `localhost:3000` y `accounts.google.com`
3. **Modo incógnito**: Prueba en una ventana de incógnito
4. **Verifica las variables de entorno**: Asegúrate de que `.env.local` tenga las variables correctas
5. **Revisa los logs de Supabase**: Ve a Supabase Dashboard → Logs → Auth logs
6. **Contacta soporte**: Si todo falla, contacta el soporte de Supabase

---

## Recursos útiles

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Discord](https://discord.supabase.com) - Comunidad muy activa
