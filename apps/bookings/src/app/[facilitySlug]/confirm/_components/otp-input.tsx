"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@wifo/ui";

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function OtpInput({
  length = 6,
  onComplete,
  disabled = false,
  error = false,
}: OtpInputProps) {
  const [values, setValues] = useState<string[]>(
    Array.from({ length }, () => ""),
  );
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = useCallback(
    (index: number, value: string) => {
      // Only accept digits
      const digit = value.replace(/\D/g, "").slice(-1);

      const newValues = [...values];
      newValues[index] = digit;
      setValues(newValues);

      // Move to next input
      if (digit && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }

      // Check if complete
      const code = newValues.join("");
      if (code.length === length && !code.includes("")) {
        onComplete(code);
      }
    },
    [values, length, onComplete],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !values[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    },
    [values],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length);
      if (!pasted) return;

      const newValues = [...values];
      for (let i = 0; i < pasted.length; i++) {
        newValues[i] = pasted[i] ?? "";
      }
      setValues(newValues);

      // Focus the next empty input or the last one
      const nextEmpty = newValues.findIndex((v) => !v);
      const focusIndex = nextEmpty === -1 ? length - 1 : nextEmpty;
      inputsRef.current[focusIndex]?.focus();

      // Check if complete
      const code = newValues.join("");
      if (code.length === length) {
        onComplete(code);
      }
    },
    [values, length, onComplete],
  );

  return (
    <div className="flex justify-center gap-2">
      {values.map((value, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value}
          disabled={disabled}
          aria-label={`Dígito ${i + 1} del código`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={cn(
            "border-input bg-background h-12 w-10 rounded-md border text-center text-lg font-semibold transition-colors",
            "focus:border-primary focus:ring-primary/20 focus:ring-2 focus:outline-none",
            error &&
              "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            disabled && "opacity-50",
          )}
        />
      ))}
    </div>
  );
}
