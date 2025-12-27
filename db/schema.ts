import { pgTable, uuid, text, timestamp, pgEnum, varchar, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enum para el rol de los mensajes
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);

// Enum para el nombre del plan
export const planNameEnum = pgEnum("plan_name", ["Free", "Basic", "Professional", "Enterprise"]);

// Enum para el estado de la subscripción
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "past_due",
  "trialing",
  "unpaid"
]);

// Enum para el estado del pago
export const paymentStatusEnum = pgEnum("payment_status", [
  "succeeded",
  "pending",
  "failed",
  "canceled"
]);

// Enum para la categoría del contexto del usuario
export const contextCategoryEnum = pgEnum("context_category", [
  "personal",      // Nombre, empresa, rol, ubicación
  "technical",     // Stack técnico, herramientas, lenguajes
  "preferences",   // Preferencias de interacción, estilo de respuesta
  "project",       // Proyectos actuales, objetivos
  "decisions",     // Decisiones técnicas, soluciones elegidas
  "summary"        // Resúmenes de contexto antiguo comprimido
]);

// Enum para el tipo de attachment
export const attachmentTypeEnum = pgEnum("attachment_type", [
  "image",
  "document",
  "code",
  "archive"
]);

// Enum para la categoría de feedback
export const feedbackCategoryEnum = pgEnum("feedback_category", [
  "ai",           // Relacionado con respuestas de AI
  "ui",           // Interface de usuario
  "bug",          // Reportar bugs
  "feature",      // Solicitar funcionalidad
  "performance",  // Problemas de rendimiento
  "other"         // Otros
]);

// Enum para el sentimiento del feedback
export const feedbackSentimentEnum = pgEnum("feedback_sentiment", [
  "very_negative",  // 😡
  "negative",       // 😞
  "neutral",        // 😐
  "positive",       // 🙂
  "very_positive"   // 🤩
]);

// Tabla de conversaciones
// user_id referencia a auth.users de Supabase (sin foreign key porque está en otro schema)
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(), // Referencia a auth.users (sin FK)
  title: text("title").notNull(),
  geoCulturalContext: text("geocultural_context"), // JSON string con ubicación para modo geocultural
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Tabla de mensajes
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  // Metadata JSON: { generationState?: { type: 'image'|'video'|'geocultural', status: 'generating'|'completed'|'error' } }
  metadata: text("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Tabla de subscripciones
// Guarda información de la subscripción de Stripe del usuario
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(), // Un usuario solo puede tener una subscripción activa
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).unique(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  planName: planNameEnum("plan_name").notNull().default("Free"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Tabla de pagos (para auditoría e historial)
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id", { length: 255 }),
  amount: integer("amount").notNull(), // En centavos (ej: 34900 = $349.00)
  currency: varchar("currency", { length: 3 }).notNull().default("mxn"),
  status: paymentStatusEnum("status").notNull(),
  planName: planNameEnum("plan_name"),
  metadata: text("metadata"), // JSON string para información adicional
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Tabla de contexto del usuario (memoria compartida entre conversaciones)
// Almacena hechos importantes extraídos de todas las conversaciones del usuario
export const userContext = pgTable("user_context", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(), // Referencia a auth.users (sin FK)

  // Información del hecho
  key: text("key").notNull(), // Identificador único: "name", "project_type", "tech_stack_nextjs"
  value: text("value").notNull(), // Valor del hecho: "Rafael", "e-commerce", "Next.js 14"
  category: contextCategoryEnum("category").notNull(), // Categoría para organizar

  // Metadata
  sourceConversationId: uuid("source_conversation_id"), // De qué conversación se extrajo
  confidence: integer("confidence").notNull().default(100), // Confianza del hecho (0-100)
  lastMentioned: timestamp("last_mentioned", { withTimezone: true })
    .notNull()
    .defaultNow(), // Última vez que fue relevante

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Tabla de uso de TTS (Text-to-Speech)
// Registra cada uso de TTS para control de límites por plan
export const ttsUsage = pgTable("tts_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(), // Referencia a auth.users

  // Metadata de la solicitud
  characterCount: integer("character_count").notNull(), // Caracteres del texto
  voiceUsed: varchar("voice_used", { length: 50 }).notNull(), // nova, alloy, etc.

  // Timestamp
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Tabla de uso de generación de imágenes (DALL-E)
// Registra cada imagen generada para control de límites por plan
export const imageGenUsage = pgTable("image_gen_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(), // Referencia a auth.users

  // Información de la imagen generada
  prompt: text("prompt").notNull(),
  revisedPrompt: text("revised_prompt"), // El prompt que DALL-E realmente usó
  model: varchar("model", { length: 50 }).notNull().default("dall-e-3"),
  quality: varchar("quality", { length: 20 }).notNull().default("standard"), // 'standard' | 'hd'
  size: varchar("size", { length: 20 }).notNull().default("1024x1024"), // '1024x1024' | '1024x1792' | '1792x1024'
  style: varchar("style", { length: 20 }).default("vivid"), // 'vivid' | 'natural'

  // Almacenamiento
  storagePath: text("storage_path"), // Path en Supabase Storage
  originalUrl: text("original_url"), // URL temporal de OpenAI (expira en 1 hora)

  // Costos
  costUsd: numeric("cost_usd", { precision: 10, scale: 6 }).notNull(), // Costo exacto de esta imagen

  // Metadata
  generationTimeMs: integer("generation_time_ms"), // Tiempo que tardó en generar

  // Timestamp
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Tabla de uso de generación de videos (Kling V2.6 via Fal.ai)
// Registra cada video generado para control de límites por plan
export const videoGenUsage = pgTable("video_gen_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(), // Referencia a auth.users

  // Información del video generado
  prompt: text("prompt").notNull(),
  mode: varchar("mode", { length: 20 }).notNull().default("text-to-video"), // 'text-to-video' | 'image-to-video'
  duration: varchar("duration", { length: 5 }).notNull().default("5"), // '5' | '10' (seconds)
  aspectRatio: varchar("aspect_ratio", { length: 10 }).notNull().default("16:9"), // '16:9' | '9:16' | '1:1'
  audioEnabled: boolean("audio_enabled").notNull().default(true),

  // Imagen fuente (solo para image-to-video)
  sourceImageUrl: text("source_image_url"),

  // Almacenamiento
  storagePath: text("storage_path"), // Path en Supabase Storage
  originalUrl: text("original_url"), // URL original de Fal.ai
  requestId: varchar("request_id", { length: 100 }), // ID de la solicitud de Fal.ai

  // Costos ($0.07/s sin audio, $0.14/s con audio)
  costUsd: numeric("cost_usd", { precision: 10, scale: 6 }).notNull(),

  // Metadata
  generationTimeMs: integer("generation_time_ms"), // Tiempo que tardó en generar

  // Timestamp
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Enum para el tipo de job de generación
export const generationJobTypeEnum = pgEnum("generation_job_type", [
  "video",
  "image",
  "chat"
]);

// Enum para el estado del job de generación
export const generationJobStatusEnum = pgEnum("generation_job_status", [
  "pending",     // Job creado, no iniciado
  "queued",      // Enviado al provider (Fal.ai/OpenAI)
  "processing",  // Provider está generando
  "uploading",   // Descargando resultado y subiendo a storage
  "completed",   // Finalizado exitosamente
  "failed",      // Falló con error
  "cancelled"    // Usuario canceló
]);

// Tabla de jobs de generación (video, imagen, chat)
// Permite que las generaciones continúen aunque el usuario cierre la app
export const generationJobs = pgTable("generation_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(), // Referencia a auth.users
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "set null" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),

  // Tipo y estado del job
  jobType: generationJobTypeEnum("job_type").notNull(),
  status: generationJobStatusEnum("status").notNull().default("pending"),

  // Parámetros de entrada (JSON)
  // Video: { prompt, mode, duration, aspectRatio, imageUrl, generateAudio }
  // Image: { prompt, quality, size, stylePreset }
  // Chat: { prompt, geoCultural, systemPrompt }
  inputParams: text("input_params").notNull(),

  // Tracking del provider
  provider: varchar("provider", { length: 50 }), // 'fal-ai', 'openai'
  providerRequestId: varchar("provider_request_id", { length: 255 }), // ID de la solicitud
  providerStatus: varchar("provider_status", { length: 50 }), // Estado raw del provider

  // Resultado
  resultUrl: text("result_url"), // URL del resultado del provider
  resultContent: text("result_content"), // Para chat: contenido de la respuesta
  storagePath: text("storage_path"), // Path en Supabase Storage
  publicUrl: text("public_url"), // URL pública firmada
  publicUrlExpiresAt: timestamp("public_url_expires_at", { withTimezone: true }),

  // Errores y reintentos
  errorMessage: text("error_message"),
  errorCode: varchar("error_code", { length: 50 }),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),

  // Progreso
  progressPercent: integer("progress_percent"), // 0-100
  progressMessage: text("progress_message"), // "Generando video..."

  // Tiempos
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  generationTimeMs: integer("generation_time_ms"),

  // Costo
  costUsd: numeric("cost_usd", { precision: 10, scale: 6 }),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Tabla de attachments de conversaciones
export const conversationAttachments = pgTable("conversation_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Relations
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  messageId: uuid("message_id"), // Optional: link to specific message
  userId: uuid("user_id").notNull(), // Owner

  // File metadata
  fileName: text("file_name").notNull(),
  fileType: attachmentTypeEnum("file_type").notNull(),
  mimeType: varchar("mime_type", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(), // bytes

  // Storage
  storagePath: text("storage_path").notNull(), // Path in Supabase Storage
  publicUrl: text("public_url"), // Public URL (if public bucket)
  signedUrl: text("signed_url"), // Temporary signed URL
  signedUrlExpiry: timestamp("signed_url_expiry", { withTimezone: true }),

  // Preview & metadata
  thumbnailPath: text("thumbnail_path"), // Thumbnail for images
  metadata: text("metadata"), // JSON: { width, height, pages, etc. }

  // Timestamps
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Tabla de feedback de usuarios
export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(), // Referencia a auth.users

  // Contenido del feedback
  category: feedbackCategoryEnum("category").notNull(),
  sentiment: feedbackSentimentEnum("sentiment").notNull(),
  message: text("message").notNull(),

  // Contexto adicional (opcional)
  pageUrl: text("page_url"), // URL donde se envió el feedback
  userAgent: text("user_agent"), // Browser/device info
  conversationId: uuid("conversation_id"), // Si el feedback es sobre una conversación específica

  // Metadata (JSON para info adicional: screenshot, etc.)
  metadata: text("metadata"),

  // Estado del feedback
  isRead: boolean("is_read").notNull().default(false),
  isResolved: boolean("is_resolved").notNull().default(false),

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Relaciones
export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
  attachments: many(conversationAttachments),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ many }) => ({
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [payments.userId],
    references: [subscriptions.userId],
  }),
}));

export const userContextRelations = relations(userContext, ({ one }) => ({
  sourceConversation: one(conversations, {
    fields: [userContext.sourceConversationId],
    references: [conversations.id],
  }),
}));

export const conversationAttachmentsRelations = relations(conversationAttachments, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationAttachments.conversationId],
    references: [conversations.id],
  }),
  message: one(messages, {
    fields: [conversationAttachments.messageId],
    references: [messages.id],
  }),
}));

export const generationJobsRelations = relations(generationJobs, ({ one }) => ({
  conversation: one(conversations, {
    fields: [generationJobs.conversationId],
    references: [conversations.id],
  }),
  message: one(messages, {
    fields: [generationJobs.messageId],
    references: [messages.id],
  }),
}));

// Tipos TypeScript inferidos del esquema
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type UserContext = typeof userContext.$inferSelect;
export type NewUserContext = typeof userContext.$inferInsert;
export type ConversationAttachment = typeof conversationAttachments.$inferSelect;
export type NewConversationAttachment = typeof conversationAttachments.$inferInsert;
export type ImageGenUsage = typeof imageGenUsage.$inferSelect;
export type NewImageGenUsage = typeof imageGenUsage.$inferInsert;
export type VideoGenUsage = typeof videoGenUsage.$inferSelect;
export type NewVideoGenUsage = typeof videoGenUsage.$inferInsert;
export type GenerationJob = typeof generationJobs.$inferSelect;
export type NewGenerationJob = typeof generationJobs.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
