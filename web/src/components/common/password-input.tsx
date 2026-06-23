"use client";

import { type ChangeEvent, type ComponentProps, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";

import { Input } from "@/components/ui/input";
import { generateSecurePassword } from "@/lib/password";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type" | "value" | "defaultValue" | "onChange"> & {
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onValueChange?: (value: string) => void;
  allowGenerate?: boolean;
};

export function PasswordInput({
  className,
  value,
  defaultValue = "",
  onChange,
  onValueChange,
  allowGenerate = false,
  ...props
}: PasswordInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = value ?? internalValue;

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form || value !== undefined) {
      return;
    }

    function handleReset() {
      setInternalValue(defaultValue);
      setShowPassword(false);
    }

    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [defaultValue, value]);

  function updateValue(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    updateValue(event.target.value);
    onChange?.(event);
  }

  function handleGenerate() {
    const nextPassword = generateSecurePassword();
    updateValue(nextPassword);
    setShowPassword(true);
  }

  return (
    <div className="relative">
      <Input
        {...props}
        ref={inputRef}
        value={currentValue}
        type={showPassword ? "text" : "password"}
        className={cn(allowGenerate ? "pr-16" : "pr-10", className)}
        onChange={handleChange}
      />
      {allowGenerate ? (
        <button
          type="button"
          className="absolute inset-y-0 right-8 my-auto inline-flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label="Tạo mật khẩu mạnh"
          onClick={handleGenerate}
        >
          <Sparkles className="h-4 w-4" />
        </button>
      ) : null}
      <button
        type="button"
        className="absolute inset-y-0 right-1.5 my-auto inline-flex size-7 items-center justify-center rounded-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        onClick={() => setShowPassword((current) => !current)}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
