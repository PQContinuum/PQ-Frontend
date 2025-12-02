import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages } from "@/db/schema";
import type { Conversation, NewConversation } from "@/db/schema";

/**
 * Obtener todas las conversaciones de un usuario
 */
export async function getUserConversations(
  userId: string
): Promise<Conversation[]> {
  return await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

/**
 * Obtener una conversación específica por ID
 */
export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<Conversation | undefined> {
  const result = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    )
    .limit(1);

  return result[0];
}

/**
 * Obtener una conversación con sus mensajes
 */
export async function getConversationWithMessages(
  conversationId: string,
  userId: string
) {
  const conversation = await getConversationById(conversationId, userId);

  if (!conversation) {
    return null;
  }

  const conversationMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  return {
    ...conversation,
    messages: conversationMessages,
  };
}

/**
 * Crear una nueva conversación
 */
export async function createConversation(
  data: NewConversation
): Promise<Conversation> {
  const result = await db
    .insert(conversations)
    .values(data)
    .returning();

  return result[0];
}

/**
 * Actualizar una conversación
 */
export async function updateConversation(
  conversationId: string,
  userId: string,
  data: Partial<Pick<Conversation, "title" | "geoCulturalContext">>
): Promise<Conversation | undefined> {
  const result = await db
    .update(conversations)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    )
    .returning();

  return result[0];
}

/**
 * Eliminar una conversación
 */
export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .delete(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    )
    .returning();

  return result.length > 0;
}

/**
 * Generar título automático basado en el contenido
 */
export function generateConversationTitle(content: string): string {
  const maxLength = 50;
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength) + "...";
}
