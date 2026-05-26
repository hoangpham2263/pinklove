"use client";

import { type ChangeEvent, type ComponentProps, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
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
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute right-8 top-1/2 -translate-y-1/2"
          aria-label="Tạo mật khẩu mạnh"
          onClick={handleGenerate}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-1.5 top-1/2 -translate-y-1/2"
        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        onClick={() => setShowPassword((current) => !current)}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
