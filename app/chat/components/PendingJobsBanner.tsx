"use client";

import { usePendingJobs, getJobStatusMessage, type GenerationJob } from "@/hooks/useGenerationJobs";
import { Loader2, Video, Image, MessageSquare, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingJobsBannerProps {
  className?: string;
  onJobClick?: (job: GenerationJob) => void;
}

function getJobIcon(jobType: string) {
  switch (jobType) {
    case "video":
      return <Video className="h-4 w-4" />;
    case "image":
      return <Image className="h-4 w-4" />;
    case "chat":
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <Loader2 className="h-4 w-4" />;
  }
}

function getJobTypeLabel(jobType: string): string {
  switch (jobType) {
    case "video":
      return "video";
    case "image":
      return "imagen";
    case "chat":
      return "mensaje";
    default:
      return "proceso";
  }
}

function JobItem({ job, onClick }: { job: GenerationJob; onClick?: (job: GenerationJob) => void }) {
  const statusMessage = getJobStatusMessage(job);
  const isActive = ["pending", "queued", "processing", "uploading"].includes(job.status);

  return (
    <button
      onClick={() => onClick?.(job)}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
        "bg-white/10 hover:bg-white/20",
        onClick && "cursor-pointer"
      )}
    >
      <span className="flex items-center gap-1.5">
        {isActive ? (
          <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
        ) : job.status === "completed" ? (
          <Check className="h-3 w-3 text-green-400" />
        ) : (
          <X className="h-3 w-3 text-red-400" />
        )}
        {getJobIcon(job.jobType)}
      </span>
      <span className="text-white/80">{statusMessage}</span>
    </button>
  );
}

export function PendingJobsBanner({ className, onJobClick }: PendingJobsBannerProps) {
  const { data: pendingJobs, isLoading } = usePendingJobs();

  // Don't show if loading or no jobs
  if (isLoading || !pendingJobs || pendingJobs.length === 0) {
    return null;
  }

  const jobCount = pendingJobs.length;
  const hasMultiple = jobCount > 1;

  // Group by type for summary
  const videoJobs = pendingJobs.filter((j) => j.jobType === "video");
  const imageJobs = pendingJobs.filter((j) => j.jobType === "image");
  const chatJobs = pendingJobs.filter((j) => j.jobType === "chat");

  return (
    <div
      className={cn(
        "fixed top-4 left-1/2 -translate-x-1/2 z-50",
        "bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm",
        "rounded-xl shadow-lg border border-white/20",
        "px-4 py-3 max-w-md w-full mx-4",
        "animate-in fade-in slide-in-from-top-2 duration-300",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Loader2 className="h-4 w-4 animate-spin text-white" />
        <span className="text-white font-medium">
          {hasMultiple
            ? `${jobCount} procesos en progreso`
            : `1 ${getJobTypeLabel(pendingJobs[0].jobType)} en progreso`}
        </span>
      </div>

      {/* Summary or individual jobs */}
      {hasMultiple ? (
        <div className="flex flex-wrap gap-2 text-sm text-white/80">
          {videoJobs.length > 0 && (
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              {videoJobs.length} video{videoJobs.length > 1 ? "s" : ""}
            </span>
          )}
          {imageJobs.length > 0 && (
            <span className="flex items-center gap-1">
              <Image className="h-3 w-3" />
              {imageJobs.length} imagen{imageJobs.length > 1 ? "es" : ""}
            </span>
          )}
          {chatJobs.length > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {chatJobs.length} mensaje{chatJobs.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {pendingJobs.map((job) => (
            <JobItem key={job.id} job={job} onClick={onJobClick} />
          ))}
        </div>
      )}

      {/* Info message */}
      <p className="text-xs text-white/60 mt-2">
        Puedes cerrar esta ventana. Te notificaremos cuando terminen.
      </p>
    </div>
  );
}

/**
 * Compact version for embedding in chat header or sidebar
 */
export function PendingJobsIndicator({ onClick }: { onClick?: () => void }) {
  const { data: pendingJobs, isLoading } = usePendingJobs();

  if (isLoading || !pendingJobs || pendingJobs.length === 0) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs",
        "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
      )}
    >
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>{pendingJobs.length} en proceso</span>
    </button>
  );
}
