import { pgTable, uuid, text, timestamp, pgEnum, varchar, integer, boolean } from "drizzle-orm/pg-core";
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

// Tabla de conversaciones
// user_id referencia a auth.users de Supabase (sin foreign key porque está en otro schema)
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(), // Referencia a auth.users (sin FK)
  title: text("title").notNull(),
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

// Relaciones
export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
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
