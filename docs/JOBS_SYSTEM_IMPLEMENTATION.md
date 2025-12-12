# Sistema de Jobs Persistentes - Guía de Implementación

## Resumen

Este documento describe cómo implementar el sistema de jobs persistentes para que las generaciones (video, imagen, chat) continúen procesándose en el backend aunque el usuario cierre la app, pierda internet, o cambie de pestaña.

## Arquitectura Actual

```
Usuario solicita generación
    ↓
POST /api/video-gen (o image-gen, chat)
    ↓
1. Validar usuario y límites
2. Crear job en BD (status: pending)
3. Enviar a provider con webhookUrl
4. Retornar { jobId, status: 'queued' }
    ↓
Usuario puede cerrar la app
    ↓
Provider procesa (1-3 min)
    ↓
Webhook POST /api/webhooks/fal-ai (o openai)
    ↓
1. Encontrar job por providerRequestId
2. Descargar resultado
3. Subir a Supabase Storage
4. Actualizar job (status: completed)
    ↓
Usuario regresa a la app
    ↓
Frontend detecta job completado → Muestra resultado
```

## Archivos Existentes

### Base de Datos
- `db/schema.ts` - Tabla `generationJobs`
- `db/queries/generation-jobs.ts` - CRUD queries

### APIs
- `app/api/jobs/route.ts` - GET (listar), POST (crear)
- `app/api/jobs/[jobId]/route.ts` - GET (estado), DELETE (cancelar)
- `app/api/jobs/poll/route.ts` - GET (múltiples jobs)
- `app/api/webhooks/fal-ai/route.ts` - Webhook de Fal.ai

### Frontend
- `hooks/useGenerationJobs.ts` - Hooks de polling
- `hooks/useVideoGeneration.ts` - Hook actualizado para usar jobs
- `app/chat/components/PendingJobsBanner.tsx` - UI de jobs pendientes
- `providers/job-recovery-provider.tsx` - Recovery on visibility

---

## Prompt para Implementar Image Generation con Jobs

```
Necesito modificar el sistema de generación de imágenes para usar el sistema de jobs persistentes que ya existe.

## Contexto
Ya tenemos implementado un sistema de jobs persistentes para video que incluye:
- Tabla `generation_jobs` en la BD
- APIs en `/api/jobs/*`
- Webhook en `/api/webhooks/fal-ai`
- Hooks `useGenerationJobs.ts`
- Provider `JobRecoveryProvider`

## Archivos a modificar

### 1. `/app/api/image-gen/route.ts`
Modificar el POST para:
1. Crear un job en la BD antes de llamar a OpenAI
2. Llamar a OpenAI de forma que si el cliente se desconecta, el backend siga procesando
3. Guardar el resultado en el job cuando termine
4. Retornar el jobId inmediatamente o esperar si la conexión es buena

Patrón a seguir (similar a video-gen):
```typescript
// 1. Crear job primero
const job = await createGenerationJob({
  userId: user.id,
  conversationId: conversationId || null,
  messageId: messageId || null,
  jobType: 'image',
  status: 'pending',
  inputParams: JSON.stringify({ prompt, quality, size, stylePreset }),
  provider: 'openai',
});

// 2. Actualizar a processing
await updateGenerationJob(job.id, user.id, {
  status: 'processing',
  startedAt: new Date(),
});

// 3. Llamar a OpenAI (NO cancelar si cliente se va)
// Para imagen, como es rápido, podemos esperar inline
// pero guardamos el job para recovery si falla

// 4. Cuando termine, actualizar job
await updateGenerationJob(job.id, user.id, {
  status: 'completed',
  publicUrl: savedImageUrl,
  completedAt: new Date(),
});

// 5. Retornar jobId además de la imagen
return NextResponse.json({
  success: true,
  jobId: job.id,
  image: { url, ... }
});
```

### 2. `/hooks/useImageGeneration.ts` (si existe) o crear uno nuevo
- Usar `useGenerationJob` para polling
- Retornar jobId del generate()
- Actualizar estado cuando job complete

### 3. `/app/chat/components/MessageInput.tsx`
En la función de generación de imagen:
- Guardar jobId en metadata del mensaje
- Usar el patrón de video como referencia

## Consideraciones
- OpenAI image generation es más rápido (10-60s) que video
- Podemos hacer híbrido: esperar inline pero tener job para recovery
- Si el usuario cierra durante generación, al volver ve el resultado

## Referencias
Ver implementación de video en:
- `app/api/video-gen/route.ts`
- `hooks/useVideoGeneration.ts`
- `app/chat/components/MessageInput.tsx` (función handleGenerateVideo)
```

---

## Prompt para Implementar Chat con Jobs

```
Necesito modificar el sistema de chat para usar jobs persistentes, de modo que si el usuario cierra la app durante el streaming, el backend continue generando y guarde la respuesta completa.

## Contexto
Ya tenemos implementado un sistema de jobs persistentes para video. El chat es diferente porque usa streaming (SSE).

## Arquitectura propuesta

```
Usuario envía mensaje
    ↓
POST /api/jobs { type: 'chat', params: { prompt, conversationId } }
    ↓
1. Crear job en BD (status: pending)
2. Guardar mensaje del usuario en BD
3. Retornar { jobId, userMessageId }
    ↓
Frontend inicia SSE: GET /api/chat/stream?jobId=xxx
    ↓
Backend:
  - Actualiza job (status: processing)
  - Llama a OpenAI streaming
  - Envía chunks al frontend via SSE
  - Guarda mensaje completo al finalizar
  - Actualiza job (status: completed)
    ↓
SI usuario se desconecta durante streaming:
  - Backend detecta conexión cerrada
  - CONTINÚA generando (no cancela)
  - Guarda respuesta completa en BD
  - Job queda como "completed"
```

## Archivos a crear/modificar

### 1. Crear `/app/api/chat/stream/route.ts`
```typescript
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId');

  // Buscar job
  const job = await getGenerationJobById(jobId, userId);

  // Parsear params
  const params = JSON.parse(job.inputParams);

  // Crear stream
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Flag para saber si cliente se desconectó
  let clientDisconnected = false;
  request.signal.addEventListener('abort', () => {
    clientDisconnected = true;
    // NO cancelamos OpenAI, solo marcamos que cliente se fue
  });

  // Actualizar job a processing
  await updateGenerationJob(jobId, userId, { status: 'processing' });

  // Llamar a OpenAI streaming
  let fullResponse = '';
  const openaiStream = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: params.messages,
    stream: true,
  });

  for await (const chunk of openaiStream) {
    const content = chunk.choices[0]?.delta?.content || '';
    fullResponse += content;

    // Solo enviar si cliente sigue conectado
    if (!clientDisconnected) {
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
    }
  }

  // SIEMPRE guardar respuesta completa (aunque cliente se haya ido)
  await updateGenerationJob(jobId, userId, {
    status: 'completed',
    resultContent: fullResponse,
    completedAt: new Date(),
  });

  // Guardar mensaje en BD
  await createMessage({
    conversationId: params.conversationId,
    role: 'assistant',
    content: fullResponse,
  });

  if (!clientDisconnected) {
    await writer.write(encoder.encode('data: [DONE]\n\n'));
    await writer.close();
  }

  return new Response(stream.readable, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

### 2. Modificar `/app/chat/components/MessageInput.tsx`
En submitMessage:
```typescript
// 1. Crear job primero
const jobResponse = await fetch('/api/jobs', {
  method: 'POST',
  body: JSON.stringify({
    type: 'chat',
    conversationId,
    params: { prompt, geoCultural, messages }
  })
});
const { job } = await jobResponse.json();

// 2. Guardar mensaje de usuario

// 3. Iniciar streaming con jobId
const response = await fetch(`/api/chat/stream?jobId=${job.id}`);
const reader = response.body.getReader();

// 4. Leer stream y actualizar UI
// ... (código existente de streaming)

// 5. Si se pierde conexión, el job sigue en backend
// Al volver, consultar job para ver si completó
```

### 3. Recovery en `/app/chat/components/ConversationHistory.tsx`
Cuando se carga una conversación:
```typescript
// Buscar jobs pendientes/completados de esta conversación
const { data: jobs } = useConversationJobs(conversationId);

// Si hay jobs completados sin mensaje guardado, mostrar resultado
jobs?.forEach(job => {
  if (job.status === 'completed' && job.resultContent) {
    // Verificar si el mensaje ya existe en la conversación
    // Si no, agregarlo
  }
});
```

## Consideraciones
- El chat streaming es diferente a video porque es en tiempo real
- La clave es: backend NO cancela aunque cliente se vaya
- Usar `request.signal` para detectar desconexión, pero no abortar OpenAI
- Siempre guardar resultado completo en job y en messages
```

---

## Prompt para Actualizar MessageBubble

```
Necesito actualizar el componente MessageBubble para que muestre el estado de los jobs de generación y el resultado cuando completen.

## Contexto
Los mensajes ahora pueden tener un `jobId` en su metadata:
```typescript
metadata: {
  generationState: {
    type: 'video' | 'image',
    status: 'generating' | 'completed' | 'error',
    jobId?: string
  }
}
```

## Cambios necesarios en MessageBubble.tsx

### 1. Importar hooks de jobs
```typescript
import { useGenerationJob, getJobStatusMessage } from '@/hooks/useGenerationJobs';
```

### 2. Agregar polling del job si hay jobId
```typescript
// Extraer jobId de metadata si existe
const metadata = message.metadata ? JSON.parse(message.metadata) : null;
const jobId = metadata?.generationState?.jobId;

// Hacer polling del job
const { data: job } = useGenerationJob(jobId);
```

### 3. Renderizar basado en estado del job
```typescript
// Si hay un job en progreso, mostrar skeleton con progreso
if (job && ['pending', 'queued', 'processing', 'uploading'].includes(job.status)) {
  return (
    <div className="...">
      <MediaGeneratingSkeleton type={job.jobType} />
      <p>{getJobStatusMessage(job)}</p>
    </div>
  );
}

// Si el job completó, mostrar el resultado
if (job?.status === 'completed' && job.publicUrl) {
  if (job.jobType === 'video') {
    return <video controls src={job.publicUrl} ... />;
  }
  if (job.jobType === 'image') {
    return <img src={job.publicUrl} ... />;
  }
}

// Si el job falló, mostrar error
if (job?.status === 'failed') {
  return <div className="error">{job.errorMessage}</div>;
}

// Si no hay job (contenido normal), renderizar como antes
```

### 4. Actualizar mensaje cuando job complete
```typescript
useEffect(() => {
  if (job?.status === 'completed' && job.publicUrl) {
    // Actualizar contenido del mensaje con el resultado
    // Esto permite que el mensaje se vea correctamente incluso
    // si el usuario recarga la página
  }
}, [job?.status]);
```

## Consideraciones
- El polling se detiene automáticamente cuando el job termina
- El job tiene toda la info necesaria (URL, tipo, etc)
- El contenido del mensaje se actualiza para persistencia
```

---

## Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # Necesario para webhooks

# Fal.ai
FAL_AI_API_KEY=xxx
FAL_WEBHOOK_URL=https://tu-dominio.com/api/webhooks/fal-ai

# OpenAI
OPENAI_API_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

---

## Migración SQL (ejecutar en Supabase)

```sql
-- Tipos
CREATE TYPE "public"."generation_job_status" AS ENUM('pending', 'queued', 'processing', 'uploading', 'completed', 'failed', 'cancelled');
CREATE TYPE "public"."generation_job_type" AS ENUM('video', 'image', 'chat');

-- Tabla
CREATE TABLE "generation_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "conversation_id" uuid,
  "message_id" uuid,
  "job_type" "generation_job_type" NOT NULL,
  "status" "generation_job_status" DEFAULT 'pending' NOT NULL,
  "input_params" text NOT NULL,
  "provider" varchar(50),
  "provider_request_id" varchar(255),
  "provider_status" varchar(50),
  "result_url" text,
  "result_content" text,
  "storage_path" text,
  "public_url" text,
  "public_url_expires_at" timestamp with time zone,
  "error_message" text,
  "error_code" varchar(50),
  "retry_count" integer DEFAULT 0 NOT NULL,
  "max_retries" integer DEFAULT 3 NOT NULL,
  "progress_percent" integer,
  "progress_message" text,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "generation_time_ms" integer,
  "cost_usd" numeric(10, 6),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Foreign keys
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_conversation_id_fk"
  FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null;
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_message_id_fk"
  FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null;

-- Indexes
CREATE INDEX idx_generation_jobs_user_status ON generation_jobs(user_id, status);
CREATE INDEX idx_generation_jobs_provider_request ON generation_jobs(provider_request_id)
  WHERE provider_request_id IS NOT NULL;
CREATE INDEX idx_generation_jobs_conversation ON generation_jobs(conversation_id)
  WHERE conversation_id IS NOT NULL;
```

---

## Testing

Para probar el sistema:

1. **Video generation básico:**
   - Generar un video
   - Verificar que se crea el job en BD
   - Verificar que el webhook recibe la respuesta

2. **Recovery en video:**
   - Iniciar generación de video
   - Cerrar la pestaña
   - Abrir de nuevo
   - Verificar que el banner muestra el job en progreso
   - Esperar a que complete y verificar resultado

3. **PWA en iOS:**
   - Agregar a pantalla de inicio
   - Iniciar generación
   - Ir a otra app
   - Regresar
   - Verificar que se recupera el estado
