"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Lock,
  CheckCircle2,
  Tag,
  Type,
  FileText,
  X,
  Share2,
  Eye,
  Heart,
  Copy,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { galleryApi, UpdateMediaVisibilityRequest } from "@/lib/api-client";

interface ShareToGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType: "video" | "image";
  jobId?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  prompt?: string;
  currentTitle?: string;
  currentDescription?: string;
  currentTags?: string[];
  isCurrentlyPublic?: boolean;
  onSuccess?: (data: { isPublic: boolean; title?: string; shareUrl?: string }) => void;
}

const MAX_TAGS = 5;
const MAX_TITLE_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

const SUGGESTED_TAGS = [
  "cinematic",
  "artistic",
  "nature",
  "portrait",
  "abstract",
  "fantasy",
  "scifi",
  "vintage",
  "minimalist",
  "colorful",
  "dark",
  "bright",
  "dreamy",
  "realistic",
  "anime",
];

export function ShareToGalleryModal({
  isOpen,
  onClose,
  mediaType,
  jobId,
  mediaUrl,
  thumbnailUrl,
  prompt,
  currentTitle = "",
  currentDescription = "",
  currentTags = [],
  isCurrentlyPublic = false,
  onSuccess,
}: ShareToGalleryModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription);
  const [tags, setTags] = useState<string[]>(currentTags);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const addTag = useCallback(
    (tag: string) => {
      const normalizedTag = tag.toLowerCase().trim();
      if (normalizedTag && tags.length < MAX_TAGS && !tags.includes(normalizedTag)) {
        setTags([...tags, normalizedTag]);
        setTagInput("");
        setShowTagSuggestions(false);
      }
    },
    [tags]
  );

  const removeTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(tagInput);
      } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
        removeTag(tags[tags.length - 1]);
      }
    },
    [tagInput, tags, addTag, removeTag]
  );

  const filteredSuggestions = SUGGESTED_TAGS.filter(
    (tag) =>
      tag.includes(tagInput.toLowerCase()) &&
      !tags.includes(tag) &&
      tags.length < MAX_TAGS
  );

  const handleShare = async () => {
    if (!title.trim()) {
      setError("El título es requerido para compartir en la galería");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data: UpdateMediaVisibilityRequest = {
        isPublic: true,
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      if (jobId) {
        if (mediaType === "video") {
          await galleryApi.updateVideoVisibility(jobId, data);
        } else {
          await galleryApi.updateImageVisibility(jobId, data);
        }
      }

      setIsSuccess(true);
      const shareUrl = jobId ? `${window.location.origin}/gallery/${mediaType}/${jobId}` : undefined;
      onSuccess?.({ isPublic: true, title: title.trim(), shareUrl });

      // Close after a brief success animation
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Error sharing to gallery:", err);
      setError(err instanceof Error ? err.message : "Error al compartir");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMakePrivate = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const data: UpdateMediaVisibilityRequest = {
        isPublic: false,
      };

      if (jobId) {
        if (mediaType === "video") {
          await galleryApi.updateVideoVisibility(jobId, data);
        } else {
          await galleryApi.updateImageVisibility(jobId, data);
        }
      }

      onSuccess?.({ isPublic: false });
      onClose();
    } catch (err) {
      console.error("Error making private:", err);
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!jobId) return;
    const galleryUrl = `${window.location.origin}/gallery/${mediaType}/${jobId}`;
    navigator.clipboard.writeText(galleryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const mediaPreview = thumbnailUrl || mediaUrl;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-card border-border/50 overflow-hidden">
        {/* Success State */}
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center py-16 px-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6"
              >
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xl font-semibold text-foreground mb-2"
              >
                Shared to Gallery!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-muted-foreground text-center"
              >
                Your {mediaType} is now visible in the public gallery
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header with Preview */}
              <div className="relative">
                {/* Media Preview */}
                <div className="relative h-40 bg-muted overflow-hidden">
                  {mediaType === "video" ? (
                    <video
                      src={mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

                  {/* Media type badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
                    {mediaType === "video" ? (
                      <Video className="w-3.5 h-3.5" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5" />
                    )}
                    <span className="capitalize">{mediaType}</span>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Title */}
                <DialogHeader className="px-6 pt-4 pb-2">
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <Share2 className="w-5 h-5 text-primary" />
                    {isCurrentlyPublic ? "Update Gallery Listing" : "Share to Gallery"}
                  </DialogTitle>
                </DialogHeader>
              </div>

              {/* Form Content */}
              <div className="px-6 pb-6 space-y-4">
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Prompt Preview */}
                {prompt && (
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1">Original Prompt</p>
                    <p className="text-sm text-foreground line-clamp-2">{prompt}</p>
                  </div>
                )}

                {/* Title Input */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Type className="w-4 h-4 text-muted-foreground" />
                    Title
                    <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                      placeholder="Give your creation a catchy title..."
                      maxLength={MAX_TITLE_LENGTH}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-lg text-sm",
                        "bg-background border border-border",
                        "placeholder:text-muted-foreground/50",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                        "transition-all duration-200"
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/50">
                      {title.length}/{MAX_TITLE_LENGTH}
                    </span>
                  </div>
                </div>

                {/* Description Input */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Description
                    <span className="text-muted-foreground/50 text-xs font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                      placeholder="Tell others about your creation..."
                      maxLength={MAX_DESCRIPTION_LENGTH}
                      rows={2}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-lg text-sm resize-none",
                        "bg-background border border-border",
                        "placeholder:text-muted-foreground/50",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                        "transition-all duration-200"
                      )}
                    />
                    <span className="absolute right-3 bottom-2 text-xs text-muted-foreground/50">
                      {description.length}/{MAX_DESCRIPTION_LENGTH}
                    </span>
                  </div>
                </div>

                {/* Tags Input */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    Tags
                    <span className="text-muted-foreground/50 text-xs font-normal">
                      ({tags.length}/{MAX_TAGS})
                    </span>
                  </label>
                  <div className="relative">
                    <div
                      className={cn(
                        "flex flex-wrap gap-1.5 p-2.5 rounded-lg min-h-[44px]",
                        "bg-background border border-border",
                        "focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50",
                        "transition-all duration-200"
                      )}
                    >
                      {tags.map((tag) => (
                        <motion.span
                          key={tag}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                            "bg-primary/10 text-primary border border-primary/20"
                          )}
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-destructive transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.span>
                      ))}
                      {tags.length < MAX_TAGS && (
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => {
                            setTagInput(e.target.value);
                            setShowTagSuggestions(true);
                          }}
                          onKeyDown={handleTagKeyDown}
                          onFocus={() => setShowTagSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                          placeholder={tags.length === 0 ? "Add tags..." : "More..."}
                          className={cn(
                            "flex-1 min-w-[80px] bg-transparent text-sm",
                            "placeholder:text-muted-foreground/50",
                            "focus:outline-none"
                          )}
                        />
                      )}
                    </div>

                    {/* Tag Suggestions */}
                    <AnimatePresence>
                      {showTagSuggestions && filteredSuggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className={cn(
                            "absolute z-10 w-full mt-1 p-2 rounded-lg",
                            "bg-popover border border-border shadow-lg",
                            "max-h-28 overflow-y-auto"
                          )}
                        >
                          <div className="flex flex-wrap gap-1">
                            {filteredSuggestions.slice(0, 8).map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => addTag(tag)}
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-xs",
                                  "bg-muted hover:bg-primary/10 hover:text-primary",
                                  "transition-colors duration-150"
                                )}
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex items-center gap-4 py-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Discoverable by everyone</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5" />
                    <span>Others can like & share</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {isCurrentlyPublic && (
                    <button
                      onClick={handleMakePrivate}
                      disabled={isSubmitting}
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                        "bg-muted hover:bg-muted/80 text-muted-foreground",
                        "transition-all duration-200",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      <Lock className="w-4 h-4" />
                      Make Private
                    </button>
                  )}

                  {isCurrentlyPublic && (
                    <button
                      onClick={handleCopyLink}
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                        "bg-muted hover:bg-muted/80 text-foreground",
                        "transition-all duration-200"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-primary" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={handleShare}
                    disabled={isSubmitting || !title.trim()}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium",
                      "bg-primary hover:bg-primary/90 text-primary-foreground",
                      "transition-all duration-200",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      />
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        {isCurrentlyPublic ? "Update" : "Share to Gallery"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default ShareToGalleryModal;
