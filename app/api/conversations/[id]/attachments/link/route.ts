import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { conversationAttachments } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const { attachmentIds, messageId } = await req.json();

    // Get authenticated user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!attachmentIds || !Array.isArray(attachmentIds) || attachmentIds.length === 0) {
      return NextResponse.json({ error: "Invalid attachment IDs" }, { status: 400 });
    }

    if (!messageId) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    // Update attachments to link them to the message
    await db
      .update(conversationAttachments)
      .set({ messageId })
      .where(inArray(conversationAttachments.id, attachmentIds));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Link attachments error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
