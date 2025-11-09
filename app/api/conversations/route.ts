import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getUserConversations,
  createConversation,
  generateConversationTitle,
} from "@/db/queries/conversations";
import { createMessage } from "@/db/queries/messages";

// GET /api/conversations - Obtener todas las conversaciones del usuario
export async function GET() {
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

    const conversations = await getUserConversations(user.id);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Crear nueva conversación
export async function POST(request: NextRequest) {
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
    const { title, firstMessage } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Crear conversación
    const conversation = await createConversation({
      userId: user.id,
      title: title || generateConversationTitle(firstMessage?.content || "Nueva conversación"),
    });

    // Si hay un primer mensaje, crearlo
    if (firstMessage) {
      await createMessage({
        conversationId: conversation.id,
        role: firstMessage.role,
        content: firstMessage.content,
      });
    }

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
