"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface VerificationCodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export function VerificationCodeInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  autoFocus = true,
}: VerificationCodeInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Focus first empty input when value changes externally
  useEffect(() => {
    const firstEmptyIndex = value.length < length ? value.length : length - 1;
    if (focusedIndex === null && inputRefs.current[firstEmptyIndex]) {
      inputRefs.current[firstEmptyIndex]?.focus();
    }
  }, [value, length, focusedIndex]);

  const handleChange = useCallback(
    (index: number, digit: string) => {
      // Only allow digits
      if (digit && !/^\d$/.test(digit)) return;

      const newValue = value.split("");
      newValue[index] = digit;
      const joined = newValue.join("").slice(0, length);

      onChange(joined);

      // Move to next input if digit was entered
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Call onComplete when all digits are entered
      if (joined.length === length && onComplete) {
        onComplete(joined);
      }
    },
    [value, length, onChange, onComplete]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (value[index]) {
          // Delete current digit
          handleChange(index, "");
        } else if (index > 0) {
          // Move to previous input and delete
          inputRefs.current[index - 1]?.focus();
          handleChange(index - 1, "");
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      }
    },
    [value, length, handleChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
      const newValue = pastedData.slice(0, length);

      onChange(newValue);

      // Focus the appropriate input after paste
      const focusIndex = Math.min(newValue.length, length - 1);
      inputRefs.current[focusIndex]?.focus();

      // Call onComplete if all digits are pasted
      if (newValue.length === length && onComplete) {
        onComplete(newValue);
      }
    },
    [length, onChange, onComplete]
  );

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
          disabled={disabled}
          className={cn(
            "w-12 h-14 text-center text-2xl font-semibold rounded-lg border-2 bg-transparent transition-all duration-200 outline-none",
            "focus:border-[#00552b] focus:ring-2 focus:ring-[#00552b]/20",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
              : "border-gray-300 dark:border-gray-600",
            disabled && "opacity-50 cursor-not-allowed",
            value[index] && !error && "border-[#00552b]/50"
          )}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
