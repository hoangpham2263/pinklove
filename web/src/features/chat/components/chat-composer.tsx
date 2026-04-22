"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/features/chat/types";

type ChatComposerProps = {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  messageBody: string;
  onMessageChange: (value: string) => void;
  onMessageKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  disabled?: boolean;
  isSending?: boolean;
  sendDisabled?: boolean;
  sendLabel?: string;
  replyTarget?: ChatMessage | null;
  onReplyClear?: () => void;
  attachmentUrl?: string;
  onAttachmentClear?: () => void;
  banner?: ReactNode;
  actions?: ReactNode;
};

export function ChatComposer({
  onSubmit,
  messageBody,
  onMessageChange,
  onMessageKeyDown,
  placeholder,
  disabled = false,
  isSending = false,
  sendDisabled = false,
  sendLabel = "Gửi",
  replyTarget,
  onReplyClear,
  attachmentUrl = "",
  onAttachmentClear,
  banner,
  actions,
}: ChatComposerProps) {
  return (
    <form onSubmit={onSubmit} className="shrink-0 border-t p-4">
      {replyTarget ? (
        <div className="mb-3 flex items-start justify-between gap-3 rounded-md border bg-muted/50 px-3 py-2 text-xs">
          <div className="min-w-0">
            <p className="font-medium">Đang trả lời {replyTarget.senderDisplayName}</p>
            <p className="line-clamp-2 whitespace-pre-wrap break-words text-muted-foreground">
              {replyTarget.body || "Tin nhắn đính kèm"}
            </p>
          </div>
          <button type="button" onClick={onReplyClear} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {attachmentUrl ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-md border bg-muted/50 px-3 py-2 text-xs">
          <div className="min-w-0">
            <p className="font-medium">Đã chọn tệp đính kèm</p>
            <p className="truncate text-muted-foreground">{attachmentUrl}</p>
          </div>
          <button type="button" onClick={onAttachmentClear} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {banner ? <div className="mb-3">{banner}</div> : null}

      <div className="flex items-end gap-2">
        <textarea
          value={messageBody}
          onChange={(event) => onMessageChange(event.target.value)}
          onKeyDown={onMessageKeyDown}
          className="h-12 min-h-12 flex-1 resize-none rounded-md border bg-background px-3 py-3 text-sm leading-5 outline-none focus:ring-2 focus:ring-ring"
          placeholder={placeholder}
          disabled={disabled}
        />
        {actions}
        <Button type="submit" className="h-12 px-4" disabled={sendDisabled || isSending}>
          <Send className="h-4 w-4" />
          {sendLabel}
        </Button>
      </div>
    </form>
  );
}
