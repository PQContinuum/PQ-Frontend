import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createFeedback, getUserFeedback } from "@/db/queries/feedback";
import { z } from "zod";

// Force Node.js runtime for database operations
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Validation schema
const feedbackSchema = z.object({
  category: z.enum(["ai", "ui", "bug", "feature", "performance", "other"]),
  sentiment: z.enum([
    "very_negative",
    "negative",
    "neutral",
    "positive",
    "very_positive",
  ]),
  message: z.string().min(1).max(5000),
  pageUrl: z.string().optional(),
  userAgent: z.string().optional(),
  conversationId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// POST /api/feedback - Submit new feedback
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = feedbackSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { category, sentiment, message, pageUrl, userAgent, conversationId, metadata } =
      validationResult.data;

    // Create feedback
    const feedbackRecord = await createFeedback({
      userId: user.id,
      category,
      sentiment,
      message,
      pageUrl: pageUrl || null,
      userAgent: userAgent || null,
      conversationId: conversationId || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    });

    return NextResponse.json({ feedback: feedbackRecord }, { status: 201 });
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}

// GET /api/feedback - Get user's feedback history
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const feedbackList = await getUserFeedback(user.id);

    return NextResponse.json({ feedback: feedbackList });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
