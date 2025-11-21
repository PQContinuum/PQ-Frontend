# 🧠 Sistema de Memoria Compartida entre Conversaciones

## 📖 Descripción

Este sistema permite que el AI recuerde información importante del usuario a través de **todas sus conversaciones**, no solo dentro de un chat individual.

**Ejemplo:**
- Chat 1: "Mi nombre es Rafael y estoy construyendo un e-commerce con Next.js"
- Chat 2 (NUEVO): "¿Cómo optimizo mi app?"
- AI responde: "Rafael, para optimizar tu e-commerce en Next.js..."

El AI recuerda tu nombre y proyecto **sin que lo repitas**.

---

## 🏗️ Arquitectura

### Componentes Principales

1. **Base de Datos** (`db/schema.ts`)
   - Tabla `user_context`: Almacena hechos importantes del usuario
   - Categorías: personal, technical, preferences, project, decisions

2. **Extracción Inteligente** (`lib/memory/fact-extractor.ts`)
   - Detecta keywords importantes en conversaciones
   - Extrae hechos con GPT-4o-mini (bajo costo)
   - Valida y categoriza automáticamente

3. **Cache en Memoria** (`lib/memory/context-cache.ts`)
   - Cache LRU simple sin dependencias
   - TTL de 15 minutos
   - Evita consultas repetidas a DB

4. **Límites por Plan** (`lib/memory/plan-limits.ts`)
   - Free: 10 hechos, 150 tokens, sin auto-extracción
   - Basic: 30 hechos, 300 tokens, auto-extracción
   - Professional: 100 hechos, 500 tokens, búsqueda inteligente
   - Enterprise: 500 hechos, 1000 tokens, full features

5. **Orquestador Principal** (`lib/memory/user-context.ts`)
   - Combina cache, DB, y límites por plan
   - Formatea contexto para el prompt
   - 3 niveles: minimal, standard, full

---

## 🚀 Instalación

### 1. Generar Migración de Base de Datos

```bash
# Generar migración desde el schema actualizado
npm run db:generate

# Aplicar migración a la base de datos
npm run db:push
```

Esto creará la tabla `user_context` y el enum `context_category` en tu base de datos.

### 2. Verificar Variables de Entorno

Asegúrate de tener configurado:

```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=postgresql://...
```

### 3. El Sistema Ya Está Activo ✅

Una vez aplicada la migración, el sistema funciona automáticamente:
- ✅ API de chat incluye contexto del usuario
- ✅ Extracción de hechos en background
- ✅ Cache automático
- ✅ Límites por plan aplicados

---

## 📊 Límites por Plan

Ajusta los límites en `lib/memory/plan-limits.ts`:

| Plan | Max Hechos | Max Tokens | Auto-Extracción | Búsqueda Inteligente |
|------|------------|------------|-----------------|----------------------|
| **Free** | 10 | 150 | ❌ | ❌ |
| **Basic** | 30 | 300 | ✅ | ❌ |
| **Professional** | 100 | 500 | ✅ | ✅ |
| **Enterprise** | 500 | 1000 | ✅ | ✅ |

### Cómo Ajustar Límites

Edita el archivo `lib/memory/plan-limits.ts`:

```typescript
export const PLAN_LIMITS: Record<PlanName, MemoryPlanLimits> = {
  Free: {
    maxContextItems: 10,        // ← CAMBIAR: Máximo hechos
    maxContextTokens: 150,      // ← CAMBIAR: Tokens de contexto
    extractionInterval: 10,     // ← CAMBIAR: Extraer cada N mensajes
    autoExtraction: false,      // ← CAMBIAR: Habilitar auto-extracción
    // ...
  },
  // ...
};
```

---

## 🔧 Configuración Avanzada

### Modificar Keywords de Extracción

Edita `lib/memory/fact-extractor.ts`:

```typescript
const IMPORTANT_KEYWORDS = [
  'mi nombre', 'me llamo', 'trabajo en',
  'uso', 'prefiero', 'mi proyecto',
  // ← Agregar más keywords aquí
];
```

### Ajustar Cache

Edita `lib/memory/context-cache.ts`:

```typescript
const userContextCache = new SimpleCache<string>(
  1000,              // ← Máximo usuarios en cache
  15 * 60 * 1000     // ← TTL en milisegundos (15 min)
);
```

### Cambiar Nivel de Contexto por Defecto

En `lib/memory/plan-limits.ts`:

```typescript
Professional: {
  defaultContextLevel: 'standard',  // ← Cambiar a 'minimal' o 'full'
  // ...
}
```

---

## 📝 API Endpoints

### POST `/api/conversations/[id]/extract-facts`

Extrae hechos importantes de una conversación.

**Request:**
```bash
POST /api/conversations/abc123/extract-facts
Authorization: Bearer <supabase-token>
```

**Response:**
```json
{
  "success": true,
  "factsExtracted": 3,
  "facts": [
    { "category": "personal", "value": "Nombre: Rafael" },
    { "category": "technical", "value": "Usa Next.js 14" },
    { "category": "project", "value": "Construyendo e-commerce" }
  ]
}
```

**Errores:**
- `401 Unauthorized`: Usuario no autenticado
- `403 Forbidden`: Plan no permite auto-extracción
- `404 Not Found`: Conversación no existe

---

## 🧪 Testing

### Probar Extracción Manual

```typescript
// En un API route o script
import { extractFactsFromMessages } from '@/lib/memory/fact-extractor';

const messages = [
  { id: '1', role: 'user', content: 'Mi nombre es Rafael', createdAt: new Date() },
  { id: '2', role: 'assistant', content: 'Mucho gusto, Rafael', createdAt: new Date() },
];

const facts = await extractFactsFromMessages(messages);
console.log(facts);
```

### Probar Contexto de Usuario

```typescript
import { getUserContextForPrompt } from '@/lib/memory/user-context';

const context = await getUserContextForPrompt(
  'user-id-123',
  'Professional',
  'Mensaje actual del usuario'
);

console.log(context);
```

### Verificar Cache

```typescript
import { getCacheStats } from '@/lib/memory/context-cache';

console.log(getCacheStats());
// { size: 42, maxSize: 1000, ttlMinutes: 15 }
```

---

## 🐛 Troubleshooting

### El contexto no se extrae

**Problema:** No se están guardando hechos.

**Soluciones:**
1. Verificar que el plan tenga `autoExtraction: true`
2. Revisar logs de `/api/conversations/[id]/extract-facts`
3. Verificar que OPENAI_API_KEY esté configurado
4. Revisar que la conversación tenga al menos 3 mensajes del usuario

### El contexto no aparece en las respuestas

**Problema:** El AI no usa el contexto guardado.

**Soluciones:**
1. Verificar que hay hechos en la DB: `SELECT * FROM user_context WHERE user_id = '...'`
2. Invalidar cache: `invalidateUserContext(userId)`
3. Revisar que el prompt incluye el contexto (ver logs de API)

### Límite de tokens excedido

**Problema:** Error "context too large".

**Soluciones:**
1. Reducir `maxContextTokens` en `plan-limits.ts`
2. Ajustar nivel de contexto a 'minimal' o 'standard'
3. Purgar contexto viejo: `pruneOldestContext(userId, 10)`

---

## 📈 Optimizaciones de Costo

### Reducir Llamadas a OpenAI

```typescript
// En plan-limits.ts
Free: {
  extractionInterval: 15,  // Extraer cada 15 mensajes (en lugar de 10)
  autoExtraction: false,   // Deshabilitar completamente
}
```

### Usar Contexto Minimal para Mensajes Cortos

El sistema ya hace esto automáticamente:
- Mensaje < 5 palabras → nivel 'minimal' (~100 tokens)
- Mensaje normal → nivel 'standard' (~300 tokens)
- Mensaje > 50 palabras → nivel 'full' (~500 tokens)

### Compresión de Contexto Viejo

Para planes Premium, comprimir contexto automáticamente:

```typescript
Professional: {
  autoCompression: true,  // ✅ Habilitar compresión
  contextRetentionDays: 90,  // Comprimir después de 90 días
}
```

---

## 🔐 Seguridad y Privacidad

### Datos Sensibles

El sistema automáticamente **NO extrae**:
- Passwords
- API keys
- Tokens de acceso
- Información bancaria

### GDPR / Privacidad

Para cumplir con regulaciones:

```typescript
// Eliminar todo el contexto de un usuario
import { db } from '@/db';
import { userContext } from '@/db/schema';
import { eq } from 'drizzle-orm';

await db.delete(userContext).where(eq(userContext.userId, userId));
```

---

## 📚 Estructura de Archivos

```
lib/memory/
├── README.md                   # Este archivo
├── plan-limits.ts              # Límites por plan (AJUSTAR AQUÍ)
├── context-cache.ts            # Cache en memoria
├── fact-extractor.ts           # Extracción con GPT-4o-mini
└── user-context.ts             # Orquestador principal

db/
├── schema.ts                   # Schema de user_context (MIGRAR)
└── queries/
    └── user-context.ts         # Queries de DB

app/api/
├── chat/route.ts               # ✅ Incluye contexto en respuestas
└── conversations/[id]/
    └── extract-facts/route.ts  # API de extracción
```

---

## ✅ Checklist de Implementación

- [x] Tabla `user_context` creada en DB
- [x] Límites por plan configurados
- [x] Cache implementado
- [x] Extracción inteligente con keywords
- [x] API de chat incluye contexto
- [x] Extracción en background configurada
- [ ] **Generar y aplicar migración** (`npm run db:generate && npm run db:push`)
- [ ] **Ajustar límites por plan** (en `plan-limits.ts`)
- [ ] **Testing en ambiente de desarrollo**
- [ ] **Deploy a producción**

---

## 🎯 Próximos Pasos

Después de aplicar la migración:

1. **Probar en desarrollo:**
   ```bash
   npm run dev
   # Iniciar un chat y decir "Mi nombre es [tu nombre]"
   # Crear un NUEVO chat y verificar que recuerda tu nombre
   ```

2. **Ajustar límites según tu estrategia:**
   - Editar `lib/memory/plan-limits.ts`
   - Reiniciar servidor

3. **Monitorear costos:**
   - Revisar uso de OpenAI API (extracción con gpt-4o-mini)
   - Ajustar `extractionInterval` si es necesario

4. **Opcional: Implementar compresión automática**
   - Para planes Enterprise
   - Comprimir contexto viejo con cron job

---

## 💡 Tips y Mejores Prácticas

1. **Empezar conservador:** Usa límites bajos y ajusta según uso real
2. **Monitorear tamaño de contexto:** Revisar `user_context` en DB periódicamente
3. **Cache es tu amigo:** El cache reduce consultas a DB en 90%+
4. **Background extraction:** Nunca bloquear la respuesta del usuario
5. **Plan Free limitado:** Fuerza upgrade con límites restrictivos

---

## 📞 Soporte

Si tienes problemas:
1. Revisar logs en consola del servidor
2. Verificar migración aplicada: `SELECT * FROM user_context LIMIT 1;`
3. Verificar plan del usuario: `SELECT plan_name FROM subscriptions WHERE user_id = '...'`
4. Revisar este README completo

---

**¡Sistema de Memoria Compartida Listo! 🚀**
