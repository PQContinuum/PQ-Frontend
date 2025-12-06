import { eq, desc, and } from "drizzle-orm";
import { db } from "@/db";
import { conversations, messages, conversationAttachments } from "@/db/schema";
import type { Conversation, NewConversation, Message, ConversationAttachment } from "@/db/schema";

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
 * Tipo de mensaje con attachments
 */
export type MessageWithAttachments = Message & {
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    mimeType?: string;
  }>;
};

/**
 * Obtener una conversación con sus mensajes y attachments
 */
export async function getConversationWithMessages(
  conversationId: string,
  userId: string
) {
  const conversation = await getConversationById(conversationId, userId);

  if (!conversation) {
    return null;
  }

  // Obtener todos los mensajes de la conversación
  const conversationMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  // Obtener todos los attachments de la conversación que tienen messageId
  const attachments = await db
    .select()
    .from(conversationAttachments)
    .where(eq(conversationAttachments.conversationId, conversationId));

  // Agrupar attachments por messageId
  const attachmentsByMessageId = attachments.reduce((acc, att) => {
    if (att.messageId) {
      if (!acc[att.messageId]) {
        acc[att.messageId] = [];
      }
      acc[att.messageId].push({
        id: att.id,
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
      });
    }
    return acc;
  }, {} as Record<string, Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    mimeType?: string;
  }>>);

  // Combinar mensajes con sus attachments
  const messagesWithAttachments: MessageWithAttachments[] = conversationMessages.map(msg => ({
    ...msg,
    attachments: attachmentsByMessageId[msg.id] || undefined,
  }));

  return {
    ...conversation,
    messages: messagesWithAttachments,
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
