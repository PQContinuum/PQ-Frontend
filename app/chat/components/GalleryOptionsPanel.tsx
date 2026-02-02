"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Lock,
  Tag,
  Type,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GalleryOptions } from "@/lib/api-client";

interface GalleryOptionsPanelProps {
  options: GalleryOptions;
  onChange: (options: GalleryOptions) => void;
  mediaType: "video" | "image";
  disabled?: boolean;
  compact?: boolean;
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

export function GalleryOptionsPanel({
  options,
  onChange,
  mediaType,
  disabled = false,
  compact = false,
}: GalleryOptionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const isPublic = options.isPublic ?? false;
  const tags = options.tags ?? [];

  const handleTogglePublic = useCallback(() => {
    if (disabled) return;
    const newIsPublic = !isPublic;
    // Auto-expand when toggling to public
    if (newIsPublic && !isExpanded) {
      setIsExpanded(true);
    }
    onChange({
      ...options,
      isPublic: newIsPublic,
      // Clear fields if making private
      ...(newIsPublic ? {} : { title: undefined, description: undefined, tags: undefined }),
    });
  }, [disabled, isPublic, isExpanded, options, onChange]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.slice(0, MAX_TITLE_LENGTH);
      onChange({ ...options, title: value || undefined });
    },
    [options, onChange]
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value.slice(0, MAX_DESCRIPTION_LENGTH);
      onChange({ ...options, description: value || undefined });
    },
    [options, onChange]
  );

  const addTag = useCallback(
    (tag: string) => {
      const normalizedTag = tag.toLowerCase().trim();
      if (
        normalizedTag &&
        tags.length < MAX_TAGS &&
        !tags.includes(normalizedTag)
      ) {
        onChange({ ...options, tags: [...tags, normalizedTag] });
        setTagInput("");
        setShowTagSuggestions(false);
      }
    },
    [tags, options, onChange]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onChange({
        ...options,
        tags: tags.filter((t) => t !== tagToRemove),
      });
    },
    [tags, options, onChange]
  );

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

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <button
          type="button"
          onClick={handleTogglePublic}
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
            "border backdrop-blur-sm",
            isPublic
              ? "bg-primary/20 border-primary/40 text-primary hover:bg-primary/30"
              : "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {isPublic ? (
            <>
              <Globe className="w-3.5 h-3.5" />
              <span>Public</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Private</span>
            </>
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border backdrop-blur-md transition-all duration-300",
        isPublic
          ? "bg-primary/5 border-primary/20"
          : "bg-card/50 border-border/50"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between p-3 cursor-pointer select-none",
          "hover:bg-white/5 rounded-t-xl transition-colors"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* Toggle Switch */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePublic();
            }}
            disabled={disabled}
            className={cn(
              "relative w-14 h-7 rounded-full transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
              isPublic
                ? "bg-gradient-to-r from-primary to-primary/80"
                : "bg-muted",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <motion.div
              className={cn(
                "absolute top-0.5 w-6 h-6 rounded-full shadow-lg flex items-center justify-center",
                isPublic ? "bg-white" : "bg-white/90"
              )}
              animate={{ left: isPublic ? "calc(100% - 26px)" : "2px" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {isPublic ? (
                <Globe className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </motion.div>
          </button>

          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {isPublic ? "Share to Gallery" : "Keep Private"}
            </span>
            <span className="text-xs text-muted-foreground">
              {isPublic
                ? `Your ${mediaType} will be visible in the public gallery`
                : `Only you can see this ${mediaType}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPublic && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
            >
              <Globe className="w-3 h-3" />
              <span>Gallery</span>
            </motion.div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-3">
              {isPublic ? (
                <>
                  {/* Title Input */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Type className="w-3.5 h-3.5" />
                      Title
                      <span className="text-primary">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={options.title ?? ""}
                        onChange={handleTitleChange}
                        placeholder={`Give your ${mediaType} a catchy title...`}
                        disabled={disabled}
                        maxLength={MAX_TITLE_LENGTH}
                        className={cn(
                          "w-full px-3 py-2 rounded-lg text-sm",
                          "bg-background/50 border border-border/50",
                          "placeholder:text-muted-foreground/50",
                          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "transition-all duration-200"
                        )}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50">
                        {(options.title?.length ?? 0)}/{MAX_TITLE_LENGTH}
                      </span>
                    </div>
                  </div>

                  {/* Description Input */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <FileText className="w-3.5 h-3.5" />
                      Description
                      <span className="text-muted-foreground/50">(optional)</span>
                    </label>
                    <div className="relative">
                      <textarea
                        value={options.description ?? ""}
                        onChange={handleDescriptionChange}
                        placeholder="Add a description to help others discover your creation..."
                        disabled={disabled}
                        maxLength={MAX_DESCRIPTION_LENGTH}
                        rows={2}
                        className={cn(
                          "w-full px-3 py-2 rounded-lg text-sm resize-none",
                          "bg-background/50 border border-border/50",
                          "placeholder:text-muted-foreground/50",
                          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "transition-all duration-200"
                        )}
                      />
                      <span className="absolute right-2 bottom-2 text-[10px] text-muted-foreground/50">
                        {(options.description?.length ?? 0)}/{MAX_DESCRIPTION_LENGTH}
                      </span>
                    </div>
                  </div>

                  {/* Tags Input */}
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Tag className="w-3.5 h-3.5" />
                      Tags
                      <span className="text-muted-foreground/50">
                        ({tags.length}/{MAX_TAGS})
                      </span>
                    </label>
                    <div className="relative">
                      <div
                        className={cn(
                          "flex flex-wrap gap-1.5 p-2 rounded-lg min-h-[42px]",
                          "bg-background/50 border border-border/50",
                          "focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50",
                          "transition-all duration-200"
                        )}
                      >
                        {/* Existing Tags */}
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

                        {/* Tag Input */}
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
                            onBlur={() =>
                              setTimeout(() => setShowTagSuggestions(false), 200)
                            }
                            placeholder={
                              tags.length === 0 ? "Add tags..." : "Add more..."
                            }
                            disabled={disabled}
                            className={cn(
                              "flex-1 min-w-[100px] bg-transparent text-xs",
                              "placeholder:text-muted-foreground/50",
                              "focus:outline-none",
                              "disabled:cursor-not-allowed"
                            )}
                          />
                        )}
                      </div>

                      {/* Tag Suggestions */}
                      <AnimatePresence>
                        {showTagSuggestions &&
                          filteredSuggestions.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className={cn(
                                "absolute z-10 w-full mt-1 p-2 rounded-lg",
                                "bg-popover border border-border shadow-lg",
                                "max-h-32 overflow-y-auto"
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

                  {/* Public Info */}
                  <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visible to everyone</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Discoverable in gallery</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Lock className="w-8 h-8 opacity-50" />
                    <p className="text-sm">
                      Your {mediaType} will be saved privately
                    </p>
                    <p className="text-xs opacity-70">
                      Toggle the switch above to share to the gallery
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default GalleryOptionsPanel;
