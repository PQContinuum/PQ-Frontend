# Sistema de Historial de Conversaciones con Drizzle ORM

Sistema completo de historial de conversaciones usando Drizzle ORM, Supabase Auth y PostgreSQL.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Chat Page   │  │   Sidebar    │  │  Message     │      │
│  │              │──│   History    │  │   Input      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│           │                 │                 │              │
│           └─────────────────┴─────────────────┘              │
│                          │                                   │
│                  ┌───────▼────────┐                         │
│                  │  Zustand Store │                         │
│                  └───────┬────────┘                         │
└──────────────────────────┼──────────────────────────────────┘
                           │
                  ┌────────▼─────────┐
                  │   API Routes     │
                  │  /api/           │
                  │  conversations   │
                  └────────┬─────────┘
                           │
                  ┌────────▼─────────┐
                  │  Drizzle ORM     │
                  │  db/queries/     │
                  └────────┬─────────┘
                           │
                  ┌────────▼─────────┐
                  │   PostgreSQL     │
                  │    (Supabase)    │
                  └──────────────────┘
```

## Estructura de carpetas

```
├── db/
│   ├── index.ts                    # Configuración de Drizzle
│   ├── schema.ts                   # Esquema de la base de datos
│   ├── migrations/                 # Migraciones SQL
│   └── queries/
│       ├── conversations.ts        # Queries de conversaciones
│       └── messages.ts             # Queries de mensajes
├── app/
│   ├── api/
│   │   └── conversations/
│   │       ├── route.ts            # GET, POST conversaciones
│   │       └── [id]/
│   │           ├── route.ts        # GET, PATCH, DELETE conversación
│   │           └── messages/
│   │               └── route.ts    # POST, PATCH mensajes
│   └── chat/
│       ├── page.tsx                # Página principal del chat
│       ├── store.ts                # Estado global (Zustand)
│       └── components/
│           ├── ChatWindow.tsx      # Ventana de mensajes
│           ├── MessageInput.tsx    # Input de mensajes
│           └── ConversationHistory.tsx  # Historial en sidebar
├── lib/
│   └── supabase.ts                 # Cliente Supabase (Auth)
└── drizzle.config.ts               # Configuración de Drizzle Kit
```

## Instalación y Configuración

### 1. Variables de entorno

Crea un archivo `.env.local` con las siguientes variables:

```bash
# Supabase (para autenticación)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# PostgreSQL (para Drizzle ORM)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# OpenAI (si usas chat)
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4"
```

### 2. Obtener credenciales de Supabase

1. Ve a https://supabase.com/dashboard
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **Settings** > **API**
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Obtener la URL de PostgreSQL

1. En Supabase Dashboard, ve a **Settings** > **Database**
2. En **Connection string** > **URI**, copia la cadena de conexión
3. Reemplaza `[YOUR-PASSWORD]` con la contraseña de tu proyecto
4. Esta es tu `DATABASE_URL`

### 4. Ejecutar migraciones

Genera el schema SQL y aplícalo a la base de datos:

```bash
# Generar migraciones desde el schema
npm run db:generate

# Aplicar migraciones a la base de datos
npm run db:push

# (Opcional) Abrir Drizzle Studio para ver la DB
npm run db:studio
```

Agrega estos scripts a tu `package.json`:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:migrate": "tsx db/migrate.ts"
  }
}
```

### 5. Configurar autenticación

1. Ve a **Authentication** > **Providers** en Supabase Dashboard
2. Habilita **Email** (ya habilitado por defecto)
3. (Opcional) Habilita providers OAuth como Google, GitHub, etc.

### 6. Configurar URLs de redirección

1. Ve a **Authentication** > **URL Configuration**
2. Agrega:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/**`

## Uso

### Crear página de autenticación

Crea `app/auth/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('¡Revisa tu email para confirmar tu cuenta!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/chat');
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <h2 className="text-2xl font-bold text-center">
          {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
        </h2>
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border p-3"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border p-3"
            required
          />
          <button
            type="submit"
            className="w-full rounded bg-[#00552b] p-3 text-white hover:bg-[#00552b]/90"
          >
            {isSignUp ? 'Registrarse' : 'Entrar'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-[#00552b] hover:underline"
        >
          {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  );
}
```

### Proteger rutas con middleware

Crea `middleware.ts` en la raíz:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirigir a /auth si no está autenticado
  if (!user && request.nextUrl.pathname.startsWith('/chat')) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Redirigir a /chat si ya está autenticado
  if (user && request.nextUrl.pathname === '/auth') {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/chat/:path*', '/auth'],
};
```

## API Endpoints

### Conversaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/conversations` | Listar todas las conversaciones del usuario |
| POST | `/api/conversations` | Crear nueva conversación |
| GET | `/api/conversations/:id` | Obtener conversación con mensajes |
| PATCH | `/api/conversations/:id` | Actualizar título de conversación |
| DELETE | `/api/conversations/:id` | Eliminar conversación |

### Mensajes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/conversations/:id/messages` | Crear mensaje |
| PATCH | `/api/conversations/:id/messages` | Actualizar mensaje |

## Esquema de base de datos

### Tabla: `conversations`

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Tabla: `messages`

```sql
CREATE TYPE message_role AS ENUM ('user', 'assistant');

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Características

- ✅ Autenticación con Supabase Auth
- ✅ Historial de conversaciones persistente
- ✅ Navegación entre conversaciones
- ✅ Eliminación de conversaciones
- ✅ Creación automática de conversaciones
- ✅ Timestamps automáticos
- ✅ Tipos TypeScript inferidos desde el schema
- ✅ Queries type-safe con Drizzle ORM
- ✅ Relaciones entre tablas
- ✅ Cascada en eliminación

## Ventajas de Drizzle ORM

1. **Type-safety completo**: Los tipos se infieren directamente del schema
2. **SQL-like syntax**: Queries familiares y fáciles de leer
3. **Migraciones automáticas**: Genera SQL desde el schema TypeScript
4. **Performance**: Sin overhead, queries optimizadas
5. **Developer Experience**: Autocomplete, validación en tiempo de desarrollo
6. **Drizzle Studio**: UI para inspeccionar la base de datos

## Troubleshooting

### Error: "DATABASE_URL is required"

Verifica que `.env.local` tenga la variable `DATABASE_URL` configurada.

### Error: "relation does not exist"

Ejecuta las migraciones:

```bash
npm run db:push
```

### Error: "User not authenticated"

- Verifica que el usuario haya iniciado sesión
- Revisa las cookies en DevTools
- Comprueba la configuración de Supabase Auth

### Las conversaciones no se guardan

- Verifica la conexión a la base de datos
- Revisa los logs en la consola del navegador
- Comprueba que las tablas existan en Supabase Dashboard > Table Editor

## Próximos pasos

- [ ] Implementar búsqueda en conversaciones
- [ ] Agregar paginación para historial largo
- [ ] Exportar conversaciones (PDF, TXT, JSON)
- [ ] Compartir conversaciones con otros usuarios
- [ ] Etiquetar/categorizar conversaciones
- [ ] Estadísticas de uso
- [ ] Modo oscuro
- [ ] Sincronización en tiempo real con Supabase Realtime
