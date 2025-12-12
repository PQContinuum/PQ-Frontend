"use client";

import { usePendingJobs, getJobStatusMessage, type GenerationJob } from "@/hooks/useGenerationJobs";
import { Loader2, Video, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PendingJobsBannerProps {
  className?: string;
  onJobClick?: (job: GenerationJob) => void;
}

function getJobIcon(jobType: string) {
  switch (jobType) {
    case "video":
      return <Video className="h-3.5 w-3.5" />;
    case "image":
      return <Image className="h-3.5 w-3.5" />;
    default:
      return <Loader2 className="h-3.5 w-3.5" />;
  }
}

function getJobTypeLabel(jobType: string): string {
  switch (jobType) {
    case "video":
      return "Video";
    case "image":
      return "Imagen";
    default:
      return "Proceso";
  }
}

export function PendingJobsBanner({ className }: PendingJobsBannerProps) {
  const { data: pendingJobs, isLoading } = usePendingJobs();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if loading, no jobs, or dismissed
  if (isLoading || !pendingJobs || pendingJobs.length === 0 || isDismissed) {
    return null;
  }

  const jobCount = pendingJobs.length;
  const firstJob = pendingJobs[0];
  const statusMessage = getJobStatusMessage(firstJob);

  return (
    <div
      className={cn(
        // Positioning - bottom on mobile, top on desktop
        "fixed z-50",
        "bottom-24 left-4 right-4 md:bottom-auto md:top-4 md:left-1/2 md:-translate-x-1/2",
        // Container
        "md:w-auto md:min-w-[280px] md:max-w-[360px]",
        // Animation
        "animate-in fade-in slide-in-from-bottom-2 md:slide-in-from-top-2 duration-300",
        className
      )}
    >
      <div
        className={cn(
          // Background - subtle glass effect
          "bg-[#111111]/95 backdrop-blur-md",
          "rounded-xl shadow-xl",
          "border border-white/10",
          // Padding
          "px-4 py-3"
        )}
      >
        {/* Main content */}
        <div className="flex items-center gap-3">
          {/* Animated icon */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-[#00552b]/20 rounded-full animate-ping" />
            <div className="relative flex items-center justify-center h-8 w-8 bg-[#00552b]/20 rounded-full">
              {getJobIcon(firstJob.jobType)}
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {jobCount > 1
                ? `${jobCount} procesos activos`
                : `${getJobTypeLabel(firstJob.jobType)} generándose`
              }
            </p>
            <p className="text-xs text-white/50 truncate">
              {jobCount > 1
                ? "Puedes seguir navegando"
                : statusMessage
              }
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex-shrink-0">
            <Loader2 className="h-4 w-4 animate-spin text-[#00552b]" />
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4 text-white/40 hover:text-white/60" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00552b] to-[#00aa56] rounded-full animate-pulse"
            style={{ width: "60%" }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Compact pill indicator for header/sidebar
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
        "inline-flex items-center gap-1.5",
        "px-2.5 py-1 rounded-full",
        "bg-[#00552b]/15 text-[#00552b]",
        "text-xs font-medium",
        "hover:bg-[#00552b]/25 transition-colors",
        "animate-in fade-in duration-200"
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00552b] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00552b]" />
      </span>
      <span>{pendingJobs.length} en proceso</span>
    </button>
  );
}
