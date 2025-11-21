import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createMessage, updateMessage } from "@/db/queries/messages";
import { getConversationById, updateConversation } from "@/db/queries/conversations";

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
    const { id, role, content } = body;

    if (!role || !content) {
      return NextResponse.json(
        { error: "Message role and content are required" },
        { status: 400 }
      );
    }

    const message = await createMessage({
      id,
      conversationId,
      role,
      content,
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
    const { messageId, content } = body;

    if (!messageId || !content) {
      return NextResponse.json(
        { error: "Message ID and content are required" },
        { status: 400 }
      );
    }

    const message = await updateMessage(messageId, content);

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
