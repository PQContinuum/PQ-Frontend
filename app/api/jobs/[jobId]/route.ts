import { NextRequest, NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  getGenerationJobById,
  cancelGenerationJob,
  updateGenerationJob,
} from "@/db/queries/generation-jobs";
import { recordVideoGenUsage } from "@/lib/video-gen-usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Configure fal client
fal.config({
  credentials: process.env.FAL_AI_API_KEY,
});

/**
 * Check Fal.ai status and update job if completed
 * This is a fallback for when webhooks don't work
 */
async function checkAndUpdateFalStatus(job: {
  id: string;
  userId: string;
  providerRequestId: string | null;
  jobType: string;
  inputParams: string;
  startedAt: Date | null;
  createdAt: Date;
}) {
  if (!job.providerRequestId) {
    return null;
  }

  try {
    // Determine endpoint based on job type and input params
    let inputParams: { mode?: string } = {};
    try {
      inputParams = JSON.parse(job.inputParams);
    } catch {
      // ignore
    }

    const endpoint =
      inputParams.mode === "image-to-video"
        ? "fal-ai/kling-video/v2.6/pro/image-to-video"
        : "fal-ai/kling-video/v2.6/pro/text-to-video";

    console.log(`[Jobs API] Checking Fal.ai status for ${job.providerRequestId}`);

    const status = await fal.queue.status(endpoint, {
      requestId: job.providerRequestId,
      logs: false,
    });

    const falStatus = status.status as string;
    console.log(`[Jobs API] Fal.ai status:`, falStatus);

    if (falStatus === "COMPLETED") {
      // Get the result
      const result = await fal.queue.result(endpoint, {
        requestId: job.providerRequestId,
      });

      const videoUrl = (result.data as { video?: { url: string } })?.video?.url;

      if (videoUrl) {
        // Download and save to storage
        const supabase = createSupabaseServiceClient();
        let savedVideoUrl = videoUrl;
        let storagePath: string | undefined;

        try {
          console.log(`[Jobs API] Downloading video from ${videoUrl}`);
          const videoResponse = await fetch(videoUrl);

          if (videoResponse.ok) {
            const videoBuffer = await videoResponse.arrayBuffer();
            const fileName = `video-${Date.now()}.mp4`;
            storagePath = `${job.userId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("generated-videos")
              .upload(storagePath, videoBuffer, {
                contentType: "video/mp4",
                upsert: false,
              });

            if (!uploadError) {
              const { data: signedData } = await supabase.storage
                .from("generated-videos")
                .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

              if (signedData?.signedUrl) {
                savedVideoUrl = signedData.signedUrl;
              }
              console.log(`[Jobs API] Saved to storage: ${storagePath}`);
            }
          }
        } catch (saveError) {
          console.warn("[Jobs API] Error saving video:", saveError);
        }

        const generationTime = job.startedAt
          ? Date.now() - job.startedAt.getTime()
          : Date.now() - job.createdAt.getTime();

        // Update job as completed
        const updatedJob = await updateGenerationJob(job.id, job.userId, {
          status: "completed",
          resultUrl: videoUrl,
          storagePath,
          publicUrl: savedVideoUrl,
          publicUrlExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          completedAt: new Date(),
          generationTimeMs: generationTime,
          progressPercent: 100,
          progressMessage: "Completado",
        });

        // Record usage
        try {
          const params = JSON.parse(job.inputParams);
          await recordVideoGenUsage(job.userId, {
            prompt: params.prompt,
            mode: params.mode || "text-to-video",
            duration: params.duration || "5",
            aspectRatio: params.aspectRatio || "16:9",
            audioEnabled: params.generateAudio ?? true,
            sourceImageUrl: params.imageUrl,
            storagePath,
            originalUrl: videoUrl,
            requestId: job.providerRequestId!,
            generationTimeMs: generationTime,
          });
        } catch (usageError) {
          console.error("[Jobs API] Failed to record usage:", usageError);
        }

        return updatedJob;
      }
    } else if (falStatus === "FAILED") {
      return await updateGenerationJob(job.id, job.userId, {
        status: "failed",
        errorMessage: "Error en la generación del video",
        completedAt: new Date(),
      });
    } else if (falStatus === "IN_PROGRESS") {
      // Update progress if available
      return await updateGenerationJob(job.id, job.userId, {
        status: "processing",
        progressMessage: "Generando video...",
      });
    } else if (falStatus === "IN_QUEUE") {
      return await updateGenerationJob(job.id, job.userId, {
        status: "queued",
        progressMessage: "En cola de generación...",
      });
    }

    return null;
  } catch (error) {
    console.error("[Jobs API] Error checking Fal.ai status:", error);
    return null;
  }
}

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

    let job = await getGenerationJobById(jobId, user.id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // If job is still pending/queued/processing and has a provider request ID,
    // check Fal.ai directly as a fallback for when webhooks don't work
    if (
      ["pending", "queued", "processing"].includes(job.status) &&
      job.providerRequestId &&
      job.jobType === "video"
    ) {
      const updatedJob = await checkAndUpdateFalStatus(job);
      if (updatedJob) {
        job = updatedJob;
      }
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
