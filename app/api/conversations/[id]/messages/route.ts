import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMessage, updateMessage } from "@/db/queries/messages";
import { getConversationById, updateConversation } from "@/db/queries/conversations";

// Force Node.js runtime for database operations
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/conversations/[id]/messages - Crear un mensaje
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id: conversationId } = await params;

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar que la conversación pertenece al usuario
    const conversation = await getConversationById(conversationId, user.id);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { id, role, content, metadata } = body;

    if (!role || content === undefined) {
      return NextResponse.json(
        { error: "Message role and content are required" },
        { status: 400 }
      );
    }

    // Serializar metadata a JSON string si viene como objeto
    const metadataStr = metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null;

    const message = await createMessage({
      id,
      conversationId,
      role,
      content,
      metadata: metadataStr,
    });

    // ✅ FIX: Actualizar timestamp de la conversación para ordenamiento correcto
    await updateConversation(conversationId, user.id, {
      title: conversation.title, // Mantener el título actual
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/[id]/messages - Actualizar un mensaje
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, content, metadata } = body;

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    // Permitir actualizar solo content, solo metadata, o ambos
    if (content === undefined && metadata === undefined) {
      return NextResponse.json(
        { error: "Either content or metadata is required" },
        { status: 400 }
      );
    }

    const metadataStr = metadata !== undefined
      ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata))
      : undefined;

    const message = await updateMessage(messageId, content, metadataStr);

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 }
    );
  }
}
