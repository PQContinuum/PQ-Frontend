# ✅ Solución para tu error de Google OAuth

## 🔍 El problema identificado

Google está recibiendo esta URL de callback:
```
https://uattsubstvappfaalfuw.supabase.co/auth/v1/callback
```

Esta URL **NO está registrada** en Google Cloud Console.

---

## ✅ Solución (sigue estos pasos exactos)

### Paso 1: Ve a Google Cloud Console

1. Abre: https://console.cloud.google.com
2. Selecciona tu proyecto
3. En el menú lateral, ve a **APIs & Services** → **Credentials**

### Paso 2: Edita tu OAuth 2.0 Client ID

1. Busca tu **OAuth 2.0 Client ID** en la lista
2. Haz clic en el nombre para editarlo (icono de lápiz)

### Paso 3: Agrega la URL de Supabase

En la sección **"Authorized redirect URIs"**:

1. Haz clic en **"+ ADD URI"**
2. Pega EXACTAMENTE esta URL:
   ```
   https://uattsubstvappfaalfuw.supabase.co/auth/v1/callback
   ```
3. **IMPORTANTE**:
   - NO agregues espacios
   - NO agregues "/" al final
   - Usa `https://` (no `http://`)
   - Copia y pega directamente (no escribas a mano)

4. Haz clic en **"SAVE"** (botón azul abajo)

### Paso 4: Espera y prueba

1. **Espera 5-10 minutos** (los cambios tardan en propagarse)
2. Mientras esperas, limpia las cookies:
   - Abre DevTools (F12)
   - Pestaña "Application"
   - Cookies → `http://localhost:3000`
   - Click derecho → "Clear"
3. También limpia cookies de Google:
   - Cookies → `https://accounts.google.com`
   - Click derecho → "Clear"
4. Cierra y abre el navegador
5. Ve a `http://localhost:3000/auth`
6. Prueba de nuevo "Continuar con Google"

---

## 📸 Cómo debería verse

En **Google Cloud Console** → **Credentials** → Tu OAuth Client ID → **Authorized redirect URIs**:

Deberías tener esta URL:
```
✅ https://uattsubstvappfaalfuw.supabase.co/auth/v1/callback
```

**NO** deberías tener:
```
❌ http://localhost:3000/auth/callback
```

---

## ⚠️ Errores comunes

### Error 1: Copié mal la URL

✅ **Correcto**: `https://uattsubstvappfaalfuw.supabase.co/auth/v1/callback`

❌ **Incorrecto**:
- `https://uattsubstvappfaalfuw.supabase.co/auth/v1/callback/` (tiene "/" al final)
- `http://uattsubstvappfaalfuw.supabase.co/auth/v1/callback` (usa `http` en vez de `https`)
- Con espacios al principio o al final

### Error 2: No esperé lo suficiente

Los cambios en Google Cloud Console pueden tardar hasta 10-15 minutos en propagarse.

**Solución**: Espera y prueba de nuevo después de 10 minutos.

### Error 3: Las cookies antiguas causan problemas

**Solución**:
1. Abre modo incógnito
2. Prueba ahí primero
3. Si funciona, limpia las cookies en tu navegador normal

---

## 🎯 Verificación final

Antes de probar, verifica que tengas:

En **Google Cloud Console**:
- [ ] URL de Supabase en "Authorized redirect URIs"
- [ ] Guardaste los cambios (botón "SAVE")
- [ ] La URL es exactamente: `https://uattsubstvappfaalfuw.supabase.co/auth/v1/callback`

En **Supabase Dashboard** (https://supabase.com/dashboard):
- [ ] Google provider está habilitado (Authentication → Providers → Google)
- [ ] Client ID de Google está correcto
- [ ] Client Secret de Google está correcto

---

## 🚀 Si sigue sin funcionar

1. **Espera 15 minutos más**
2. **Prueba en modo incógnito**
3. **Verifica que no haya espacios** en la URL de Google Cloud Console
4. **Verifica el Client ID y Secret** en Supabase
5. **Revisa los logs de Supabase**:
   - Ve a Supabase Dashboard
   - Logs → Auth Logs
   - Busca errores relacionados con Google

---

## ✨ Después de arreglar

Una vez que funcione, deberías:

1. Ver la pantalla de selección de cuenta de Google
2. Seleccionar tu cuenta
3. Ser redirigido de vuelta a tu app
4. Ver el chat (`/chat`)

---

## 📞 ¿Necesitas ayuda?

Si después de seguir todos estos pasos aún no funciona:

1. Toma un screenshot de la sección "Authorized redirect URIs" en Google Cloud Console
2. Toma un screenshot de la configuración de Google en Supabase Dashboard
3. Comparte los logs de error de la consola del navegador

Esto ayudará a identificar el problema específico.
