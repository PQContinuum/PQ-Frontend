import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import type { Feedback, NewFeedback } from "@/db/schema";

/**
 * Create new feedback
 */
export async function createFeedback(
  data: NewFeedback
): Promise<Feedback> {
  const result = await db
    .insert(feedback)
    .values(data)
    .returning();

  return result[0];
}

/**
 * Get all feedback from a user
 */
export async function getUserFeedback(
  userId: string
): Promise<Feedback[]> {
  return await db
    .select()
    .from(feedback)
    .where(eq(feedback.userId, userId))
    .orderBy(desc(feedback.createdAt));
}

/**
 * Get all feedback (admin)
 */
export async function getAllFeedback(): Promise<Feedback[]> {
  return await db
    .select()
    .from(feedback)
    .orderBy(desc(feedback.createdAt));
}

/**
 * Mark feedback as read
 */
export async function markFeedbackAsRead(
  feedbackId: string
): Promise<Feedback | undefined> {
  const result = await db
    .update(feedback)
    .set({ isRead: true })
    .where(eq(feedback.id, feedbackId))
    .returning();

  return result[0];
}

/**
 * Mark feedback as resolved
 */
export async function markFeedbackAsResolved(
  feedbackId: string
): Promise<Feedback | undefined> {
  const result = await db
    .update(feedback)
    .set({ isResolved: true })
    .where(eq(feedback.id, feedbackId))
    .returning();

  return result[0];
}
