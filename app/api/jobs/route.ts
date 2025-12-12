import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createGenerationJob,
  getUserGenerationJobs,
  type JobStatus,
  type JobType,
} from "@/db/queries/generation-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/jobs - Obtener jobs del usuario
export async function GET(request: NextRequest) {
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

    // Parsear query params
    const searchParams = request.nextUrl.searchParams;
    const statusesParam = searchParams.get("status"); // comma-separated
    const typesParam = searchParams.get("type"); // comma-separated
    const conversationId = searchParams.get("conversationId");
    const limit = searchParams.get("limit");

    // Parsear filtros
    const statuses = statusesParam
      ? (statusesParam.split(",") as JobStatus[])
      : undefined;
    const types = typesParam ? (typesParam.split(",") as JobType[]) : undefined;

    const jobs = await getUserGenerationJobs(user.id, {
      statuses,
      types,
      conversationId: conversationId || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("[Jobs API] Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Crear nuevo job
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
    const { type, conversationId, messageId, params } = body;

    // Validar tipo
    if (!type || !["video", "image", "chat"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid job type. Must be 'video', 'image', or 'chat'" },
        { status: 400 }
      );
    }

    // Validar params
    if (!params || typeof params !== "object") {
      return NextResponse.json(
        { error: "params is required and must be an object" },
        { status: 400 }
      );
    }

    // Crear el job
    const job = await createGenerationJob({
      userId: user.id,
      conversationId: conversationId || null,
      messageId: messageId || null,
      jobType: type,
      status: "pending",
      inputParams: JSON.stringify(params),
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("[Jobs API] Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
