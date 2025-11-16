# 🔥 Configuración del Flujo de Pago y Registro

Este documento describe cómo configurar el flujo completo de registro, pago y redirección implementado en el proyecto.

## 📋 Resumen del Flujo

```
Landing Page (/)
    ↓ [Click "Comenzar ahora"]
    ↓
Usuario autenticado?
    ├─ NO → /auth (Login/Signup)
    │        ↓
    │   Después del auth, ¿tiene subscription activa?
    │        ├─ NO → /payment (Seleccionar plan)
    │        │        ↓
    │        │   Completar pago con Stripe
    │        │        ↓
    │        │   /payment/success
    │        │        ↓ (3 segundos)
    │        │   /chat ✅
    │        │
    │        └─ SÍ → /chat ✅
    │
    └─ SÍ → /chat ✅
```

## 🛠️ Pasos de Configuración

### 1. Aplicar Migraciones de Base de Datos

La migración ya fue generada en `db/migrations/0002_strange_namor.sql`. Necesitas aplicarla a tu base de datos de Supabase.

#### Opción A: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor**
3. Copia y pega el contenido del archivo `db/migrations/0002_strange_namor.sql`
4. Ejecuta la query

#### Opción B: Usando el script de migración

```bash
# Instalar dependencias si no las tienes
npm install tsx --save-dev

# Ejecutar el script de migración
npx tsx scripts/run-migration.ts
```

#### Verificar las tablas creadas

Después de aplicar la migración, deberías tener estas nuevas tablas:

- ✅ `subscriptions` - Guarda las subscripciones de los usuarios
- ✅ `payments` - Registro de pagos para auditoría

### 2. Configurar Webhook de Stripe

Para que Stripe guarde automáticamente las subscripciones en la base de datos, necesitas configurar un webhook.

#### 2.1 En Desarrollo (Local)

1. Instala Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Inicia sesión en Stripe:
   ```bash
   stripe login
   ```

3. Escucha webhooks localmente:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copia el webhook secret que aparece (algo como `whsec_xxx...`) y agrégalo a tu `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxx...
   ```

#### 2.2 En Producción

1. Ve a [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)

2. Click en **"Add endpoint"**

3. Configura el endpoint:
   - **Endpoint URL**: `https://tu-dominio.com/api/webhooks/stripe`
   - **Events to send**: Selecciona estos eventos:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

4. Copia el **Signing secret** (empieza con `whsec_`)

5. Agrégalo a tus variables de entorno en producción:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxx...
   ```

### 3. Variables de Entorno Necesarias

Asegúrate de tener todas estas variables en tu `.env.local`:

```env
# Supabase
SUPABASE_URL=postgresql://...
SUPABASE_ANON_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_test_... # o sk_live_... en producción
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # o pk_live_... en producción
STRIPE_WEBHOOK_SECRET=whsec_... # ⭐ NUEVO

# OpenAI (si usas)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4.1
OPENAI_ASSISTANT=asst_...
```

## 🧪 Probar el Flujo

### Escenario 1: Nuevo Usuario

1. Abre el navegador en modo incógnito
2. Ve a `http://localhost:3000`
3. Click en **"Comenzar ahora"**
4. Deberías ser redirigido a `/auth`
5. Regístrate con un email
6. Después del registro, deberías ir a `/payment`
7. Selecciona un plan y completa el pago (usa [tarjetas de prueba de Stripe](https://stripe.com/docs/testing))
8. Deberías ver `/payment/success`
9. Después de 3 segundos, serás redirigido a `/chat`

### Escenario 2: Usuario Existente con Subscription

1. Inicia sesión con un usuario que ya pagó
2. Click en **"Comenzar ahora"**
3. Deberías ir directamente a `/chat`

### Escenario 3: Usuario con Plan Free

1. Inicia sesión con un usuario que solo tiene plan Free
2. Click en **"Comenzar ahora"**
3. Deberías ir a `/payment` para actualizar el plan

## 📊 Schema de Base de Datos

### Tabla `subscriptions`

| Campo                  | Tipo                     | Descripción                                    |
|------------------------|--------------------------|------------------------------------------------|
| `id`                   | UUID                     | Primary key                                    |
| `user_id`              | UUID (unique)            | ID del usuario (auth.users)                    |
| `stripe_customer_id`   | VARCHAR(255)             | ID del customer en Stripe                      |
| `stripe_subscription_id` | VARCHAR(255) (unique)  | ID de la subscription en Stripe                |
| `stripe_price_id`      | VARCHAR(255)             | ID del price en Stripe                         |
| `plan_name`            | ENUM                     | Free, Basic, Professional, Enterprise          |
| `status`               | ENUM                     | active, canceled, incomplete, past_due, etc    |
| `current_period_start` | TIMESTAMP                | Inicio del periodo de facturación              |
| `current_period_end`   | TIMESTAMP                | Fin del periodo de facturación                 |
| `cancel_at_period_end` | BOOLEAN                  | Si se cancelará al final del periodo           |
| `created_at`           | TIMESTAMP                | Fecha de creación                              |
| `updated_at`           | TIMESTAMP                | Fecha de última actualización                  |

### Tabla `payments`

| Campo                       | Tipo          | Descripción                                    |
|-----------------------------|---------------|------------------------------------------------|
| `id`                        | UUID          | Primary key                                    |
| `user_id`                   | UUID          | ID del usuario (auth.users)                    |
| `stripe_payment_intent_id`  | VARCHAR(255)  | ID del payment intent en Stripe                |
| `stripe_checkout_session_id`| VARCHAR(255)  | ID de la checkout session en Stripe            |
| `amount`                    | INTEGER       | Monto en centavos (ej: 34900 = $349.00)        |
| `currency`                  | VARCHAR(3)    | Código de moneda (mxn, usd, etc)               |
| `status`                    | ENUM          | succeeded, pending, failed, canceled           |
| `plan_name`                 | ENUM          | Free, Basic, Professional, Enterprise          |
| `metadata`                  | TEXT          | JSON string con información adicional          |
| `created_at`                | TIMESTAMP     | Fecha de creación                              |

## 🔧 Helpers Disponibles

### `lib/subscription.ts`

```typescript
// Obtener la subscription de un usuario
const subscription = await getUserSubscription(userId);

// Verificar si tiene subscription activa de pago
const hasActive = await hasActiveSubscription(userId);

// Verificar si necesita ir a /payment
const needsPay = await needsPayment(userId);

// Crear subscription Free para nuevo usuario
await createFreeSubscription(userId);
```

## 📝 Endpoints API

| Endpoint                         | Método | Descripción                                    |
|----------------------------------|--------|------------------------------------------------|
| `/api/check-subscription`        | GET    | Verifica subscription y devuelve redirect URL  |
| `/api/create-checkout-session`   | POST   | Crea una sesión de Stripe Checkout             |
| `/api/session-status`            | GET    | Verifica el estado de un pago                  |
| `/api/webhooks/stripe`           | POST   | Webhook para eventos de Stripe                 |

## 🎯 Próximos Pasos Sugeridos

1. **Implementar límites de uso por plan**
   - Free: 20 mensajes/día
   - Basic: 100 mensajes/día
   - Professional: ilimitados

2. **Dashboard de usuario**
   - Ver plan actual
   - Uso de mensajes
   - Historial de pagos
   - Cambiar/cancelar plan

3. **Portal de Billing de Stripe**
   - Permitir a usuarios gestionar su subscription
   - Ver facturas
   - Actualizar método de pago

4. **Notificaciones por Email**
   - Confirmación de pago
   - Recordatorio antes de renovación
   - Alerta de pago fallido

## 🐛 Troubleshooting

### El webhook no se ejecuta

- Verifica que `STRIPE_WEBHOOK_SECRET` esté configurado
- Revisa los logs del webhook en Stripe Dashboard
- Asegúrate que la URL del webhook sea accesible públicamente (en producción)

### La migración falla

- Verifica que la conexión a la base de datos sea correcta
- Asegúrate que no haya tablas duplicadas
- Revisa los logs de Supabase para errores específicos

### Usuario no redirige correctamente

- Verifica que las cookies de Supabase se estén guardando correctamente
- Revisa la consola del navegador para errores
- Asegúrate que el middleware de Next.js esté configurado

## 📚 Referencias

- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Drizzle ORM](https://orm.drizzle.team/)

---

¡Listo! El flujo de pago está completamente implementado. 🎉
