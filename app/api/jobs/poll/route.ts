import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getGenerationJobsByIds } from "@/db/queries/generation-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/jobs/poll?ids=id1,id2,id3 - Obtener estado de múltiples jobs
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

    // Parsear IDs de query params
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { error: "ids parameter is required" },
        { status: 400 }
      );
    }

    const jobIds = idsParam.split(",").filter((id) => id.trim());

    if (jobIds.length === 0) {
      return NextResponse.json({ jobs: [] });
    }

    // Limitar a 20 jobs por request para evitar abusos
    if (jobIds.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 job IDs allowed per request" },
        { status: 400 }
      );
    }

    const jobs = await getGenerationJobsByIds(jobIds, user.id);

    // Mapear a un objeto para acceso rápido por ID
    const jobsMap = jobs.reduce(
      (acc, job) => {
        acc[job.id] = job;
        return acc;
      },
      {} as Record<string, (typeof jobs)[0]>
    );

    return NextResponse.json({ jobs: jobsMap });
  } catch (error) {
    console.error("[Jobs Poll API] Error polling jobs:", error);
    return NextResponse.json(
      { error: "Failed to poll jobs" },
      { status: 500 }
    );
  }
}
