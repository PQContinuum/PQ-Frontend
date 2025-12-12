import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getGenerationJobById,
  cancelGenerationJob,
} from "@/db/queries/generation-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/jobs/[jobId] - Obtener estado de un job
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
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

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const job = await getGenerationJobById(jobId, user.id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("[Jobs API] Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[jobId] - Cancelar un job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
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

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const job = await cancelGenerationJob(jobId, user.id);

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or cannot be cancelled" },
        { status: 404 }
      );
    }

    return NextResponse.json({ job, message: "Job cancelled successfully" });
  } catch (error) {
    console.error("[Jobs API] Error cancelling job:", error);
    return NextResponse.json(
      { error: "Failed to cancel job" },
      { status: 500 }
    );
  }
}
