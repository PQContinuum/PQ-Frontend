/**
 * API ROUTE: EXTRACCIÓN DE HECHOS
 * =================================
 *
 * POST /api/conversations/[id]/extract-facts
 *
 * Extrae hechos importantes de una conversación y los guarda en user_context
 * Se ejecuta en background después de cada conversación (según plan del usuario)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getConversationWithMessages } from '@/db/queries/conversations';
import {
  extractFactsFromMessages,
  validateExtractedFacts,
  generateFactKey,
} from '@/lib/memory/fact-extractor';
import { saveMultipleContexts, countUserContext } from '@/db/queries/user-context';
import { getUserPlanName } from '@/lib/subscription';
import { getPlanLimits, canAddMoreContext } from '@/lib/memory/plan-limits';
import { invalidateUserContext, enforceContextLimits } from '@/lib/memory/user-context';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Next.js 15: await params antes de usarlos
    const { id: conversationId } = await params;

    const supabase = await createSupabaseServerClient();

    // 1. Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // 2. Obtener plan del usuario
    const planName = await getUserPlanName(userId);
    const limits = getPlanLimits(planName);

    // 3. Verificar si tiene extracción automática habilitada
    if (!limits.autoExtraction) {
      return NextResponse.json(
        {
          success: false,
          message: 'Auto-extraction not available in your plan',
          planRequired: 'Basic',
        },
        { status: 403 }
      );
    }

    // 4. Obtener conversación con mensajes
    const conversation = await getConversationWithMessages(
      conversationId,
      userId
    );

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // 5. Extraer hechos de los mensajes
    const extractedFacts = await extractFactsFromMessages(conversation.messages);

    // 6. Validar hechos extraídos
    const validFacts = validateExtractedFacts(extractedFacts);

    if (validFacts.length === 0) {
      return NextResponse.json({
        success: true,
        factsExtracted: 0,
        message: 'No important facts found',
      });
    }

    // 7. Verificar límites del plan
    const currentCount = await countUserContext(userId);
    const canAdd = canAddMoreContext(currentCount, planName);

    if (!canAdd) {
      // Si está en el límite, aplicar límites (eliminar viejos)
      await enforceContextLimits(userId, planName);
    }

    // 8. Guardar hechos en la base de datos
    const contextsToSave = validFacts.map(fact => ({
      key: generateFactKey(fact.category, fact.value),
      value: fact.value,
      category: fact.category,
      confidence: fact.confidence,
      sourceConversationId: conversationId,
    }));

    const saved = await saveMultipleContexts(userId, contextsToSave);

    // 9. Invalidar cache del contexto
    invalidateUserContext(userId);

    // 10. Retornar resultados
    return NextResponse.json({
      success: true,
      factsExtracted: saved.length,
      facts: saved.map(f => ({
        category: f.category,
        value: f.value,
      })),
    });
  } catch (error) {
    console.error('Error extracting facts:', error);
    return NextResponse.json(
      { error: 'Failed to extract facts' },
      { status: 500 }
    );
  }
}
