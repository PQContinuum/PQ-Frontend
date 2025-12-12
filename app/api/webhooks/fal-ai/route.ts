import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  getGenerationJobByProviderRequestId,
  updateGenerationJobByProviderRequestId,
} from "@/db/queries/generation-jobs";
import { recordVideoGenUsage } from "@/lib/video-gen-usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds to download and upload video

// Fal.ai webhook payload types
interface FalWebhookPayload {
  request_id: string;
  status: "OK" | "ERROR";
  payload?: {
    video?: {
      url: string;
      file_size?: number;
      file_name?: string;
      content_type?: string;
    };
    image?: {
      url: string;
    };
  };
  error?: string;
}

/**
 * POST /api/webhooks/fal-ai
 * Handles webhook callbacks from Fal.ai when video/image generation completes
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const payload: FalWebhookPayload = await request.json();
    console.log("[Fal Webhook] Received:", JSON.stringify(payload, null, 2));

    const { request_id, status, payload: resultPayload, error } = payload;

    if (!request_id) {
      console.warn("[Fal Webhook] No request_id in payload");
      return NextResponse.json({ error: "No request_id" }, { status: 400 });
    }

    // Find the job by provider request ID
    const job = await getGenerationJobByProviderRequestId(request_id);

    if (!job) {
      console.warn("[Fal Webhook] Job not found for request_id:", request_id);
      // Return 200 to prevent retries - job might have been deleted
      return NextResponse.json({ message: "Job not found, ignoring" });
    }

    console.log(`[Fal Webhook] Found job ${job.id} for request ${request_id}`);

    // Handle error status
    if (status === "ERROR" || error) {
      const errorMessage = error || "Unknown error from Fal.ai";
      console.error(`[Fal Webhook] Job ${job.id} failed:`, errorMessage);

      // Check if we should retry
      if (job.retryCount < job.maxRetries) {
        await updateGenerationJobByProviderRequestId(request_id, {
          status: "failed",
          errorMessage,
          retryCount: job.retryCount + 1,
          completedAt: new Date(),
        });
      } else {
        await updateGenerationJobByProviderRequestId(request_id, {
          status: "failed",
          errorMessage,
          completedAt: new Date(),
        });
      }

      return NextResponse.json({ success: true, status: "failed" });
    }

    // Success - process the result
    const videoUrl = resultPayload?.video?.url;

    if (!videoUrl) {
      console.error("[Fal Webhook] No video URL in response");
      await updateGenerationJobByProviderRequestId(request_id, {
        status: "failed",
        errorMessage: "No video URL in response",
        completedAt: new Date(),
      });
      return NextResponse.json({ success: true, status: "failed" });
    }

    // Update status to uploading
    await updateGenerationJobByProviderRequestId(request_id, {
      status: "uploading",
      resultUrl: videoUrl,
      progressMessage: "Guardando video...",
    });

    // Download video and upload to Supabase Storage
    const supabase = createSupabaseServiceClient();
    let savedVideoUrl = videoUrl;
    let storagePath: string | undefined;

    try {
      console.log(`[Fal Webhook] Downloading video from ${videoUrl}`);
      const videoResponse = await fetch(videoUrl);

      if (videoResponse.ok) {
        const videoBuffer = await videoResponse.arrayBuffer();
        const fileName = `video-${Date.now()}.mp4`;
        storagePath = `${job.userId}/${fileName}`;

        console.log(`[Fal Webhook] Uploading to storage: ${storagePath}`);
        const { error: uploadError } = await supabase.storage
          .from("generated-videos")
          .upload(storagePath, videoBuffer, {
            contentType: "video/mp4",
            upsert: false,
          });

        if (!uploadError) {
          // Get signed URL (valid for 7 days)
          const { data: signedData } = await supabase.storage
            .from("generated-videos")
            .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

          if (signedData?.signedUrl) {
            savedVideoUrl = signedData.signedUrl;
          }
          console.log(`[Fal Webhook] Saved to storage: ${storagePath}`);
        } else {
          console.warn("[Fal Webhook] Failed to upload to storage:", uploadError);
        }
      } else {
        console.warn("[Fal Webhook] Failed to download video:", videoResponse.status);
      }
    } catch (saveError) {
      console.warn("[Fal Webhook] Error saving video:", saveError);
      // Continue with original URL if save fails
    }

    const generationTime = job.startedAt
      ? Date.now() - job.startedAt.getTime()
      : Date.now() - job.createdAt.getTime();

    // Update job as completed
    await updateGenerationJobByProviderRequestId(request_id, {
      status: "completed",
      resultUrl: videoUrl,
      storagePath,
      publicUrl: savedVideoUrl,
      publicUrlExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      completedAt: new Date(),
      generationTimeMs: generationTime,
      progressPercent: 100,
      progressMessage: "Completado",
    });

    console.log(`[Fal Webhook] Job ${job.id} completed in ${generationTime}ms`);

    // Record video usage (async, don't block)
    try {
      const inputParams = JSON.parse(job.inputParams);
      await recordVideoGenUsage(job.userId, {
        prompt: inputParams.prompt,
        mode: inputParams.mode || "text-to-video",
        duration: inputParams.duration || "5",
        aspectRatio: inputParams.aspectRatio || "16:9",
        audioEnabled: inputParams.generateAudio ?? true,
        sourceImageUrl: inputParams.imageUrl,
        storagePath,
        originalUrl: videoUrl,
        requestId: request_id,
        generationTimeMs: generationTime,
      });
    } catch (usageError) {
      console.error("[Fal Webhook] Failed to record usage:", usageError);
    }

    const processingTime = Date.now() - startTime;
    console.log(`[Fal Webhook] Webhook processed in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      status: "completed",
      jobId: job.id,
      processingTime,
    });
  } catch (error) {
    console.error("[Fal Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/fal-ai
 * Health check for webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Fal.ai webhook endpoint is ready",
    timestamp: new Date().toISOString(),
  });
}
