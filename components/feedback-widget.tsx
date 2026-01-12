"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { feedbackApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquareHeart, Send, Loader2, Check, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type FeedbackCategory = "ai" | "ui" | "bug" | "feature" | "performance" | "other";
type FeedbackSentiment = "very_negative" | "negative" | "neutral" | "positive" | "very_positive";

interface FeedbackWidgetProps {
  className?: string;
  variant?: "sidebar" | "floating" | "inline";
  isCollapsed?: boolean;
}

const categories: { value: FeedbackCategory; label: string; icon: string }[] = [
  { value: "ai", label: "AI", icon: "AI" },
  { value: "ui", label: "Interface", icon: "UI" },
  { value: "bug", label: "Bug", icon: "Bug" },
  { value: "feature", label: "Feature", icon: "Feature" },
  { value: "performance", label: "Performance", icon: "Perf" },
  { value: "other", label: "Other", icon: "Other" },
];

const sentiments: { value: FeedbackSentiment; emoji: string; label: string }[] = [
  { value: "very_negative", emoji: "😡", label: "Very frustrated" },
  { value: "negative", emoji: "😞", label: "Disappointed" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "positive", emoji: "🙂", label: "Satisfied" },
  { value: "very_positive", emoji: "🤩", label: "Love it!" },
];

export function FeedbackWidget({ className, variant = "sidebar", isCollapsed: isCollapsedProp }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("ai");
  const [sentiment, setSentiment] = useState<FeedbackSentiment | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  // Use the prop if provided, otherwise default to false
  const isCollapsed = isCollapsedProp ?? false;

  const resetForm = () => {
    setCategory("ai");
    setSentiment(null);
    setMessage("");
    setIsSuccess(false);
  };

  const handleSubmit = async () => {
    if (!message.trim() || !sentiment) return;

    startTransition(async () => {
      try {
        await feedbackApi.submit({
          category,
          sentiment,
          message: message.trim(),
          pageUrl: window.location.href,
          metadata: { userAgent: navigator.userAgent },
        });

        setIsSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          resetForm();
        }, 1500);
      } catch (error) {
        console.error("Failed to submit feedback:", error);
      }
    });
  };

  const renderTrigger = () => {
    if (variant === "floating") {
      return (
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shadow-lg hover:shadow-xl transition-all bg-white hover:bg-primary hover:text-primary-foreground"
        >
          <MessageSquareHeart className="size-4" />
          <span>Feedback</span>
        </Button>
      );
    }

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 mx-auto text-muted-foreground hover:text-[#00552b] hover:bg-[#00552b]/10 transition-colors"
            >
              <MessageSquareHeart className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Enviar feedback</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-3 text-[#4c4c4c] hover:text-[#00552b] hover:bg-[#00552b]/10 px-3 py-2.5 h-auto transition-colors"
      >
        <div className="flex items-center justify-center size-8 rounded-lg bg-white shadow-sm">
          <MessageSquareHeart className="size-4" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">Feedback</span>
          <span className="text-xs text-muted-foreground">Ayúdanos a mejorar</span>
        </div>
      </Button>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn("w-full", className)}>
          {renderTrigger()}
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={12}
        className="w-[360px] p-0 overflow-hidden shadow-xl border-black/10"
      >
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 gap-3">
            <div className="size-14 rounded-full bg-[#00552b]/10 flex items-center justify-center">
              <Check className="size-7 text-[#00552b]" />
            </div>
            <p className="text-base font-semibold text-[#111111]">Gracias por tu feedback</p>
            <p className="text-sm text-muted-foreground text-center">
              Tu opinión nos ayuda a mejorar.
            </p>
          </div>
        ) : (
          <>
            {/* Header with category selector */}
            <div className="p-4 border-b bg-gradient-to-r from-[#00552b]/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquareHeart className="size-5 text-[#00552b]" />
                  <span className="font-semibold text-[#111111]">Enviar Feedback</span>
                </div>
                <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
                  <SelectTrigger className="w-fit border border-black/10 bg-white shadow-sm px-3 h-8 gap-1.5 text-xs font-medium rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Message textarea */}
            <div className="p-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Cuéntanos tu experiencia..."
                className="w-full min-h-[100px] bg-[#f6f6f6] rounded-lg p-3 resize-none text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#00552b]/20 transition-shadow"
                autoFocus
              />
            </div>

            {/* Footer */}
            <div className="px-4 pb-4">
              {/* Sentiment selector */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">¿Cómo te sientes?</p>
                <div className="flex items-center gap-2">
                  {sentiments.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSentiment(s.value)}
                      className={cn(
                        "size-10 rounded-xl transition-all text-xl flex items-center justify-center border-2",
                        sentiment === s.value
                          ? "bg-[#00552b]/10 border-[#00552b] scale-110 shadow-md"
                          : "border-transparent bg-muted/50 opacity-70 hover:opacity-100 grayscale hover:grayscale-0 hover:bg-muted"
                      )}
                      title={s.label}
                    >
                      {s.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Send button and markdown indicator */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Sparkles className="size-3" />
                  markdown
                </span>

                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!message.trim() || !sentiment || isPending}
                  className="gap-2 bg-[#00552b] hover:bg-[#00552b]/90 text-white px-4"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Enviar
                </Button>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Floating variant for use anywhere in the app
export function FeedbackFloatingButton({ className }: { className?: string }) {
  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      <FeedbackWidget variant="floating" />
    </div>
  );
}
