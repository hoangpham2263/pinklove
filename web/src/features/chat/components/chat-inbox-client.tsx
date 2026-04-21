"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Plus, Send, Settings, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRealtimeResource } from "@/features/realtime/use-realtime-resource";
import type {
  ChatAssignableAccount,
  ChatConversationDetail,
  ChatMessage,
  ChatConversationSummary,
} from "@/features/chat/types";
import { getRoleLabel, isAdminRole, type UserRole } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

type ChatInboxClientProps = {
  currentUser: {
    id: string;
    username: string;
    role: UserRole;
  };
  initialConversations: ChatConversationSummary[];
  initialConversation: ChatConversationDetail | null;
  assignableAccounts?: ChatAssignableAccount[];
  mode: "admin" | "customer";
};

function formatTime(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

function getConversationLabel(conversation: ChatConversationSummary) {
  if (conversation.kind === "group") return "Nhóm";
  if (conversation.kind === "support") return "Hỗ trợ";
  return "Direct";
}

function getPreview(conversation: ChatConversationSummary) {
  if (!conversation.lastMessage) return "Chưa có tin nhắn.";
  return `${conversation.lastMessage.senderDisplayName}: ${conversation.lastMessage.body}`;
}

function upsertConversationSummary(
  items: ChatConversationSummary[],
  nextItem: ChatConversationSummary
) {
  const remaining = items.filter((item) => item.id !== nextItem.id);
  return [nextItem, ...remaining];
}

function toConversationSummary(detail: ChatConversationDetail): ChatConversationSummary {
  return {
    id: detail.id,
    title: detail.title,
    kind: detail.kind,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    participants: detail.participants,
    lastMessage: detail.lastMessage,
  };
}

export function ChatInboxClient({
  currentUser,
  initialConversations,
  initialConversation,
  assignableAccounts = [],
  mode,
}: ChatInboxClientProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversation?.id ?? initialConversations[0]?.id ?? "");
  const [conversation, setConversation] = useState<ChatConversationDetail | null>(initialConversation);
  const [messageBody, setMessageBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<"overview" | "members" | "realtime">("overview");
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const selectedSummary = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const currentParticipants = useMemo(
    () => conversation?.participants ?? selectedSummary?.participants ?? [],
    [conversation?.participants, selectedSummary?.participants]
  );
  const availableAccountsForConversation = useMemo(() => {
    const participantIds = new Set(currentParticipants.map((participant) => participant.id));
    return assignableAccounts.filter((account) => !participantIds.has(account.id));
  }, [assignableAccounts, currentParticipants]);

  const loadConversations = useCallback(async () => {
    const response = await fetch(ROUTES.API.CHAT.CONVERSATIONS, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) throw new Error("LOAD_CONVERSATIONS_FAILED");
    const data = (await response.json()) as { conversations?: ChatConversationSummary[] };
    return data.conversations ?? [];
  }, []);

  const loadConversation = useCallback(async () => {
    if (!selectedConversationId) return null;
    const response = await fetch(ROUTES.API.CHAT.CONVERSATION(selectedConversationId), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error("LOAD_CONVERSATION_FAILED");
    const data = (await response.json()) as { conversation?: ChatConversationDetail };
    return data.conversation ?? null;
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) {
      setConversation(null);
      return;
    }

    let cancelled = false;
    void loadConversation()
      .then((nextConversation) => {
        if (!cancelled) setConversation(nextConversation);
      })
      .catch(() => {
        if (!cancelled) toast.error("Không thể tải hội thoại.");
      });

    return () => {
      cancelled = true;
    };
  }, [loadConversation, selectedConversationId]);

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
      return;
    }

    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [conversation?.messages.length, selectedConversationId]);

  useRealtimeResource({
    enabled: true,
    streamUrl: ROUTES.API.CHAT.REALTIME_INBOX,
    changedEvent: "chat-inbox.changed",
    load: loadConversations,
    onData: (nextConversations) => {
      const currentSelectedSummary = conversations.find((item) => item.id === selectedConversationId) ?? null;
      const nextSelectedSummary = nextConversations.find((item) => item.id === selectedConversationId) ?? null;

      setConversations(nextConversations);
      if (!selectedConversationId && nextConversations[0]) {
        setSelectedConversationId(nextConversations[0].id);
      }

      const currentVersion = [
        currentSelectedSummary?.updatedAt ?? "",
        currentSelectedSummary?.lastMessage?.id ?? "",
      ].join("|");
      const nextVersion = [
        nextSelectedSummary?.updatedAt ?? "",
        nextSelectedSummary?.lastMessage?.id ?? "",
      ].join("|");

      if (selectedConversationId && nextSelectedSummary && nextVersion !== currentVersion) {
        void loadConversation()
          .then((nextConversation) => {
            setConversation(nextConversation);
          })
          .catch(() => {
            toast.error("Không thể tải hội thoại.");
          });
      }
    },
    onError: () => {
      toast.error("Không thể đồng bộ danh sách tin nhắn.");
    },
  });

  useRealtimeResource({
    enabled: Boolean(selectedConversationId),
    streamUrl: selectedConversationId
      ? ROUTES.API.CHAT.REALTIME_CONVERSATION(selectedConversationId)
      : ROUTES.API.CHAT.REALTIME_INBOX,
    changedEvent: "chat-conversation.changed",
    load: loadConversation,
    onData: (nextConversation) => {
      if (!nextConversation) {
        setConversation(null);
        return;
      }

      setConversation(nextConversation);
      setConversations((current) =>
        upsertConversationSummary(current, toConversationSummary(nextConversation))
      );
    },
    onError: () => {
      toast.error("Không thể đồng bộ hội thoại đang mở.");
    },
  });

  async function refreshAfterMutation(conversationId?: string) {
    const [nextConversations, nextConversation] = await Promise.all([
      loadConversations(),
      conversationId
        ? fetch(ROUTES.API.CHAT.CONVERSATION(conversationId), {
            headers: { Accept: "application/json" },
            cache: "no-store",
            credentials: "same-origin",
          }).then(async (response) => {
            if (!response.ok) return null;
            const data = (await response.json()) as { conversation?: ChatConversationDetail };
            return data.conversation ?? null;
          })
        : Promise.resolve(null),
    ]);
    setConversations(nextConversations);
    if (conversationId) {
      setSelectedConversationId(conversationId);
      setConversation(nextConversation);
    }
  }

  function applyOptimisticSentMessage(conversationId: string, body: string) {
    const createdAt = new Date().toISOString();
    const optimisticMessage: ChatMessage = {
      id: `optimistic-${createdAt}`,
      conversationId,
      senderUserId: currentUser.id,
      senderUsername: currentUser.username,
      senderDisplayName: currentUser.username,
      body,
      createdAt,
    };

    setConversation((current) => {
      if (!current || current.id !== conversationId) {
        return current;
      }

      return {
        ...current,
        updatedAt: createdAt,
        lastMessage: optimisticMessage,
        messages: [...current.messages, optimisticMessage],
      };
    });

    setConversations((current) => {
      const matched = current.find((item) => item.id === conversationId);
      if (!matched) {
        return current;
      }

      return upsertConversationSummary(current, {
        ...matched,
        updatedAt: createdAt,
        lastMessage: optimisticMessage,
      });
    });
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversationId || !messageBody.trim()) return;

    const conversationId = selectedConversationId;
    const nextBody = messageBody.trim();
    setIsSending(true);
    try {
      const response = await fetch(ROUTES.API.CHAT.MESSAGES(selectedConversationId), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ body: nextBody }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Không thể gửi tin nhắn.");
      }

      applyOptimisticSentMessage(conversationId, nextBody);
      setMessageBody("");
      void refreshAfterMutation(conversationId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi tin nhắn.");
    } finally {
      setIsSending(false);
    }
  }

  function handleMessageKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    if (!selectedConversationId || !messageBody.trim() || isSending) {
      return;
    }

    event.currentTarget.form?.requestSubmit();
  }

  async function handleCreateGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedAccountIds.length === 0) {
      toast.error("Chọn ít nhất một account để tạo hội thoại.");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(ROUTES.API.CHAT.CONVERSATIONS, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          title: groupTitle,
          participantUserIds: selectedAccountIds,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Không thể tạo hội thoại.");
      }

      const data = (await response.json()) as { conversationId: string };
      setGroupTitle("");
      setSelectedAccountIds([]);
      setCreateDialogOpen(false);
      await refreshAfterMutation(data.conversationId);
      toast.success("Đã tạo hội thoại.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo hội thoại.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleAddMembers(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversationId || selectedMemberIds.length === 0) {
      toast.error("Chọn ít nhất một account để thêm vào hội thoại.");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(ROUTES.API.CHAT.PARTICIPANTS(selectedConversationId), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          participantUserIds: selectedMemberIds,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Không thể thêm thành viên.");
      }

      setSelectedMemberIds([]);
      setSettingsDialogOpen(false);
      await refreshAfterMutation(selectedConversationId);
      toast.success("Đã thêm thành viên.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể thêm thành viên.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleStartSupport() {
    setIsCreating(true);
    try {
      const response = await fetch(ROUTES.API.CHAT.CONVERSATIONS, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ mode: "support" }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Không thể mở hội thoại hỗ trợ.");
      }

      const data = (await response.json()) as { conversationId: string };
      await refreshAfterMutation(data.conversationId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể mở hội thoại hỗ trợ.");
    } finally {
      setIsCreating(false);
    }
  }

  function toggleAccount(accountId: string) {
    setSelectedAccountIds((current) =>
      current.includes(accountId)
        ? current.filter((id) => id !== accountId)
        : [...current, accountId]
    );
  }

  function toggleMember(accountId: string) {
    setSelectedMemberIds((current) =>
      current.includes(accountId)
        ? current.filter((id) => id !== accountId)
        : [...current, accountId]
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-hidden xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-background">
        <div className="shrink-0 border-b p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Hội thoại</h2>
              <p className="text-sm text-muted-foreground">{conversations.length} cuộc trao đổi</p>
            </div>
            {mode === "admin" && isAdminRole(currentUser.role) ? (
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label="Tạo hội thoại"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            ) : (
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth">
          {conversations.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Chưa có hội thoại nào.</div>
          ) : (
            conversations.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedConversationId(item.id)}
                className={`w-full border-b p-4 text-left transition-colors hover:bg-muted/60 ${
                  item.id === selectedConversationId ? "bg-muted" : "bg-background"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{getPreview(item)}</p>
                  </div>
                  <Badge className="shrink-0 rounded-md border px-2 py-0.5 text-xs">
                    {getConversationLabel(item)}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{formatTime(item.lastMessage?.createdAt ?? item.updatedAt)}</p>
              </button>
            ))
          )}
        </div>

        {mode === "customer" ? (
          <div className="border-t p-4">
            <Button type="button" variant="outline" className="w-full" onClick={handleStartSupport} disabled={isCreating}>
              <MessageCircle className="h-4 w-4" />
              {isCreating ? "Đang mở..." : "Trao đổi với admin"}
            </Button>
          </div>
        ) : null}
      </aside>

      <section className="min-h-0 min-w-0 overflow-hidden">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border bg-background">
          <header className="shrink-0 border-b p-4">
            {conversation ?? selectedSummary ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{conversation?.title ?? selectedSummary?.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {(conversation?.participants ?? selectedSummary?.participants ?? [])
                        .map((participant) => participant.displayName || participant.username)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="rounded-md border px-2 py-1 text-xs">
                      {getConversationLabel(conversation ?? selectedSummary!)}
                    </Badge>
                    {mode === "admin" && isAdminRole(currentUser.role) ? (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="outline"
                        aria-label="Cài đặt hội thoại"
                        onClick={() => {
                          setSettingsSection("overview");
                          setSettingsDialogOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <h2 className="text-lg font-semibold">Chọn một hội thoại</h2>
                <p className="text-sm text-muted-foreground">Tin nhắn realtime sẽ hiển thị tại đây.</p>
              </div>
            )}
          </header>

          <div
            ref={messagesContainerRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
          >
            {!conversation ? (
              <div className="flex h-full min-h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Chưa có nội dung hội thoại.
              </div>
            ) : conversation.messages.length === 0 ? (
              <div className="flex h-full min-h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Hãy gửi tin nhắn đầu tiên.
              </div>
            ) : (
              conversation.messages.map((message) => {
                const ownMessage = message.senderUserId === currentUser.id;
                return (
                  <div key={message.id} className={`flex ${ownMessage ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-lg border px-3 py-2 text-sm ${ownMessage ? "bg-primary text-primary-foreground" : "bg-muted/60"}`}>
                      {!ownMessage ? <p className="mb-1 text-xs font-medium">{message.senderDisplayName}</p> : null}
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      <p className={`mt-1 text-[11px] ${ownMessage ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="shrink-0 border-t p-4">
            <div className="flex gap-2">
              <textarea
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                onKeyDown={handleMessageKeyDown}
                className="min-h-12 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Nhập tin nhắn..."
                disabled={!selectedConversationId || isSending}
              />
              <Button type="submit" className="h-auto self-stretch px-4" disabled={!selectedConversationId || !messageBody.trim() || isSending}>
                <Send className="h-4 w-4" />
                Gửi
              </Button>
            </div>
          </form>
        </div>

      </section>

      {mode === "admin" && isAdminRole(currentUser.role) ? (
        <>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo hội thoại</DialogTitle>
                <DialogDescription>
                  Chọn account để tạo direct chat hoặc group chat.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tên nhóm</label>
                  <input
                    value={groupTitle}
                    onChange={(event) => setGroupTitle(event.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="VD: CSKH - đơn tháng 4"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Thành viên</label>
                  <div className="max-h-[360px] space-y-2 overflow-y-auto rounded-md border p-2">
                    {assignableAccounts.map((account) => (
                      <label key={account.id} className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-muted">
                        <input
                          type="checkbox"
                          checked={selectedAccountIds.includes(account.id)}
                          onChange={() => toggleAccount(account.id)}
                          className="mt-1"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{account.displayName || account.username}</span>
                          <span className="block text-xs text-muted-foreground">
                            @{account.username} - {getRoleLabel(account.role)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isCreating || selectedAccountIds.length === 0}>
                  <Users className="h-4 w-4" />
                  {isCreating ? "Đang tạo..." : "Tạo hội thoại"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Cài đặt hội thoại</DialogTitle>
                <DialogDescription>
                  Quản lý thông tin, thành viên và trạng thái realtime của cuộc trò chuyện.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
                  {[
                    { id: "overview", label: "Tổng quan" },
                    { id: "members", label: "Thành viên" },
                    { id: "realtime", label: "Realtime" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSettingsSection(item.id as typeof settingsSection)}
                      className={`shrink-0 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        settingsSection === item.id ? "bg-muted font-medium" : "hover:bg-muted/70"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>

                <div className="min-h-[360px] rounded-lg border p-4">
                  {settingsSection === "overview" ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">Tổng quan</h3>
                        <p className="text-sm text-muted-foreground">Thông tin cơ bản của hội thoại hiện tại.</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Tên hội thoại</p>
                          <p className="mt-1 font-medium">{conversation?.title ?? selectedSummary?.title ?? "Chưa chọn"}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Loại</p>
                          <p className="mt-1 font-medium">
                            {conversation ?? selectedSummary ? getConversationLabel(conversation ?? selectedSummary!) : "Chưa chọn"}
                          </p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Số thành viên</p>
                          <p className="mt-1 font-medium">{currentParticipants.length}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Cập nhật gần nhất</p>
                          <p className="mt-1 font-medium">{formatTime(conversation?.updatedAt ?? selectedSummary?.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {settingsSection === "members" ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">Thành viên</h3>
                        <p className="text-sm text-muted-foreground">Xem thành viên hiện tại và thêm account vào hội thoại.</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Thành viên hiện tại</p>
                        <div className="max-h-36 space-y-2 overflow-y-auto rounded-md border p-2">
                          {currentParticipants.map((participant) => (
                            <div key={participant.id} className="rounded-md bg-muted/60 p-2 text-sm">
                              <p className="font-medium">{participant.displayName || participant.username}</p>
                              <p className="text-xs text-muted-foreground">
                                @{participant.username} - {getRoleLabel(participant.role)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <form onSubmit={handleAddMembers} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Thêm thành viên</label>
                          <div className="max-h-[220px] space-y-2 overflow-y-auto rounded-md border p-2">
                            {availableAccountsForConversation.length === 0 ? (
                              <p className="p-2 text-sm text-muted-foreground">Không còn account khả dụng để thêm.</p>
                            ) : (
                              availableAccountsForConversation.map((account) => (
                                <label key={account.id} className="flex cursor-pointer items-start gap-2 rounded-md p-2 hover:bg-muted">
                                  <input
                                    type="checkbox"
                                    checked={selectedMemberIds.includes(account.id)}
                                    onChange={() => toggleMember(account.id)}
                                    className="mt-1"
                                  />
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-medium">{account.displayName || account.username}</span>
                                    <span className="block text-xs text-muted-foreground">
                                      @{account.username} - {getRoleLabel(account.role)}
                                    </span>
                                  </span>
                                </label>
                              ))
                            )}
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isCreating || !selectedConversationId || selectedMemberIds.length === 0}
                        >
                          <Plus className="h-4 w-4" />
                          {isCreating ? "Đang thêm..." : "Thêm thành viên"}
                        </Button>
                      </form>
                    </div>
                  ) : null}

                  {settingsSection === "realtime" ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">Realtime</h3>
                        <p className="text-sm text-muted-foreground">Trạng thái đồng bộ realtime của hội thoại.</p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Inbox stream</p>
                          <p className="mt-1 font-medium">chat-inbox.changed</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Khung chat</p>
                          <p className="mt-1 font-medium">Fetch khi hội thoại đổi</p>
                        </div>
                        <div className="rounded-md border p-3 sm:col-span-2">
                          <p className="text-xs uppercase text-muted-foreground">Cơ chế</p>
                          <p className="mt-1 text-sm">
                            Database notify qua PostgreSQL LISTEN/NOTIFY, client chỉ fetch dữ liệu mới khi stream nhận event.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  );
}
