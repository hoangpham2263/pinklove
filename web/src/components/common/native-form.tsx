"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type FormHTMLAttributes, useRef, useState } from "react";

type NativeFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "method" | "onSubmit"> & {
  action?: string;
  method?: string;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

export function NativeForm({ onSubmit, action, method = "GET", ...props }: NativeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  function navigateTo(location: string) {
    const target = new URL(location, window.location.href);
    if (target.origin === window.location.origin) {
      router.push(`${target.pathname}${target.search}${target.hash}`);
      return;
    }

    window.location.assign(location);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    onSubmit?.(event);
    if (event.defaultPrevented || isSubmittingRef.current) return;

    const form = event.currentTarget;
    const target = new URL(action || window.location.href, window.location.href);
    event.preventDefault();

    if (target.origin !== window.location.origin) {
      console.error("NativeForm only supports same-origin actions");
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const submitter = event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null;
      const formData = new FormData(form, submitter);
      const normalizedMethod = method.toUpperCase();

      if (normalizedMethod === "GET") {
        for (const [key, value] of formData.entries()) {
          if (typeof value === "string") target.searchParams.append(key, value);
        }
        router.push(`${target.pathname}${target.search}${target.hash}`);
        return;
      }

      const response = await fetch(target, {
        method: normalizedMethod,
        body: formData,
        credentials: "same-origin",
      });

      if (response.redirected) {
        navigateTo(response.url);
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json().catch(() => null) as { location?: string; message?: string } | null
        : null;

      if (payload?.location) {
        navigateTo(payload.location);
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.message || `Form submission failed with status ${response.status}`);
      }

      router.refresh();
    } catch (error) {
      console.error("Client-side form submission failed", error);
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form
      {...props}
      aria-busy={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
