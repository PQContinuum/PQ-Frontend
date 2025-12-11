# Implementación de Generación de Imágenes con DALL-E

## Resumen Ejecutivo

Este documento describe la implementación completa de generación de imágenes con DALL-E 3 para la aplicación PQ. Incluye límites por plan, estructura de base de datos, endpoints API, y almacenamiento en Supabase Storage.

---

## 1. Configuración de Planes y Límites

### 1.1 Precios de OpenAI DALL-E 3 (Diciembre 2024)

| Modelo | Calidad | Resolución | Precio/imagen |
|--------|---------|------------|---------------|
| DALL-E 3 | Standard | 1024×1024 | $0.040 |
| DALL-E 3 | Standard | 1024×1792 | $0.080 |
| DALL-E 3 | HD | 1024×1024 | $0.080 |
| DALL-E 3 | HD | 1024×1792 | $0.120 |

### 1.2 Planes PQ y Límites Recomendados

**Objetivo financiero**: Mantener costo de imágenes ≤ 20% del precio del plan.

| Plan | Precio MXN/mes | ~USD/mes | Imágenes/día | Imágenes/mes | Costo Max USD | % del Plan |
|------|----------------|----------|--------------|--------------|---------------|------------|
| Free | $0 | $0 | 2 | 10 | $0.40 | Promocional |
| Basic | $349 | ~$20 | 5 | 75 | $3.00 | 15% |
| Professional | $1,499 | ~$88 | 15 | 300 | $12.00 | 14% |
| Enterprise | $4,199 | ~$246 | 50 | 1000 | $40.00 | 16% |

### 1.3 Características por Plan

| Plan | Modelos | Calidades | Resolución Max | HD |
|------|---------|-----------|----------------|-----|
| Free | dall-e-3 | standard | 1024×1024 | No |
| Basic | dall-e-3 | standard | 1024×1024 | No |
| Professional | dall-e-3 | standard, hd | 1024×1792 | Sí |
| Enterprise | dall-e-3 | standard, hd | 1024×1792 | Sí |

---

## 2. Estructura de Base de Datos

### 2.1 Nueva Tabla: `image_gen_usage`

```sql
-- Ejecutar en Supabase SQL Editor
CREATE TABLE IF NOT EXISTS image_gen_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Información de la imagen generada
  prompt TEXT NOT NULL,
  revised_prompt TEXT, -- El prompt que DALL-E realmente usó
  model VARCHAR(50) NOT NULL DEFAULT 'dall-e-3',
  quality VARCHAR(20) NOT NULL DEFAULT 'standard', -- 'standard' | 'hd'
  size VARCHAR(20) NOT NULL DEFAULT '1024x1024', -- '1024x1024' | '1024x1792' | '1792x1024'
  style VARCHAR(20) DEFAULT 'vivid', -- 'vivid' | 'natural'

  -- Almacenamiento
  storage_path TEXT, -- Path en Supabase Storage: 'images/{user_id}/{image_id}.png'
  original_url TEXT, -- URL temporal de OpenAI (expira en 1 hora)

  -- Costos
  cost_usd DECIMAL(10, 6) NOT NULL, -- Costo exacto de esta imagen

  -- Metadata
  generation_time_ms INTEGER, -- Tiempo que tardó en generar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Índices para queries frecuentes
  CONSTRAINT valid_quality CHECK (quality IN ('standard', 'hd')),
  CONSTRAINT valid_size CHECK (size IN ('1024x1024', '1024x1792', '1792x1024'))
);

-- Índices para performance
CREATE INDEX idx_image_gen_usage_user_id ON image_gen_usage(user_id);
CREATE INDEX idx_image_gen_usage_created_at ON image_gen_usage(created_at);
CREATE INDEX idx_image_gen_usage_user_date ON image_gen_usage(user_id, created_at);

-- RLS (Row Level Security)
ALTER TABLE image_gen_usage ENABLE ROW LEVEL SECURITY;

-- Política: usuarios solo ven sus propias imágenes
CREATE POLICY "Users can view own image usage" ON image_gen_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Política: solo el backend puede insertar (via service role)
CREATE POLICY "Service role can insert" ON image_gen_usage
  FOR INSERT WITH CHECK (true);
```

### 2.2 Actualizar Schema de Drizzle (Frontend)

Agregar en `db/schema.ts`:

```typescript
// ============================================================================
// IMAGE GENERATION USAGE
// ============================================================================

export const imageGenUsage = pgTable("image_gen_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),

  // Información de la imagen
  prompt: text("prompt").notNull(),
  revisedPrompt: text("revised_prompt"),
  model: varchar("model", { length: 50 }).notNull().default("dall-e-3"),
  quality: varchar("quality", { length: 20 }).notNull().default("standard"),
  size: varchar("size", { length: 20 }).notNull().default("1024x1024"),
  style: varchar("style", { length: 20 }).default("vivid"),

  // Almacenamiento
  storagePath: text("storage_path"),
  originalUrl: text("original_url"),

  // Costos
  costUsd: numeric("cost_usd", { precision: 10, scale: 6 }).notNull(),

  // Metadata
  generationTimeMs: integer("generation_time_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type ImageGenUsage = typeof imageGenUsage.$inferSelect;
export type NewImageGenUsage = typeof imageGenUsage.$inferInsert;
```

---

## 3. Configuración de Supabase Storage

### 3.1 Crear Bucket para Imágenes

```sql
-- Ejecutar en Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-images',
  'generated-images',
  true, -- Público para que las imágenes sean accesibles
  5242880, -- 5MB máximo por imagen
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);
```

### 3.2 Políticas de Storage

```sql
-- Cualquiera puede ver imágenes (son públicas)
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'generated-images');

-- Solo usuarios autenticados pueden subir sus propias imágenes
CREATE POLICY "Users can upload own images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generated-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Usuarios pueden eliminar sus propias imágenes
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'generated-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 3.3 Estructura de Carpetas

```
generated-images/
├── {user_id}/
│   ├── {uuid}_1024x1024.png
│   ├── {uuid}_1024x1792.png
│   └── ...
```

---

## 4. Límites en el Código

### 4.1 Agregar a `lib/memory/plan-limits.ts`

```typescript
// ============================================================================
// IMAGE GENERATION LIMITS
// ============================================================================

export type ImageGenPlanLimits = {
  // Máximo de imágenes por día
  maxImagesPerDay: number;
  // Máximo de imágenes por mes
  maxImagesPerMonth: number;
  // Si tiene acceso a generación de imágenes
  imageGenEnabled: boolean;
  // Modelos permitidos
  allowedModels: ('dall-e-2' | 'dall-e-3')[];
  // Calidades permitidas
  allowedQualities: ('standard' | 'hd')[];
  // Resolución máxima permitida
  maxResolution: '1024x1024' | '1024x1792';
  // Estilos permitidos
  allowedStyles: ('vivid' | 'natural')[];
  // Costo estimado máximo USD/mes
  estimatedMaxCostUSD: number;
};

/**
 * LÍMITES DE GENERACIÓN DE IMÁGENES POR PLAN
 * ==========================================
 * Basado en análisis financiero:
 * - Costo DALL-E 3 Standard: $0.04 USD por imagen (1024x1024)
 * - Costo DALL-E 3 HD: $0.08-0.12 USD por imagen
 * - Objetivo: mantener costo imágenes ≤ 20% del precio del plan
 */
export const IMAGE_GEN_LIMITS: Record<PlanName, ImageGenPlanLimits> = {
  Free: {
    maxImagesPerDay: 2,
    maxImagesPerMonth: 10,
    imageGenEnabled: true,
    allowedModels: ['dall-e-3'],
    allowedQualities: ['standard'],
    maxResolution: '1024x1024',
    allowedStyles: ['vivid', 'natural'],
    estimatedMaxCostUSD: 0.40,
  },
  Basic: {
    maxImagesPerDay: 5,
    maxImagesPerMonth: 75,
    imageGenEnabled: true,
    allowedModels: ['dall-e-3'],
    allowedQualities: ['standard'],
    maxResolution: '1024x1024',
    allowedStyles: ['vivid', 'natural'],
    estimatedMaxCostUSD: 3.00,
  },
  Professional: {
    maxImagesPerDay: 15,
    maxImagesPerMonth: 300,
    imageGenEnabled: true,
    allowedModels: ['dall-e-3'],
    allowedQualities: ['standard', 'hd'],
    maxResolution: '1024x1792',
    allowedStyles: ['vivid', 'natural'],
    estimatedMaxCostUSD: 12.00,
  },
  Enterprise: {
    maxImagesPerDay: 50,
    maxImagesPerMonth: 1000,
    imageGenEnabled: true,
    allowedModels: ['dall-e-3'],
    allowedQualities: ['standard', 'hd'],
    maxResolution: '1024x1792',
    allowedStyles: ['vivid', 'natural'],
    estimatedMaxCostUSD: 40.00,
  },
};

/**
 * Obtiene los límites de generación de imágenes del plan
 */
export function getImageGenLimits(planName: PlanName | null | undefined): ImageGenPlanLimits {
  if (!planName || !(planName in IMAGE_GEN_LIMITS)) {
    return IMAGE_GEN_LIMITS.Free;
  }
  return IMAGE_GEN_LIMITS[planName];
}

/**
 * Calcula el costo de una imagen según sus parámetros
 */
export function calculateImageCost(
  quality: 'standard' | 'hd',
  size: '1024x1024' | '1024x1792' | '1792x1024'
): number {
  const COSTS = {
    'standard': {
      '1024x1024': 0.04,
      '1024x1792': 0.08,
      '1792x1024': 0.08,
    },
    'hd': {
      '1024x1024': 0.08,
      '1024x1792': 0.12,
      '1792x1024': 0.12,
    },
  };
  return COSTS[quality][size];
}
```

### 4.2 Crear `lib/image-gen-usage.ts`

```typescript
import { db } from "@/db";
import { imageGenUsage } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getUserPlanName } from "./subscription";
import { getImageGenLimits, calculateImageCost, type PlanName } from "./memory/plan-limits";

/**
 * Image Generation Usage Tracking Library
 * =======================================
 * Tracks and enforces image generation limits per plan.
 */

export interface ImageGenUsageInfo {
  todayCount: number;
  monthCount: number;
  dailyLimit: number;
  monthlyLimit: number;
  canGenerate: boolean;
  remainingToday: number;
  remainingMonth: number;
  planName: PlanName;
  allowedQualities: ('standard' | 'hd')[];
  maxResolution: string;
}

function getStartOfToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Get image generation usage statistics for a user
 */
export async function getImageGenUsage(userId: string): Promise<ImageGenUsageInfo> {
  try {
    const planName = await getUserPlanName(userId);
    const limits = getImageGenLimits(planName);

    const startOfToday = getStartOfToday();
    const startOfMonth = getStartOfMonth();

    // Get today's count
    const todayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(imageGenUsage)
      .where(
        and(
          eq(imageGenUsage.userId, userId),
          gte(imageGenUsage.createdAt, startOfToday)
        )
      );

    // Get this month's count
    const monthResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(imageGenUsage)
      .where(
        and(
          eq(imageGenUsage.userId, userId),
          gte(imageGenUsage.createdAt, startOfMonth)
        )
      );

    const todayCount = Number(todayResult[0]?.count || 0);
    const monthCount = Number(monthResult[0]?.count || 0);

    const remainingToday = Math.max(0, limits.maxImagesPerDay - todayCount);
    const remainingMonth = Math.max(0, limits.maxImagesPerMonth - monthCount);

    return {
      todayCount,
      monthCount,
      dailyLimit: limits.maxImagesPerDay,
      monthlyLimit: limits.maxImagesPerMonth,
      canGenerate: limits.imageGenEnabled && remainingToday > 0 && remainingMonth > 0,
      remainingToday,
      remainingMonth,
      planName,
      allowedQualities: limits.allowedQualities,
      maxResolution: limits.maxResolution,
    };
  } catch (error) {
    console.error("[ImageGen Usage] Error getting usage:", error);
    return {
      todayCount: 0,
      monthCount: 0,
      dailyLimit: 2,
      monthlyLimit: 10,
      canGenerate: true,
      remainingToday: 2,
      remainingMonth: 10,
      planName: "Free",
      allowedQualities: ['standard'],
      maxResolution: '1024x1024',
    };
  }
}

/**
 * Check if user can generate an image
 */
export async function canGenerateImage(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  usage?: ImageGenUsageInfo;
}> {
  const usage = await getImageGenUsage(userId);

  if (!usage.canGenerate) {
    if (usage.remainingToday === 0) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite diario de ${usage.dailyLimit} imágenes. Se reinicia mañana.`,
        usage,
      };
    }
    if (usage.remainingMonth === 0) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite mensual de ${usage.monthlyLimit} imágenes. Considera actualizar tu plan.`,
        usage,
      };
    }
  }

  return { allowed: true, usage };
}

/**
 * Validate image generation parameters against plan limits
 */
export function validateImageParams(
  planName: PlanName,
  quality: string,
  size: string
): { valid: boolean; error?: string } {
  const limits = getImageGenLimits(planName);

  // Validate quality
  if (!limits.allowedQualities.includes(quality as 'standard' | 'hd')) {
    return {
      valid: false,
      error: `Tu plan no permite calidad "${quality}". Calidades disponibles: ${limits.allowedQualities.join(', ')}`,
    };
  }

  // Validate size
  const allowedSizes = limits.maxResolution === '1024x1792'
    ? ['1024x1024', '1024x1792', '1792x1024']
    : ['1024x1024'];

  if (!allowedSizes.includes(size)) {
    return {
      valid: false,
      error: `Tu plan no permite resolución "${size}". Resoluciones disponibles: ${allowedSizes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Record an image generation event
 */
export async function recordImageGenUsage(
  userId: string,
  data: {
    prompt: string;
    revisedPrompt?: string;
    model?: string;
    quality: 'standard' | 'hd';
    size: '1024x1024' | '1024x1792' | '1792x1024';
    style?: 'vivid' | 'natural';
    storagePath?: string;
    originalUrl?: string;
    generationTimeMs?: number;
  }
): Promise<void> {
  try {
    const costUsd = calculateImageCost(data.quality, data.size);

    await db.insert(imageGenUsage).values({
      userId,
      prompt: data.prompt,
      revisedPrompt: data.revisedPrompt,
      model: data.model || 'dall-e-3',
      quality: data.quality,
      size: data.size,
      style: data.style || 'vivid',
      storagePath: data.storagePath,
      originalUrl: data.originalUrl,
      costUsd: costUsd.toString(),
      generationTimeMs: data.generationTimeMs,
    });
  } catch (error) {
    console.error("[ImageGen Usage] Error recording usage:", error);
  }
}
```

---

## 5. API Endpoint (Frontend - Next.js)

### 5.1 Crear `app/api/image-gen/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canGenerateImage, validateImageParams, recordImageGenUsage } from '@/lib/image-gen-usage';
import { getUserPlanName } from '@/lib/subscription';
import { getImageGenLimits } from '@/lib/memory/plan-limits';

export const maxDuration = 60; // 60 segundos timeout para generación

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Autenticación
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Parsear request
    const { prompt, quality = 'standard', size = '1024x1024', style = 'vivid' } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
      return NextResponse.json({ error: 'El prompt es requerido (mínimo 3 caracteres)' }, { status: 400 });
    }

    // 3. Verificar límites de uso
    const { allowed, reason, usage } = await canGenerateImage(user.id);

    if (!allowed) {
      return NextResponse.json({
        error: 'Límite de generación alcanzado',
        message: reason,
        usage: {
          todayCount: usage?.todayCount,
          monthCount: usage?.monthCount,
          dailyLimit: usage?.dailyLimit,
          monthlyLimit: usage?.monthlyLimit,
        }
      }, { status: 429 });
    }

    // 4. Validar parámetros contra el plan
    const planName = await getUserPlanName(user.id);
    const validation = validateImageParams(planName, quality, size);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 5. Verificar API Key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Generación de imágenes no configurada' }, { status: 500 });
    }

    // 6. Llamar a OpenAI DALL-E
    const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt.trim().slice(0, 4000), // DALL-E 3 acepta hasta 4000 chars
        n: 1,
        size,
        quality,
        style,
        response_format: 'url', // 'url' o 'b64_json'
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      console.error('[ImageGen] OpenAI error:', error);

      // Manejar errores específicos de OpenAI
      if (error.error?.code === 'content_policy_violation') {
        return NextResponse.json({
          error: 'El prompt viola las políticas de contenido de OpenAI',
          message: 'Por favor, modifica tu prompt e intenta de nuevo.',
        }, { status: 400 });
      }

      return NextResponse.json(
        { error: 'Error al generar la imagen' },
        { status: openaiResponse.status }
      );
    }

    const result = await openaiResponse.json();
    const imageData = result.data[0];
    const generationTimeMs = Date.now() - startTime;

    // 7. Descargar y guardar en Supabase Storage
    let storagePath: string | undefined;
    let publicUrl: string | undefined;

    try {
      // Descargar imagen de OpenAI (la URL expira en 1 hora)
      const imageResponse = await fetch(imageData.url);
      const imageBuffer = await imageResponse.arrayBuffer();

      // Generar nombre único
      const imageId = crypto.randomUUID();
      storagePath = `${user.id}/${imageId}_${size}.png`;

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('generated-images')
        .upload(storagePath, imageBuffer, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadError) {
        console.error('[ImageGen] Storage upload error:', uploadError);
      } else {
        // Obtener URL pública
        const { data: { publicUrl: url } } = supabase.storage
          .from('generated-images')
          .getPublicUrl(storagePath);
        publicUrl = url;
      }
    } catch (storageError) {
      console.error('[ImageGen] Storage error:', storageError);
      // Continuar sin storage, usar URL temporal de OpenAI
    }

    // 8. Registrar uso (async, no bloquear respuesta)
    recordImageGenUsage(user.id, {
      prompt: prompt.trim(),
      revisedPrompt: imageData.revised_prompt,
      quality,
      size,
      style,
      storagePath,
      originalUrl: imageData.url,
      generationTimeMs,
    }).catch(err => {
      console.error('[ImageGen] Failed to record usage:', err);
    });

    // 9. Respuesta exitosa
    return NextResponse.json({
      success: true,
      image: {
        url: publicUrl || imageData.url, // Preferir URL de Storage
        originalUrl: imageData.url, // URL temporal de OpenAI (backup)
        revisedPrompt: imageData.revised_prompt,
        size,
        quality,
        style,
      },
      usage: {
        remainingToday: (usage?.remainingToday || 1) - 1,
        remainingMonth: (usage?.remainingMonth || 1) - 1,
        dailyLimit: usage?.dailyLimit,
        monthlyLimit: usage?.monthlyLimit,
      },
      generationTimeMs,
    });

  } catch (error) {
    console.error('[ImageGen] Error:', error);
    return NextResponse.json({ error: 'Error al generar imagen' }, { status: 500 });
  }
}

/**
 * GET - Obtener estadísticas de uso
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { usage } = await canGenerateImage(user.id);

    return NextResponse.json({
      usage: {
        todayCount: usage?.todayCount || 0,
        monthCount: usage?.monthCount || 0,
        dailyLimit: usage?.dailyLimit || 2,
        monthlyLimit: usage?.monthlyLimit || 10,
        remainingToday: usage?.remainingToday || 0,
        remainingMonth: usage?.remainingMonth || 0,
        allowedQualities: usage?.allowedQualities || ['standard'],
        maxResolution: usage?.maxResolution || '1024x1024',
      },
    });
  } catch (error) {
    console.error('[ImageGen] Error getting usage:', error);
    return NextResponse.json({ error: 'Error al obtener uso' }, { status: 500 });
  }
}
```

---

## 6. Implementación Backend (Para Claude Opus 4.5)

### 6.1 Prompt para el Agente Backend

```
CONTEXTO:
=========
Necesito implementar generación de imágenes con DALL-E 3 en el backend de PQ.
El frontend ya está preparado con los límites definidos.
Compartimos la misma base de datos Supabase.

BASE DE DATOS COMPARTIDA:
=========================
- Tabla `subscriptions`: contiene el `plan_name` del usuario ('Free', 'Basic', 'Professional', 'Enterprise')
- Tabla `image_gen_usage`: tracking de uso de imágenes (ver schema abajo)
- Bucket `generated-images` en Supabase Storage

TABLA image_gen_usage:
- id: UUID (PK)
- user_id: UUID (FK a auth.users)
- prompt: TEXT
- revised_prompt: TEXT (nullable)
- model: VARCHAR(50) default 'dall-e-3'
- quality: VARCHAR(20) default 'standard'
- size: VARCHAR(20) default '1024x1024'
- style: VARCHAR(20) default 'vivid'
- storage_path: TEXT (nullable)
- original_url: TEXT (nullable)
- cost_usd: DECIMAL(10,6)
- generation_time_ms: INTEGER (nullable)
- created_at: TIMESTAMP WITH TIME ZONE

LÍMITES POR PLAN:
=================
Free:
- maxImagesPerDay: 2
- maxImagesPerMonth: 10
- allowedQualities: ['standard']
- maxResolution: '1024x1024'
- costPerImage: $0.04

Basic:
- maxImagesPerDay: 5
- maxImagesPerMonth: 75
- allowedQualities: ['standard']
- maxResolution: '1024x1024'
- costPerImage: $0.04

Professional:
- maxImagesPerDay: 15
- maxImagesPerMonth: 300
- allowedQualities: ['standard', 'hd']
- maxResolution: '1024x1792'
- costPerImage: $0.04-0.12

Enterprise:
- maxImagesPerDay: 50
- maxImagesPerMonth: 1000
- allowedQualities: ['standard', 'hd']
- maxResolution: '1024x1792'
- costPerImage: $0.04-0.12

COSTOS DALL-E 3:
================
- Standard 1024x1024: $0.04
- Standard 1024x1792: $0.08
- HD 1024x1024: $0.08
- HD 1024x1792: $0.12

TAREAS:
=======
1. Crear endpoint POST /api/v1/images/generate
   - Autenticar usuario
   - Verificar límites (daily/monthly) consultando image_gen_usage
   - Validar parámetros contra el plan del usuario
   - Llamar a OpenAI DALL-E 3 API
   - Guardar imagen en Supabase Storage (bucket: generated-images, path: {user_id}/{uuid}_{size}.png)
   - Registrar uso en image_gen_usage
   - Retornar URL pública de la imagen

2. Crear endpoint GET /api/v1/images/usage
   - Retornar estadísticas de uso del usuario

3. Crear endpoint GET /api/v1/images/history
   - Retornar historial de imágenes generadas con paginación

VARIABLES DE ENTORNO NECESARIAS:
================================
- OPENAI_API_KEY
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (para bypass RLS)

RESPONSE FORMAT:
================
POST /api/v1/images/generate
Request:
{
  "prompt": "A beautiful sunset over mountains",
  "quality": "standard", // 'standard' | 'hd'
  "size": "1024x1024", // '1024x1024' | '1024x1792' | '1792x1024'
  "style": "vivid" // 'vivid' | 'natural'
}

Response (success):
{
  "success": true,
  "image": {
    "url": "https://xxx.supabase.co/storage/v1/object/public/generated-images/...",
    "revisedPrompt": "...",
    "size": "1024x1024",
    "quality": "standard"
  },
  "usage": {
    "remainingToday": 4,
    "remainingMonth": 74,
    "dailyLimit": 5,
    "monthlyLimit": 75
  }
}

Response (limit exceeded):
{
  "error": "Límite de generación alcanzado",
  "message": "Has alcanzado el límite diario de 5 imágenes. Se reinicia mañana.",
  "usage": {...}
}
```

---

## 7. Hook React para Frontend

### 7.1 Crear `hooks/useImageGeneration.ts`

```typescript
'use client';

import { useState, useCallback } from 'react';

interface ImageGenState {
  isGenerating: boolean;
  error: string | null;
  image: {
    url: string;
    revisedPrompt?: string;
  } | null;
}

interface ImageGenUsage {
  todayCount: number;
  monthCount: number;
  dailyLimit: number;
  monthlyLimit: number;
  remainingToday: number;
  remainingMonth: number;
  allowedQualities: ('standard' | 'hd')[];
  maxResolution: string;
}

interface GenerateOptions {
  quality?: 'standard' | 'hd';
  size?: '1024x1024' | '1024x1792' | '1792x1024';
  style?: 'vivid' | 'natural';
}

export function useImageGeneration() {
  const [state, setState] = useState<ImageGenState>({
    isGenerating: false,
    error: null,
    image: null,
  });
  const [usage, setUsage] = useState<ImageGenUsage | null>(null);

  const generate = useCallback(async (prompt: string, options: GenerateOptions = {}) => {
    if (!prompt.trim()) {
      setState(s => ({ ...s, error: 'El prompt es requerido' }));
      return null;
    }

    setState({ isGenerating: true, error: null, image: null });

    try {
      const response = await fetch('/api/image-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          quality: options.quality || 'standard',
          size: options.size || '1024x1024',
          style: options.style || 'vivid',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setState({
          isGenerating: false,
          error: data.message || data.error || 'Error al generar imagen',
          image: null,
        });
        if (data.usage) setUsage(data.usage);
        return null;
      }

      setState({
        isGenerating: false,
        error: null,
        image: {
          url: data.image.url,
          revisedPrompt: data.image.revisedPrompt,
        },
      });

      if (data.usage) {
        setUsage({
          ...usage!,
          remainingToday: data.usage.remainingToday,
          remainingMonth: data.usage.remainingMonth,
        });
      }

      return data.image;
    } catch (error) {
      setState({
        isGenerating: false,
        error: 'Error de conexión',
        image: null,
      });
      return null;
    }
  }, [usage]);

  const fetchUsage = useCallback(async () => {
    try {
      const response = await fetch('/api/image-gen');
      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage);
      }
    } catch (error) {
      console.error('Error fetching image gen usage:', error);
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isGenerating: false, error: null, image: null });
  }, []);

  return {
    ...state,
    usage,
    generate,
    fetchUsage,
    reset,
  };
}
```

---

## 8. Checklist de Implementación

### Frontend (Next.js)
- [ ] Ejecutar SQL para crear tabla `image_gen_usage`
- [ ] Ejecutar SQL para crear bucket `generated-images`
- [ ] Agregar `imageGenUsage` a `db/schema.ts`
- [ ] Agregar límites a `lib/memory/plan-limits.ts`
- [ ] Crear `lib/image-gen-usage.ts`
- [ ] Crear `app/api/image-gen/route.ts`
- [ ] Crear `hooks/useImageGeneration.ts`
- [ ] Ejecutar `npm run db:generate && npm run db:push`

### Backend (Usar prompt de sección 6.1)
- [ ] Crear endpoint POST /api/v1/images/generate
- [ ] Crear endpoint GET /api/v1/images/usage
- [ ] Crear endpoint GET /api/v1/images/history
- [ ] Configurar variables de entorno
- [ ] Testear integración con Supabase Storage

---

## 9. Notas Importantes

1. **URLs de OpenAI expiran en 1 hora**: Por eso guardamos en Supabase Storage.

2. **Content Policy**: DALL-E rechaza prompts con contenido violento, sexual, etc. Manejar error `content_policy_violation`.

3. **Rate Limits de OpenAI**:
   - Tier 1: 5 img/min
   - Tier 2+: Mucho más alto
   - Implementar retry con backoff si es necesario.

4. **Revised Prompt**: DALL-E 3 modifica el prompt automáticamente para mejores resultados. Guardar ambos.

5. **Tamaño de imágenes**: ~1-3MB por imagen PNG. Considerar límites de storage.
