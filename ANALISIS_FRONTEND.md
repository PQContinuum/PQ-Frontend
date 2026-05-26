# Análisis Frontend — ContinuumAI
> Generado: 2026-05-25

---

## 1. Estructura de Carpetas (3 niveles)

```
.
├── app/
│   ├── (site)/                  # Landing pages públicas (ES + EN)
│   │   ├── comparativa/
│   │   ├── corporativo/
│   │   ├── en/                  # Versiones en inglés
│   │   ├── legal/               # Términos y privacidad
│   │   ├── plataforma/
│   │   ├── precios/
│   │   └── quienes-somos/
│   ├── api/
│   │   └── health/route.ts      # Health check (único route handler Next.js)
│   ├── auth/                    # Login + OAuth callback
│   ├── billing/                 # Página de facturación
│   ├── characters/              # Gestión de personajes (Lisa)
│   ├── chat/                    # Aplicación principal de chat
│   │   ├── components/
│   │   │   ├── lisa/            # Wizard de generación de contenido "Lisa"
│   │   │   └── (30+ componentes de chat)
│   │   ├── page.tsx
│   │   └── store.ts             # Estado Zustand del chat
│   ├── dashboard/
│   ├── gallery/                 # Galería de imágenes/videos generados
│   ├── payment/                 # Planes y precios
│   └── s/[payload]/             # Rutas compartidas
├── components/
│   ├── ui/                      # shadcn/ui (Radix-based)
│   ├── media/                   # HlsVideo, DownloadDialog, ShareDialog
│   └── site/                    # Componentes del landing
├── hooks/                       # Custom React hooks
├── lib/
│   ├── api-client.ts            # Cliente HTTP hacia el backend NestJS
│   ├── openai.ts                # Cliente OpenAI directo (SDK)
│   ├── model-names.ts           # Mapeo gpt-* → nombres "Continuum"
│   ├── pq-instructions.ts       # System prompt de la IA
│   ├── image-gen/               # Presets de estilos visuales
│   ├── lisa/                    # Lógica del wizard Lisa
│   ├── geolocation/             # Servicios de geolocalización precisa
│   ├── memory/                  # Límites de planes
│   └── store/                   # Stores de galería
├── providers/                   # QueryClient + JobRecovery providers
├── store/                       # Stores globales Zustand (TTS, UI, WebSearch)
├── types/                       # Tipos TypeScript globales
├── utils/
└── middleware.ts                # Auth middleware (Supabase SSR)
```

---

## 2. Framework y Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | **Next.js** (App Router) | 15.5.7 |
| UI | **React** | 19.2.1 |
| Lenguaje | **TypeScript** | ^5 |
| Estilos | **Tailwind CSS** | ^4 |
| Componentes | **Radix UI** + shadcn/ui | varias |
| Estado global | **Zustand** | ^5.0.0 |
| Data fetching | **TanStack Query** | ^5.66.9 |
| Auth / DB | **Supabase** (SSR) | ^2.48.1 |
| Pagos | **Stripe** | ^17.5.0 |
| Animaciones | **Framer Motion** | ^12.23.24 |
| AI SDK | **Vercel AI SDK** (`ai`, `@ai-sdk/react`) | ^5.0.104 / ^3.0.136 |
| Mapas | Google Maps + Mapbox | — |
| Media | HLS.js + Cloudflare Streams | — |
| Deployment | **Vercel** (Analytics + Speed Insights) | — |
| Package manager | **Bun** | ^1.3.2 |
| React Compiler | babel-plugin-react-compiler | habilitado |

---

## 3. Referencias a OpenAI — Archivos y líneas exactas

### Archivos que contienen referencias OpenAI:
```
app/chat/components/ChatGPTImportDialog.tsx
app/payment/page.tsx
lib/openai.ts
lib/model-names.ts
```

### `lib/openai.ts` — Cliente OpenAI directo
```typescript
1:  import OpenAI from "openai";
2:  import type { ChatCompletionMessageParam, ChatCompletionContentPart } from "openai/resources/chat/completions";
5:  const apiKey = process.env.OPENAI_API_KEY;
6:  const model = process.env.OPENAI_MODEL ?? "gpt-5.2"; // fallback hardcodeado
9:      throw new Error("OPENAI_API_KEY is required");
12: const client = new OpenAI({ apiKey });
```
Este archivo implementa `streamAssistantReply()` y `getAssistantReply()` — llama **directamente** a la API de OpenAI desde el servidor Next.js (no pasa por el backend NestJS).

### `lib/model-names.ts` — Capa de obfuscación de marca
```typescript
// Mapeo MODEL_ID → "Continuum *"
'gpt-5.2'          → 'Continuum Ultra'
'gpt-5-mini'       → 'Continuum Lite'
'gpt-4.1'          → 'Continuum Core'
'gpt-4.1-mini'     → 'Continuum Lite'
'gpt-4.1-nano'     → 'Continuum Nano'
'gpt-4o'           → 'Continuum Core'
'gpt-4o-mini'      → 'Continuum Lite'
'gpt-image-1'      → 'Continuum Canvas'
'gpt-4o-transcribe'→ 'Continuum Listen'
'tts-1'            → 'Continuum Voice'
'tts-1-hd'         → 'Continuum Voice HD'
'o3'               → 'Continuum Reason'
'o3-mini'          → 'Continuum Reason Lite'
'o4-mini'          → 'Continuum Reason Lite'
```
También hay regex para reemplazar en texto libre (ej. "OpenAI" → "Continuum").

### `app/payment/page.tsx` — Modelos hardcodeados en planes
```typescript
78:  model: { model: 'gpt-5-mini', label: 'Continuum Core', maxTokens: 16000 }   // Plan base
102: model: { model: 'gpt-5.2',   label: 'Continuum Pro',  maxTokens: 20000 }   // Pro
125: model: { model: 'gpt-5.2',   label: 'Continuum Pro',  maxTokens: 20000 }   // Pro+
148: model: { model: 'gpt-5.2',   label: 'Continuum Pro',  maxTokens: 20000 }   // Enterprise
```

### `app/chat/components/ChatGPTImportDialog.tsx`
```typescript
418: href="https://help.openai.com/en/articles/7260999-how-do-i-export-my-chatgpt-history-and-data"
// (enlace a documentación de OpenAI para el import de historial)
```

---

## 4. Nombres de Modelos Hardcodeados

### Por archivo:

**`lib/model-names.ts`** — mapa completo (ver sección 3 arriba)

**`lib/openai.ts`**
```typescript
const model = process.env.OPENAI_MODEL ?? "gpt-5.2";
```

**`app/payment/page.tsx`**
- `gpt-5-mini` (plan base)
- `gpt-5.2` (planes Pro, Pro+, Enterprise)

**`hooks/use-lisa-wizard.ts`** — referencias a fal.ai (video/imagen)

**`lib/image-gen/style-presets.ts`** — presets para generación de imagen

**`lib/lisa/constants.ts`** / **`lib/lisa/schemas.ts`** — constantes del wizard Lisa

### Modelos detectados en todo el proyecto:
| Modelo OpenAI | Alias Continuum | Uso |
|--------------|-----------------|-----|
| `gpt-5.2` | Continuum Ultra | Chat flagship |
| `gpt-5-mini` | Continuum Lite | Chat base |
| `gpt-4.1` | Continuum Core | Chat (configurado en .env actual) |
| `gpt-4.1-mini` | Continuum Lite | — |
| `gpt-4.1-nano` | Continuum Nano | — |
| `gpt-4o` | Continuum Core | — |
| `gpt-4o-mini` | Continuum Lite | — |
| `gpt-image-1` | Continuum Canvas | Generación de imágenes |
| `gpt-4o-transcribe` | Continuum Listen | Transcripción de voz |
| `tts-1` / `tts-1-hd` | Continuum Voice | Text-to-speech |
| `o3` / `o3-mini` / `o4-mini` | Continuum Reason | Razonamiento |

---

## 5. Referencias a Endpoints del Backend

**Base URL**: `https://api.continuumai.llc/api/v1` (prod) / `http://localhost:8080/api/v1` (dev)

### Endpoints encontrados en `lib/api-client.ts`:

#### Chat
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/chat` | POST (stream) | Chat con streaming SSE |
| `/chat/sync` | POST | Chat sin streaming |
| `/chat/enhance-prompt` | POST | Mejora de prompts con contexto |

#### Generación de Imagen (`/image-gen`)
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/image-gen` | POST | Generar imagen |
| `/image-gen` | GET | Obtener usage |
| `/image-gen/upload-reference` | POST | Subir imagen de referencia |

#### Generación de Video (`/video-gen`)
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/video-gen` | POST | Generar video |
| `/video-gen` | GET | Obtener usage |
| `/video-gen/upload-image` | POST | Subir imagen para video |
| `/cloudflare/videos/{uid}/download` | GET | Descarga vía Cloudflare |

#### TTS y Transcripción
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/tts` | POST (stream) | Text-to-speech |
| `/transcribe` | POST | Transcripción de audio |

#### Galería
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/gallery/videos` | GET | Galería pública de videos |
| `/gallery/video/{id}` | GET | Video específico |
| `/gallery/me/videos` | GET/POST | Galería personal |
| `/gallery/video/{id}/like` | POST | Like |
| `/gallery/video/{id}/share` | POST | Compartir |
| `/gallery/video/{id}/visibility` | PATCH | Visibilidad |
| `/gallery/video/{id}` | DELETE | Eliminar |

#### Conversaciones
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/conversations/import/chatgpt` | POST | Importar historial de ChatGPT |

---

## 6. Variables de Entorno (`.env`)

> ⚠️ **IMPORTANTE**: El `.env` contiene credenciales de producción en texto plano y está commiteado al repositorio local. Se muestran las variables con valores redactados.

```bash
# Auth interno
AUTH_SECRET=<redacted>

# Backend NestJS
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
# (producción comentada): https://api.continuumai.llc/api/v1

# Supabase (PostgreSQL + Auth)
SUPABASE_URL=postgresql://postgres.<project>.pooler.supabase.com:6543/postgres
SUPABASE_ANON_KEY=<jwt_token>
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<jwt_token>
SUPABASE_SERVICE_ROLE_KEY=<redacted>

# OpenAI
OPENAI_API_KEY=sk-proj-<CLAVE_REAL_DE_PRODUCCION>   ⚠️
OPENAI_MODEL=gpt-4.1
OPENAI_ASSISTANT=asst_<assistant_id>

# Stripe
STRIPE_SECRET_KEY=sk_live_<CLAVE_REAL_DE_PRODUCCION>  ⚠️
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_<redacted>
STRIPE_WEBHOOK_SECRET=whsec_<redacted>

# fal.ai (generación de imagen/video)
FAL_AI_API_KEY=<api_key>:<secret>
FAL_WEBHOOK_URL=https://<ngrok_url>.ngrok-free.dev

# Mapas
NEXT_PUBLIC_MAPBOX_TOKEN=pk.<redacted>
GOOGLE_MAPS_API_KEY=<redacted>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<redacted>
```

---

## 7. SDKs de IA en `package.json`

```json
"openai": "^4.83.0"           // SDK oficial OpenAI (usado en lib/openai.ts)
"@ai-sdk/openai": "^2.0.74"  // Vercel AI SDK - proveedor OpenAI
"@ai-sdk/react": "^3.0.136"  // Vercel AI SDK - hooks React (useChat, etc.)
"ai": "^5.0.104"              // Vercel AI SDK - core
"@fal-ai/client": "^1.7.2"   // fal.ai - generación imagen/video
```

---

## 8. Arquitectura: Dos Caminos hacia la IA

El frontend tiene **dos rutas distintas** para comunicarse con la IA:

```
                    ┌─────────────────────────────────────┐
                    │         Frontend Next.js             │
                    └──────────────┬──────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │                                          │
              ▼                                          ▼
  ┌─────────────────────┐                  ┌────────────────────────┐
  │  lib/openai.ts      │                  │  lib/api-client.ts     │
  │  (Next.js Server)   │                  │  (→ Backend NestJS)    │
  └─────────┬───────────┘                  └───────────┬────────────┘
            │                                          │
            ▼                                          ▼
   OpenAI API directa                    api.continuumai.llc/api/v1
   (chat completions)                    /chat, /image-gen, /video-gen
                                         /tts, /transcribe, etc.
```

**Ruta 1** (`lib/openai.ts`): El frontend Next.js llama **directamente** a la API de OpenAI. Usa la OPENAI_API_KEY desde variables de entorno del servidor. Actualmente usado por el wizard Lisa (`lib/pq-instructions.ts` como system prompt).

**Ruta 2** (`lib/api-client.ts`): Las peticiones van al **backend NestJS** en `api.continuumai.llc`. El backend (no el frontend) se encarga de la integración con OpenAI y fal.ai para el chat principal, imagen y video.

---

## 9. Capa de White-Label ("Continuum")

El sistema tiene una capa activa de renombramiento de marcas:

- **`lib/model-names.ts`**: Todas las referencias a modelos GPT/OpenAI se muestran con nombres de marca Continuum en la UI
- **`mapModelName()`**: Función que reemplaza texto en respuestas de la IA antes de mostrarlo al usuario
- **`getModelDisplayName()`**: Para labels en selectores y configuración

Esto oculta al proveedor OpenAI del usuario final.
