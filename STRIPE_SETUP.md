# Configuración de Stripe

Esta guía te ayudará a configurar Stripe para los pagos de suscripciones en tu aplicación.

## 1. Obtener las Keys de Stripe

### Paso 1: Crear una cuenta en Stripe
1. Ve a [https://stripe.com](https://stripe.com) y crea una cuenta
2. Verifica tu email y completa la configuración básica

### Paso 2: Obtener las API Keys
1. Ve al [Dashboard de Stripe](https://dashboard.stripe.com)
2. En el menú izquierdo, haz clic en "Developers" → "API keys"
3. Verás dos tipos de keys:
   - **Publishable key** (comienza con `pk_test_...` o `pk_live_...`)
   - **Secret key** (comienza con `sk_test_...` o `sk_live_...`)

### Paso 3: Agregar las Keys al archivo `.env`
```env
# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_tu_key_secreta_aqui"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_tu_key_publica_aqui"
```

⚠️ **IMPORTANTE**:
- Nunca compartas tu `STRIPE_SECRET_KEY` públicamente
- El prefijo `NEXT_PUBLIC_` hace que la key sea accesible en el navegador, solo úsalo para la Publishable Key
- Usa las keys de TEST durante el desarrollo (`sk_test_...` y `pk_test_...`)

## 2. Crear los Products y Prices en Stripe

### Paso 1: Crear Products
1. En el Dashboard de Stripe, ve a "Products" en el menú izquierdo
2. Haz clic en "+ Add product"
3. Crea los siguientes productos:

#### Plan Básico
- Nombre: `Plan Básico`
- Descripción: `Acceso completo con límite de 100 mensajes/día`
- Pricing:
  - Monthly: $12 USD/mes
  - Yearly: $10 USD/mes (facturado anualmente = $120/año)

#### Plan Profesional
- Nombre: `Plan Profesional`
- Descripción: `Acceso ilimitado con características avanzadas`
- Pricing:
  - Monthly: $29 USD/mes
  - Yearly: $24 USD/mes (facturado anualmente = $288/año)

### Paso 2: Obtener los Price IDs
1. Después de crear cada precio, Stripe te dará un **Price ID** (comienza con `price_...`)
2. Copia estos IDs y actualízalos en `app/payment/page.tsx`:

```typescript
{
  id: 'basic',
  name: 'Básico',
  stripePriceId: {
    monthly: 'price_1234567890_MONTHLY',  // Reemplaza con tu Price ID
    yearly: 'price_1234567890_YEARLY',    // Reemplaza con tu Price ID
  },
  // ...
},
{
  id: 'professional',
  name: 'Profesional',
  stripePriceId: {
    monthly: 'price_9876543210_MONTHLY',  // Reemplaza con tu Price ID
    yearly: 'price_9876543210_YEARLY',    // Reemplaza con tu Price ID
  },
  // ...
}
```

## 3. Mejoras de Seguridad Implementadas

### ✅ Autenticación Obligatoria
- Las rutas `/payment` y `/payment/success` están protegidas con middleware
- Solo usuarios autenticados pueden acceder a estas páginas
- Redirección automática a `/auth` si no está autenticado

### ✅ Validación en el Backend
- Las API routes validan que se envíe un `priceId` válido
- Todas las llamadas a Stripe se realizan desde el servidor (no desde el navegador)
- La `STRIPE_SECRET_KEY` nunca se expone al frontend

### ✅ Checkout Seguro Embebido
- Uso de Stripe Embedded Checkout para máxima seguridad
- Los datos de pago nunca pasan por nuestro servidor
- Stripe maneja PCI compliance automáticamente

### ✅ Verificación de Sesión
- Después del pago, se verifica el estado con Stripe antes de mostrar éxito
- La URL de retorno incluye el `session_id` para validación

## 4. Mejoras de Seguridad Adicionales Recomendadas

### 🔒 Webhooks de Stripe (IMPORTANTE)
Actualmente, el sistema confía en la verificación client-side. Para producción, debes implementar webhooks:

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  // Manejar eventos
  switch (event.type) {
    case 'checkout.session.completed':
      // Actualizar base de datos con la suscripción
      const session = event.data.object as Stripe.Checkout.Session;
      // TODO: Guardar en base de datos que el usuario tiene suscripción activa
      break;

    case 'customer.subscription.updated':
      // Manejar actualizaciones de suscripción
      break;

    case 'customer.subscription.deleted':
      // Manejar cancelaciones
      break;
  }

  return new Response('Webhook processed', { status: 200 });
}
```

**Configurar el webhook en Stripe:**
1. Ve a "Developers" → "Webhooks"
2. Haz clic en "+ Add endpoint"
3. URL del endpoint: `https://tudominio.com/api/webhooks/stripe`
4. Selecciona eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copia el **Webhook Secret** y agrégalo a tu `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

### 🔒 Rate Limiting
Agrega rate limiting a las API routes para prevenir abuso:

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// app/api/create-checkout-session/route.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests por minuto
});

export async function POST(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // ... resto del código
}
```

### 🔒 Guardar Suscripciones en Base de Datos
Crea una tabla en Supabase para guardar las suscripciones:

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
```

### 🔒 Validación de Suscripción Activa
Agrega middleware para verificar que el usuario tenga suscripción activa antes de usar el chat:

```typescript
// lib/check-subscription.ts
import { createSupabaseBrowserClient } from '@/lib/supabase';

export async function checkSubscription() {
  const supabase = createSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { hasAccess: false, plan: null };

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  return {
    hasAccess: subscription ? true : false,
    plan: subscription?.plan_id || 'free',
  };
}
```

### 🔒 HTTPS en Producción
- Asegúrate de usar HTTPS en producción
- Stripe Webhooks requieren HTTPS
- Vercel y otros hosting modernos lo incluyen automáticamente

### 🔒 Logging y Monitoreo
- Implementa logging de todas las transacciones
- Configura alertas para pagos fallidos
- Usa Stripe Dashboard para monitorear actividad sospechosa

## 5. Testing

### Tarjetas de Prueba de Stripe
Usa estas tarjetas para probar en modo test:

- **Éxito**: `4242 4242 4242 4242`
- **Requiere autenticación**: `4000 0025 0000 3155`
- **Pago declinado**: `4000 0000 0000 9995`

Fecha de expiración: Cualquier fecha futura
CVC: Cualquier 3 dígitos
ZIP: Cualquier 5 dígitos

## 6. Pasar a Producción

Cuando estés listo para producción:

1. **Activa tu cuenta de Stripe**
   - Completa la información de negocio en Stripe Dashboard
   - Verifica tu identidad

2. **Cambia a Live Keys**
   ```env
   STRIPE_SECRET_KEY="sk_live_..."
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
   ```

3. **Actualiza los Price IDs**
   - Crea los productos en modo Live
   - Actualiza los Price IDs en el código

4. **Configura Webhooks en Live**
   - Crea nuevos endpoints para el ambiente de producción
   - Usa el nuevo Webhook Secret

5. **Testing Final**
   - Realiza una compra de prueba real (luego puedes reembolsarla)
   - Verifica que los webhooks funcionen correctamente
   - Prueba la cancelación de suscripciones

## 7. Contacto y Soporte

Para el plan Enterprise, actualiza el email de contacto en `app/payment/page.tsx`:

```typescript
window.location.href = 'mailto:sales@tudominio.com?subject=Consulta Plan Enterprise';
```

Reemplaza `sales@tudominio.com` con tu email de ventas real.

---

## Checklist Final

- [ ] Keys de Stripe agregadas al `.env`
- [ ] Products y Prices creados en Stripe
- [ ] Price IDs actualizados en el código
- [ ] Webhooks configurados y funcionando
- [ ] Tabla de subscriptions creada en Supabase
- [ ] Rate limiting implementado
- [ ] Testing con tarjetas de prueba completado
- [ ] Email de contacto actualizado
- [ ] Documentación de negocio completada en Stripe
- [ ] Keys de producción configuradas
- [ ] Monitoreo y alertas configuradas

¡Ya estás listo para aceptar pagos de forma segura! 🎉
