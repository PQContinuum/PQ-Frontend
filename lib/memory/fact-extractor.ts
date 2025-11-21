/**
 * SISTEMA DE EXTRACCIÓN INTELIGENTE DE HECHOS
 * ============================================
 *
 * Extrae automáticamente información importante de las conversaciones
 * del usuario para mantener memoria compartida entre chats.
 *
 * Características:
 * - Detección de keywords para decidir cuándo extraer
 * - Extracción con GPT-4o-mini (bajo costo)
 * - Categorización automática de hechos
 * - Merge inteligente con contexto existente
 */

import OpenAI from 'openai';
import type { Message } from '@/db/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Keywords que indican información importante del usuario
 * Si se detectan estos patterns, se debe extraer contexto
 */
const IMPORTANT_KEYWORDS = [
  // Información personal
  'mi nombre', 'me llamo', 'soy', 'mi apellido',
  'trabajo en', 'trabajo como', 'mi empresa', 'mi compañía',
  'vivo en', 'estoy en', 'mi ubicación',

  // Contexto técnico/profesional
  'estoy construyendo', 'estoy desarrollando', 'mi proyecto',
  'uso', 'utilizo', 'trabajo con', 'prefiero',
  'mi stack', 'tecnología', 'framework',

  // Decisiones importantes
  'decidí', 'voy a usar', 'elegí', 'opté por',
  'voy a implementar', 'prefiero', 'mejor usar',

  // Preferencias
  'me gusta', 'no me gusta', 'prefiero',
  'quiero', 'necesito', 'busco',

  // Contexto de negocio
  'mi startup', 'mi negocio', 'e-commerce', 'saas',
  'mis usuarios', 'mis clientes',
];

/**
 * Verifica si un mensaje contiene información importante
 */
export function hasImportantInformation(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return IMPORTANT_KEYWORDS.some(keyword => lowerContent.includes(keyword));
}

/**
 * Verifica si se debe extraer hechos de una conversación
 */
export function shouldExtractFacts(messages: Message[]): boolean {
  // Debe tener al menos 3 mensajes del usuario
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length < 3) {
    return false;
  }

  // Verificar si los últimos 3 mensajes tienen información importante
  const recentMessages = userMessages.slice(-3);
  return recentMessages.some(msg => hasImportantInformation(msg.content));
}

/**
 * Tipo de hecho extraído
 */
export type ExtractedFact = {
  key: string;
  value: string;
  category: 'personal' | 'technical' | 'preferences' | 'project' | 'decisions';
  confidence: number;
};

/**
 * System prompt para extracción de hechos
 */
const EXTRACTION_SYSTEM_PROMPT = `
Eres un asistente especializado en extraer información importante de conversaciones.

Tu tarea es analizar la conversación y extraer SOLO hechos persistentes y relevantes sobre el usuario.

CATEGORÍAS:

**personal** - Información personal del usuario
- Nombre, apellido, email
- Empresa, cargo, rol profesional
- Ubicación, zona horaria
- Contexto profesional

**technical** - Stack técnico y herramientas
- Lenguajes de programación que usa
- Frameworks, librerías preferidas
- Herramientas, servicios, plataformas
- Experiencia técnica

**preferences** - Preferencias de interacción
- Estilo de respuesta preferido (conciso, detallado)
- Formatos preferidos (código, teoría, ejemplos)
- Lo que le gusta y lo que NO le gusta

**project** - Proyectos y objetivos actuales
- Qué está construyendo/desarrollando
- Tipo de aplicación (e-commerce, SaaS, etc.)
- Objetivos del proyecto
- Audiencia objetivo

**decisions** - Decisiones técnicas importantes
- Soluciones que decidió implementar
- Tecnologías elegidas (y por qué)
- Enfoques que prefirió
- Cosas que descartó

REGLAS:

1. SOLO extrae información PERSISTENTE (que será útil en futuras conversaciones)
2. NO extraes preguntas puntuales o información temporal
3. NO extraes datos sensibles (passwords, API keys, tokens)
4. Genera un "key" único y descriptivo (ej: "tech_stack_nextjs", "project_type")
5. El "value" debe ser claro y conciso
6. La "confidence" es 0-100 según qué tan seguro estás del hecho

Responde SIEMPRE en formato JSON válido:
{
  "facts": [
    {
      "key": "identificador_unico",
      "value": "descripción del hecho",
      "category": "personal|technical|preferences|project|decisions",
      "confidence": 85
    }
  ]
}

Si NO hay hechos importantes que extraer, responde:
{
  "facts": []
}
`.trim();

/**
 * Extrae hechos importantes de una conversación
 */
export async function extractFactsFromMessages(
  messages: Message[]
): Promise<ExtractedFact[]> {
  try {
    // Formatear mensajes para el prompt
    const conversationText = messages
      .map(msg => {
        const role = msg.role === 'user' ? 'Usuario' : 'Asistente';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');

    // Limitar tamaño de conversación (últimos 20 mensajes)
    const recentMessages = messages.slice(-20);
    const recentText = recentMessages
      .map(msg => {
        const role = msg.role === 'user' ? 'Usuario' : 'Asistente';
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');

    // Llamar a OpenAI con GPT-4o-mini (bajo costo)
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: `CONVERSACIÓN:\n\n${recentText}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Baja temperatura para consistencia
      max_tokens: 800, // Limitar respuesta
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return [];
    }

    const parsed = JSON.parse(content);
    return parsed.facts || [];

  } catch (error) {
    console.error('Error extracting facts:', error);
    return [];
  }
}

/**
 * Genera un key único para un hecho
 */
export function generateFactKey(category: string, value: string): string {
  // Crear un key único basado en categoría y valor
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 30);

  return `${category}_${cleaned}`;
}

/**
 * Determina si un hecho es válido
 */
export function isValidFact(fact: ExtractedFact): boolean {
  return (
    fact.key &&
    fact.value &&
    fact.category &&
    fact.confidence >= 50 && // Mínimo 50% de confianza
    fact.value.length > 3 && // Valor significativo
    fact.value.length < 500 // No demasiado largo
  );
}

/**
 * Filtra y valida hechos extraídos
 */
export function validateExtractedFacts(facts: ExtractedFact[]): ExtractedFact[] {
  return facts.filter(isValidFact);
}
