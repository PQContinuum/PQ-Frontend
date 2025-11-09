import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { messages, conversations } from "@/db/schema";
import type { Message, NewMessage } from "@/db/schema";

/**
 * Obtener todos los mensajes de una conversación
 */
export async function getMessagesByConversationId(
  conversationId: string,
  userId: string
): Promise<Message[]> {
  // Verificar que la conversación pertenece al usuario
  const conversation = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, userId)
      )
    )
    .limit(1);

  if (!conversation.length) {
    throw new Error("Conversation not found or unauthorized");
  }

  return await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

/**
 * Crear un nuevo mensaje
 */
export async function createMessage(
  data: NewMessage
): Promise<Message> {
  const result = await db
    .insert(messages)
    .values(data)
    .returning();

  // Actualizar el timestamp de la conversación
  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, data.conversationId));

  return result[0];
}

/**
 * Actualizar un mensaje
 */
export async function updateMessage(
  messageId: string,
  content: string
): Promise<Message | undefined> {
  const result = await db
    .update(messages)
    .set({ content })
    .where(eq(messages.id, messageId))
    .returning();

  if (result[0]) {
    // Actualizar el timestamp de la conversación
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, result[0].conversationId));
  }

  return result[0];
}

/**
 * Eliminar un mensaje
 */
export async function deleteMessage(messageId: string): Promise<boolean> {
  const result = await db
    .delete(messages)
    .where(eq(messages.id, messageId))
    .returning();

  return result.length > 0;
}

/**
 * Crear múltiples mensajes en batch
 */
export async function createMessagesBatch(
  data: NewMessage[]
): Promise<Message[]> {
  if (data.length === 0) return [];

  const result = await db
    .insert(messages)
    .values(data)
    .returning();

  // Actualizar el timestamp de la conversación
  if (data[0]?.conversationId) {
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, data[0].conversationId));
  }

  return result;
}
