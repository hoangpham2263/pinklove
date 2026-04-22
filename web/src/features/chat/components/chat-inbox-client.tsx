"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Flag,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Pin,
  Plus,
  Reply,
  Search,
  Settings,
  StickyNote,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatComposer } from "@/features/chat/components/chat-composer";
import { MediaSelector } from "@/features/media/components/media-selector";
import { useRealtimeResource } from "@/features/realtime/use-realtime-resource";
import type {
  ChatAssignableAccount,
  ChatConversationDetail,
  ChatConversationStatus,
  ChatConversationUserPriority,
  ChatMessage,
  ChatMessageVisibility,
  ChatConversationSummary,
  ChatSupportRequestCategory,
} from "@/features/chat/types";
import type { RealtimeStatus } from "@/features/realtime/types";
import { getRoleLabel, isAdminRole, type UserRole, USER_ROLES } from "@/lib/roles";
import { ROUTES } from "@/lib/routes";

const ADMIN_QUICK_REPLIES = [
  "PinkLove đã nhận tin nhắn của bạn. Bên mình phản hồi chi tiết trong ít phút.",
  "Bạn gửi giúp mình nội dung cần hỗ trợ và ảnh mẫu nếu có nhé.",
  "Bên mình đã cập nhật thông tin. Mình sẽ quay lại ngay khi có tiến độ mới.",
  "Mình đã chuyển cuộc chat này cho đúng người phụ trách để hỗ trợ nhanh hơn.",
];
const ADMIN_QUICK_REPLIES_STORAGE_KEY = "pinklove-chat-admin-quick-replies";

const SUPPORT_REQUEST_OPTIONS: Array<{
  value: ChatSupportRequestCategory;
  label: string;
  description: string;
}> = [
  {
    value: "general",
    label: "Hỗ trợ chung",
    description: "Câu hỏi chung, cần tư vấn hoặc muốn trao đổi thêm.",
  },
  {
    value: "bug_report",
    label: "Báo lỗi hệ thống",
    description: "Website, giao diện hoặc chức năng hoạt động chưa đúng.",
  },
  {
    value: "order_support",
    label: "Hỗ trợ đơn hàng",
    description: "Trao đổi về đơn hàng, tiến độ xử lý hoặc bàn giao.",
  },
  {
    value: "billing",
    label: "Thanh toán và tài khoản",
    description: "Vấn đề thanh toán, hóa đơn hoặc đăng nhập tài khoản.",
  },
  {
    value: "affiliate_support",
    label: "Hỗ trợ affiliate",
    description: "Theo dõi hoa hồng, link giới thiệu, mã affiliate hoặc hồ sơ CTV.",
  },
  {
    value: "vendor_support",
    label: "Hỗ trợ vendor",
    description: "Trao đổi vận hành, đơn được giao, tiến độ xử lý hoặc thông tin nhà cung cấp.",
  },
  {
    value: "other",
    label: "Trao đổi khác",
    description: "Nội dung không thuộc các nhóm trên.",
  },
];

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

function formatSidebarTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function getConversationLabel(conversation: ChatConversationSummary) {
  if (conversation.kind === "support") {
    switch (conversation.category) {
      case "bug_report":
        return "Báo lỗi";
      case "order_support":
        return "Đơn hàng";
      case "billing":
        return "Thanh toán";
      case "affiliate_support":
        return "Affiliate";
      case "vendor_support":
        return "Vendor";
      case "other":
        return "Khác";
      case "general":
        return "Hỗ trợ";
      default:
        return conversation.isLegacy ? "Trao đổi cũ" : "Hỗ trợ";
    }
  }
  if (conversation.kind === "group") return "Nhóm";
  return "Direct";
}

function getConversationStatusLabel(status: ChatConversationStatus) {
  switch (status) {
    case "pending":
      return "Đang chờ";
    case "resolved":
      return "Đã xử lý";
    case "closed":
      return "Đã đóng";
    default:
      return "Đang mở";
  }
}

function getMessagePreview(
  message?: ChatMessage,
  options: {
    includeSender?: boolean;
    currentUserId?: string;
  } = {}
) {
  if (!message) return "Chưa có tin nhắn.";
  const senderLabel = message.senderUserId === options.currentUserId ? "Bạn" : message.senderDisplayName;
  const body = message.body || (message.attachmentUrl ? "Đã gửi tệp" : "Tin nhắn");
  const text = message.visibility === "internal"
    ? `[Ghi chú nội bộ] ${message.body || "Đính kèm nội bộ"}`
    : message.attachmentUrl && message.body
      ? `${body} • có đính kèm`
      : body;

  return options.includeSender ? `${senderLabel}: ${text}` : text;
}

function getRealtimeLabel(status: RealtimeStatus) {
  if (status === "retrying") return "Đang kết nối lại";
  if (status === "connecting") return "Đang kết nối";
  return "Live";
}

function getRealtimeBadgeClassName(status: RealtimeStatus) {
  if (status === "retrying") {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }
  if (status === "connecting") {
    return "border-sky-300 bg-sky-50 text-sky-700";
  }
  return "border-emerald-300 bg-emerald-50 text-emerald-700";
}

function upsertConversationSummary(items: ChatConversationSummary[], nextItem: ChatConversationSummary) {
  const remaining = items.filter((item) => item.id !== nextItem.id);
  return sortConversationSummaries([nextItem, ...remaining]);
}

function getConversationPriorityRank(priority: ChatConversationUserPriority) {
  switch (priority) {
    case "urgent":
      return 4;
    case "high":
      return 3;
    case "normal":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

function sortConversationSummaries(items: ChatConversationSummary[]) {
  return [...items].sort((left, right) => {
    if (left.isPinned !== right.isPinned) return left.isPinned ? -1 : 1;
    const priorityDiff = getConversationPriorityRank(right.userPriority) - getConversationPriorityRank(left.userPriority);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function toConversationSummary(detail: ChatConversationDetail): ChatConversationSummary {
  return {
    id: detail.id,
    title: detail.title,
    kind: detail.kind,
    status: detail.status,
    category: detail.category,
    priority: detail.priority,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
    unreadCount: detail.unreadCount,
    isPinned: detail.isPinned,
    isMarkedUnread: detail.isMarkedUnread,
    userPriority: detail.userPriority,
    tags: detail.tags,
    ownerUserId: detail.ownerUserId,
    ownerDisplayName: detail.ownerDisplayName,
    requesterUserId: detail.requesterUserId,
    requesterDisplayName: detail.requesterDisplayName,
    isLegacy: detail.isLegacy,
    typingDisplayNames: detail.typingDisplayNames,
    participants: detail.participants,
    lastMessage: detail.lastMessage,
  };
}

function dedupeTags(input: string) {
  return Array.from(
    new Set(
      input
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );
}

function parseQuickReplies(input: string) {
  return Array.from(
    new Set(
      input
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function isImageUrl(url: string) {
  return /\.(avif|gif|ico|jpe?g|png|svg|webp)$/i.test(url);
}

function getViewerBadgeLabel(value: string) {
  const normalized = value.trim();
  if (!normalized) return "?";
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function getPriorityLabel(priority: ChatConversationUserPriority) {
  switch (priority) {
    case "urgent":
      return "Khẩn cấp";
    case "high":
      return "Cao";
    case "normal":
      return "Bình thường";
    case "low":
      return "Thấp";
    default:
      return "Chưa đánh dấu";
  }
}

function getPriorityClassName(priority: ChatConversationUserPriority) {
  switch (priority) {
    case "urgent":
      return "border-red-300 bg-red-50 text-red-700";
    case "high":
      return "border-orange-300 bg-orange-50 text-orange-700";
    case "normal":
      return "border-sky-300 bg-sky-50 text-sky-700";
    case "low":
      return "border-slate-300 bg-slate-50 text-slate-700";
    default:
      return "border-transparent bg-transparent text-current";
  }
}

function getParticipantDisplayName(participant: { displayName: string; username: string }) {
  return participant.displayName || participant.username;
}

function getConversationUserLabel(conversation: ChatConversationSummary, currentUserId: string, isAdmin: boolean) {
  if (isAdmin) {
    const requester = conversation.requesterDisplayName.trim();
    if (requester) return requester;
    const nonAdminParticipant = conversation.participants.find((participant) => participant.id !== currentUserId && participant.role !== USER_ROLES.ADMIN);
    if (nonAdminParticipant) return getParticipantDisplayName(nonAdminParticipant);
  }

  const other = conversation.participants.find((participant) => participant.id !== currentUserId);
  return other ? getParticipantDisplayName(other) : "";
}

function getConversationDisplayTitle(conversation: ChatConversationSummary, currentUserId: string, isAdmin: boolean) {
  const title = conversation.title.trim() || getConversationLabel(conversation);
  if (!isAdmin) return title;

  const userLabel = getConversationUserLabel(conversation, currentUserId, isAdmin);
  if (!userLabel || title.includes(`(${userLabel})`)) return title;
  return `${title} (${userLabel})`;
}

function getDefaultSupportRequestCategory(role: UserRole): ChatSupportRequestCategory {
  if (role === USER_ROLES.AFFILIATE) return "affiliate_support";
  if (role === USER_ROLES.VENDOR) return "vendor_support";
  return "general";
}

export function ChatInboxClient({
  currentUser,
  initialConversations,
  initialConversation,
  assignableAccounts = [],
  mode,
}: ChatInboxClientProps) {
  const isAdmin = mode === "admin" && isAdminRole(currentUser.role);
  const [conversations, setConversations] = useState(() => sortConversationSummaries(initialConversations));
  const [selectedConversationId, setSelectedConversationId] = useState(
    initialConversation?.id ?? initialConversations[0]?.id ?? ""
  );
  const [conversation, setConversation] = useState<ChatConversationDetail | null>(initialConversation);
  const [messageBody, setMessageBody] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [messageVisibility, setMessageVisibility] = useState<ChatMessageVisibility>("all");
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);
  const [composerActionsOpen, setComposerActionsOpen] = useState(false);
  const [pinnedMessagesOpen, setPinnedMessagesOpen] = useState(false);
  const [openConversationMenuId, setOpenConversationMenuId] = useState("");
  const [openMessageMenuId, setOpenMessageMenuId] = useState("");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [sidebarFilter, setSidebarFilter] = useState<"all" | "unread" | "mine" | "active" | "resolved" | "closed">("all");
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [generalSettingsDialogOpen, setGeneralSettingsDialogOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<"overview" | "members" | "workflow" | "realtime">("overview");
  const [generalSettingsSection, setGeneralSettingsSection] = useState<"overview" | "quickReplies" | "composer">("overview");
  const [groupTitle, setGroupTitle] = useState("");
  const [supportRequestCategory, setSupportRequestCategory] = useState<ChatSupportRequestCategory>(() =>
    getDefaultSupportRequestCategory(currentUser.role)
  );
  const [supportRequestTitle, setSupportRequestTitle] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [ownerUserId, setOwnerUserId] = useState(initialConversation?.ownerUserId ?? "");
  const [statusValue, setStatusValue] = useState<ChatConversationStatus>(initialConversation?.status ?? "open");
  const [tagsInput, setTagsInput] = useState((initialConversation?.tags ?? []).join(", "));
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState(ADMIN_QUICK_REPLIES);
  const [quickRepliesInput, setQuickRepliesInput] = useState(ADMIN_QUICK_REPLIES.join("\n"));
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedSummary = useMemo(
    () => conversations.find((item) => item.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  const currentConversation = conversation ?? selectedSummary;
  const currentParticipants = useMemo(
    () => conversation?.participants ?? selectedSummary?.participants ?? [],
    [conversation?.participants, selectedSummary?.participants]
  );
  const availableAccountsForConversation = useMemo(() => {
    const participantIds = new Set(currentParticipants.map((participant) => participant.id));
    return assignableAccounts.filter((account) => !participantIds.has(account.id));
  }, [assignableAccounts, currentParticipants]);
  const totalUnreadCount = useMemo(
    () => conversations.reduce((sum, item) => sum + item.unreadCount, 0),
    [conversations]
  );
  const filteredConversations = useMemo(() => {
    const keyword = sidebarSearch.trim().toLowerCase();
    return conversations.filter((item) => {
      if (sidebarFilter === "unread" && item.unreadCount === 0 && !item.isMarkedUnread) return false;
      if (sidebarFilter === "mine" && item.ownerUserId !== currentUser.id) return false;
      if (sidebarFilter === "active" && (item.status === "resolved" || item.status === "closed")) return false;
      if (sidebarFilter === "resolved" && item.status !== "resolved") return false;
      if (sidebarFilter === "closed" && item.status !== "closed") return false;

      if (!keyword) return true;
      const haystack = [
        item.title,
        item.ownerDisplayName,
        item.lastMessage?.senderDisplayName ?? "",
        item.tags.join(" "),
        getMessagePreview(item.lastMessage),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [conversations, currentUser.id, sidebarFilter, sidebarSearch]);

  const loadConversations = useCallback(async () => {
    const response = await fetch(ROUTES.API.CHAT.CONVERSATIONS, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error("LOAD_CONVERSATIONS_FAILED");
    const data = (await response.json()) as { conversations?: ChatConversationSummary[] };
    return sortConversationSummaries(data.conversations ?? []);
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
        if (cancelled) return;
        setConversation(nextConversation);
        if (nextConversation) {
          setOwnerUserId(nextConversation.ownerUserId);
          setStatusValue(nextConversation.status);
          setTagsInput(nextConversation.tags.join(", "));
          setConversations((current) =>
            upsertConversationSummary(current, toConversationSummary(nextConversation))
          );
        }
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

  const inboxRealtime = useRealtimeResource({
    enabled: true,
    streamUrl: ROUTES.API.CHAT.REALTIME_INBOX,
    changedEvent: "chat-inbox.changed",
    load: loadConversations,
    onData: (nextConversations) => {
      const currentSelectedSummary = conversations.find((item) => item.id === selectedConversationId) ?? null;
      const nextSelectedSummary = nextConversations.find((item) => item.id === selectedConversationId) ?? null;
      setConversations(sortConversationSummaries(nextConversations));
      if (!selectedConversationId && nextConversations[0]) {
        setSelectedConversationId(nextConversations[0].id);
      }

      const currentVersion = [
        currentSelectedSummary?.updatedAt ?? "",
        currentSelectedSummary?.lastMessage?.id ?? "",
        currentSelectedSummary?.typingDisplayNames.join("|") ?? "",
      ].join("|");
      const nextVersion = [
        nextSelectedSummary?.updatedAt ?? "",
        nextSelectedSummary?.lastMessage?.id ?? "",
        nextSelectedSummary?.typingDisplayNames.join("|") ?? "",
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

  const conversationRealtime = useRealtimeResource({
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
      setOwnerUserId(nextConversation.ownerUserId);
      setStatusValue(nextConversation.status);
      setTagsInput(nextConversation.tags.join(", "));
      setConversations((current) => upsertConversationSummary(current, toConversationSummary(nextConversation)));
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

    setConversations(sortConversationSummaries(nextConversations));
    if (conversationId) {
      setSelectedConversationId(conversationId);
      setConversation(nextConversation);
      if (nextConversation) {
        setOwnerUserId(nextConversation.ownerUserId);
        setStatusValue(nextConversation.status);
        setTagsInput(nextConversation.tags.join(", "));
      }
    }
  }

  function applyOptimisticSentMessage(input: {
    conversationId: string;
    body: string;
    attachmentUrl: string;
    visibility: ChatMessageVisibility;
    replyTarget: ChatMessage | null;
  }) {
    const createdAt = new Date().toISOString();
    const optimisticMessage: ChatMessage = {
      id: `optimistic-${createdAt}`,
      conversationId: input.conversationId,
      senderUserId: currentUser.id,
      senderUsername: currentUser.username,
      senderDisplayName: currentUser.username,
      body: input.body,
      visibility: input.visibility,
      attachmentUrl: input.attachmentUrl,
      attachmentKind: input.attachmentUrl ? (isImageUrl(input.attachmentUrl) ? "image" : "file") : "",
      isPinned: false,
      replyTo: input.replyTarget
        ? {
            id: input.replyTarget.id,
            senderUserId: input.replyTarget.senderUserId,
            body: input.replyTarget.body,
            senderDisplayName: input.replyTarget.senderDisplayName,
          }
        : undefined,
      createdAt,
    };

    setConversation((current) => {
      if (!current || current.id !== input.conversationId) return current;
      return {
        ...current,
        updatedAt: createdAt,
        unreadCount: 0,
        typingDisplayNames: [],
        lastMessage: optimisticMessage,
        lastSeenByDisplayNames: [],
        messages: [...current.messages, optimisticMessage],
      };
    });

    setConversations((current) => {
      const matched = current.find((item) => item.id === input.conversationId);
      if (!matched) return current;
      return upsertConversationSummary(current, {
        ...matched,
        updatedAt: createdAt,
        unreadCount: 0,
        typingDisplayNames: [],
        lastMessage: optimisticMessage,
      });
    });
  }

  const pushTyping = useCallback(async (nextIsTyping: boolean) => {
    if (!selectedConversationId) return;
    try {
      await fetch(ROUTES.API.CHAT.TYPING(selectedConversationId), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ isTyping: nextIsTyping }),
      });
    } catch {
      return;
    }
  }, [selectedConversationId]);

  useEffect(() => {
    if (!isAdmin || typeof window === "undefined") return;
    const storedValue = window.localStorage.getItem(ADMIN_QUICK_REPLIES_STORAGE_KEY);
    if (!storedValue) return;
    const parsed = parseQuickReplies(storedValue);
    if (parsed.length === 0) return;
    setQuickReplies(parsed);
    setQuickRepliesInput(parsed.join("\n"));
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedConversationId) return;
    if (!messageBody.trim()) {
      if (isTyping) {
        setIsTyping(false);
        void pushTyping(false);
      }
      return;
    }

    if (!isTyping) {
      setIsTyping(true);
      void pushTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      void pushTyping(false);
    }, 2500);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, messageBody, pushTyping, selectedConversationId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedConversationId || (!messageBody.trim() && !attachmentUrl)) return;

    const conversationId = selectedConversationId;
    const nextBody = messageBody.trim();
    const nextAttachmentUrl = attachmentUrl.trim();
    setIsSending(true);

    try {
      const response = await fetch(ROUTES.API.CHAT.MESSAGES(selectedConversationId), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          body: nextBody,
          attachmentUrl: nextAttachmentUrl,
          replyToMessageId: replyTarget?.id ?? "",
          visibility: messageVisibility,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Không thể gửi tin nhắn.");
      }

      applyOptimisticSentMessage({
        conversationId,
        body: nextBody,
        attachmentUrl: nextAttachmentUrl,
        visibility: messageVisibility,
        replyTarget,
      });
      setMessageBody("");
      setAttachmentUrl("");
      setReplyTarget(null);
      setMessageVisibility("all");
      setIsTyping(false);
      void pushTyping(false);
      void refreshAfterMutation(conversationId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi tin nhắn.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!selectedConversationId) return;
    const confirmed = window.confirm("Xóa tin nhắn này?");
    if (!confirmed) return;

    try {
      const response = await fetch(ROUTES.API.CHAT.MESSAGES(selectedConversationId), {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ messageId }),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Không thể xóa tin nhắn.");
      }

      setReplyTarget((current) => (current?.id === messageId ? null : current));
      await refreshAfterMutation(selectedConversationId);
      toast.success("Đã xóa tin nhắn.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa tin nhắn.");
    }
  }

  async function handleUpdateMessageState(message: ChatMessage, nextState: {
    isPinned?: boolean;
  }) {
    if (!selectedConversationId) return;
    const nextIsPinned = nextState.isPinned ?? message.isPinned;

    setOpenMessageMenuId("");
    setConversation((current) => {
      if (!current || current.id !== selectedConversationId) return current;
      return {
        ...current,
        messages: current.messages.map((item) =>
          item.id === message.id ? { ...item, isPinned: nextIsPinned } : item
        ),
      };
    });

    try {
      const response = await fetch(ROUTES.API.CHAT.MESSAGES(selectedConversationId), {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          messageId: message.id,
          isPinned: nextIsPinned,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Không thể cập nhật đánh dấu tin nhắn.");
      }
      await refreshAfterMutation(selectedConversationId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật đánh dấu tin nhắn.");
      await refreshAfterMutation(selectedConversationId);
    }
  }

  function handleMessageKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }
    event.preventDefault();
    if (!selectedConversationId || (!messageBody.trim() && !attachmentUrl) || isSending) return;
    event.currentTarget.form?.requestSubmit();
  }

  function handleSaveQuickReplies() {
    const nextReplies = parseQuickReplies(quickRepliesInput);
    if (nextReplies.length === 0) {
      toast.error("Cần ít nhất một mẫu sẵn.");
      return;
    }
    setQuickReplies(nextReplies);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_QUICK_REPLIES_STORAGE_KEY, nextReplies.join("\n"));
    }
    toast.success("Đã lưu mẫu sẵn.");
  }

  function handleResetQuickReplies() {
    setQuickReplies(ADMIN_QUICK_REPLIES);
    setQuickRepliesInput(ADMIN_QUICK_REPLIES.join("\n"));
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_QUICK_REPLIES_STORAGE_KEY, ADMIN_QUICK_REPLIES.join("\n"));
    }
    toast.success("Đã khôi phục mẫu mặc định.");
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
      await refreshAfterMutation(selectedConversationId);
      toast.success("Đã thêm thành viên.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể thêm thành viên.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSaveMeta() {
    if (!selectedConversationId) return;
    setIsSavingMeta(true);
    try {
      const response = await fetch(ROUTES.API.CHAT.CONVERSATION(selectedConversationId), {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          ownerUserId,
          status: statusValue,
          tags: dedupeTags(tagsInput),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        conversation?: ChatConversationDetail;
      };
      if (!response.ok) {
        throw new Error(data.message ?? "Không thể lưu workflow.");
      }
      if (data.conversation) {
        setConversation(data.conversation);
        setConversations((current) => upsertConversationSummary(current, toConversationSummary(data.conversation!)));
      } else {
        await refreshAfterMutation(selectedConversationId);
      }
      toast.success("Đã lưu workflow.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu workflow.");
    } finally {
      setIsSavingMeta(false);
    }
  }

  async function handleUpdateConversationState(item: ChatConversationSummary, patch: {
    isPinned?: boolean;
    userPriority?: ChatConversationUserPriority;
    isHidden?: boolean;
    markUnread?: boolean;
  }) {
    setOpenConversationMenuId("");

    if (patch.isHidden) {
      const confirmed = window.confirm("Xóa cuộc trò chuyện này khỏi danh sách của bạn?");
      if (!confirmed) return;
    }

    const optimisticItem = {
      ...item,
      isPinned: patch.isPinned ?? item.isPinned,
      userPriority: patch.userPriority ?? item.userPriority,
      isMarkedUnread: patch.markUnread ? true : item.isMarkedUnread,
    };

    setConversations((current) => {
      if (patch.isHidden) {
        return current.filter((conversationItem) => conversationItem.id !== item.id);
      }
      return sortConversationSummaries(
        current.map((conversationItem) => (conversationItem.id === item.id ? optimisticItem : conversationItem))
      );
    });

    if (patch.isHidden && selectedConversationId === item.id) {
      setSelectedConversationId("");
      setConversation(null);
    }

    try {
      const response = await fetch(ROUTES.API.CHAT.CONVERSATION(item.id), {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          isPinned: patch.isPinned,
          userPriority: patch.userPriority,
          isHidden: patch.isHidden,
          markUnread: patch.markUnread,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        conversation?: ChatConversationDetail | null;
      };
      if (!response.ok) {
        throw new Error(data.message ?? "Không thể cập nhật hội thoại.");
      }
      setConversations(await loadConversations());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật hội thoại.");
      setConversations(await loadConversations());
    }
  }

  async function handleCreateSupportRequest(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
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
          mode: "support_request",
          category: supportRequestCategory,
          title: supportRequestTitle.trim(),
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Không thể mở hội thoại hỗ trợ.");
      }
      const data = (await response.json()) as { conversationId: string };
      setCreateDialogOpen(false);
      setSupportRequestCategory(getDefaultSupportRequestCategory(currentUser.role));
      setSupportRequestTitle("");
      await refreshAfterMutation(data.conversationId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể mở hội thoại hỗ trợ.");
    } finally {
      setIsCreating(false);
    }
  }

  function toggleAccount(accountId: string) {
    setSelectedAccountIds((current) =>
      current.includes(accountId) ? current.filter((id) => id !== accountId) : [...current, accountId]
    );
  }

  function toggleMember(accountId: string) {
    setSelectedMemberIds((current) =>
      current.includes(accountId) ? current.filter((id) => id !== accountId) : [...current, accountId]
    );
  }

  function handleJumpToMessage(messageId: string) {
    setPinnedMessagesOpen(false);
    requestAnimationFrame(() => {
      document.getElementById(`chat-message-${messageId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  function renderAttachment(message: ChatMessage) {
    if (!message.attachmentUrl) return null;
    if (message.attachmentKind === "image") {
      return (
        <a href={message.attachmentUrl} target="_blank" rel="noreferrer" className="mt-2 block overflow-hidden rounded-md border">
          <img src={message.attachmentUrl} alt="Attachment" className="max-h-72 w-full object-cover" />
        </a>
      );
    }
    return (
      <a
        href={message.attachmentUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-2 rounded-md border bg-background/70 px-3 py-2 text-xs text-foreground"
      >
        <Paperclip className="h-3.5 w-3.5" />
        Mở tệp đính kèm
      </a>
    );
  }

  const activeTypingNames = conversation?.typingDisplayNames ?? selectedSummary?.typingDisplayNames ?? [];
  const pinnedMessages = useMemo(
    () => (conversation?.messages ?? []).filter((message) => message.isPinned),
    [conversation?.messages]
  );
  const pinnedMessagesPreview = pinnedMessages.at(-1);
  const openConversationMenu = useMemo(
    () => conversations.find((item) => item.id === openConversationMenuId) ?? null,
    [conversations, openConversationMenuId]
  );

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-hidden xl:grid-cols-[380px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-background">
        <div className="shrink-0 border-b p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Hội thoại</h2>
              <p className="text-sm text-muted-foreground">
                {conversations.length} cuộc trao đổi
                {totalUnreadCount > 0 ? ` • ${totalUnreadCount} chưa xem` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`rounded-md border px-2 py-0.5 text-xs ${getRealtimeBadgeClassName(inboxRealtime.status)}`}>
                Inbox {getRealtimeLabel(inboxRealtime.status)}
              </Badge>
              {isAdmin ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label="Thiết lập chung"
                  onClick={() => setGeneralSettingsDialogOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              ) : null}
              <Button
                type="button"
                size="icon-sm"
                variant="outline"
                aria-label={isAdmin ? "Tạo hội thoại" : "Tạo yêu cầu hỗ trợ"}
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={sidebarSearch}
                onChange={(event) => setSidebarSearch(event.target.value)}
                className="pl-9"
                placeholder="Tìm hội thoại, tag, owner..."
              />
            </div>
            {isAdmin ? (
              <select
                value={sidebarFilter}
                onChange={(event) => setSidebarFilter(event.target.value as typeof sidebarFilter)}
                className="h-10 rounded-lg border bg-background px-3 text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="unread">Chưa xem</option>
                <option value="mine">Của tôi</option>
                <option value="active">Đang hoạt động</option>
                <option value="resolved">Đã xử lý</option>
                <option value="closed">Đã đóng</option>
              </select>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Không có hội thoại phù hợp.</div>
          ) : (
            filteredConversations.map((item) => (
              (() => {
                const hasUnreadSignal = item.unreadCount > 0 || item.isMarkedUnread;
                const displayTitle = getConversationDisplayTitle(item, currentUser.id, isAdmin);
                return (
              <div
                key={item.id}
                className={`grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 border-b p-3 transition-colors hover:bg-muted/60 ${
                  item.id === selectedConversationId ? "bg-muted" : "bg-background"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedConversationId(item.id);
                    setOpenConversationMenuId("");
                  }}
                  className="min-w-0 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5">
                      {item.isPinned ? <Pin className="h-3.5 w-3.5 shrink-0 text-amber-600" /> : null}
                      {item.userPriority !== "none" ? (
                        <Flag className={`h-3.5 w-3.5 shrink-0 ${getPriorityClassName(item.userPriority).split(" ").at(-1) ?? ""}`} />
                      ) : null}
                      {item.isMarkedUnread && item.unreadCount === 0 ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Chưa xem" />
                      ) : null}
                      <p className={`truncate font-medium ${hasUnreadSignal ? "text-foreground" : ""}`}>{displayTitle}</p>
                    </div>
                    <p className={`mt-1 line-clamp-2 text-sm ${hasUnreadSignal ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                      {item.typingDisplayNames.length > 0
                        ? `${item.typingDisplayNames.join(", ")} đang nhập...`
                        : getMessagePreview(item.lastMessage)}
                    </p>
                  </div>
                </button>
                <div className="flex shrink-0 flex-col items-end gap-0 pt-0.5">
                  <span className="text-[11px] leading-4 text-muted-foreground">{formatSidebarTime(item.lastMessage?.createdAt ?? item.updatedAt)}</span>
                  <div className="flex h-5 items-center gap-1">
                    {item.unreadCount > 0 ? (
                      <Badge className="rounded-md bg-primary px-1.5 py-0 text-[10px] leading-4 text-primary-foreground">
                        {item.unreadCount > 99 ? "99+" : item.unreadCount}
                      </Badge>
                    ) : null}
                    <button
                      type="button"
                      aria-label="Tùy chọn hội thoại"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenConversationMenuId((current) => (current === item.id ? "" : item.id));
                      }}
                      className="inline-flex h-5 w-6 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
                );
              })()
            ))
          )}
        </div>
      </aside>

      <section className="min-h-0 min-w-0 overflow-hidden">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border bg-background">
          <header className="shrink-0 border-b p-4">
            {currentConversation ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">
                      {getConversationDisplayTitle(currentConversation, currentUser.id, isAdmin)}
                    </h2>
                    <Badge className="rounded-md border px-2 py-1 text-xs">
                      {getConversationLabel(currentConversation)}
                    </Badge>
                    <Badge className={`rounded-md border px-2 py-1 text-xs ${getRealtimeBadgeClassName(conversationRealtime.status)}`}>
                      Chat {getRealtimeLabel(conversationRealtime.status)}
                    </Badge>
                    <Badge className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700">
                      {getConversationStatusLabel(currentConversation.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentParticipants.map((participant) => participant.displayName || participant.username).join(", ")}
                  </p>
                  {activeTypingNames.length > 0 ? (
                    <p className="mt-1 text-xs text-emerald-700">{activeTypingNames.join(", ")} đang nhập...</p>
                  ) : null}
                </div>
                {isAdmin ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    aria-label="Cài đặt hội thoại"
                    onClick={() => setSettingsDialogOpen(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold">Chọn một hội thoại</h2>
                <p className="text-sm text-muted-foreground">Tin nhắn realtime sẽ hiển thị tại đây.</p>
              </div>
            )}
          </header>

          {pinnedMessages.length > 0 ? (
            <div className="shrink-0 overflow-hidden border-b bg-background/95">
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-xs hover:bg-muted/60"
                onClick={() => setPinnedMessagesOpen((current) => !current)}
              >
                <Pin className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                <span className="shrink-0 font-medium">Tin đã ghim ({pinnedMessages.length})</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">
                  {pinnedMessagesPreview?.body || (pinnedMessagesPreview?.attachmentUrl ? "Tin nhắn đính kèm" : "Bấm để xem chi tiết")}
                </span>
              </button>
              {pinnedMessagesOpen ? (
                <div className="border-t bg-background p-2">
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {pinnedMessages.map((message) => (
                      <button
                        key={message.id}
                        type="button"
                        className="w-full rounded-md border bg-muted/30 px-3 py-2 text-left text-xs hover:bg-muted"
                        onClick={() => handleJumpToMessage(message.id)}
                      >
                        <span className="block truncate font-medium">{message.senderDisplayName}</span>
                        <span className="mt-1 line-clamp-2 text-muted-foreground">
                          {message.body || (message.attachmentUrl ? "Tin nhắn đính kèm" : "Tin nhắn")}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div ref={messagesContainerRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
            {!conversation ? (
              <div className="flex h-full min-h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Chưa có nội dung hội thoại.
              </div>
            ) : conversation.messages.length === 0 ? (
              <div className="flex h-full min-h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                Hãy gửi tin nhắn đầu tiên.
              </div>
            ) : (
              <>
                {conversation.messages.map((message, index) => {
                const ownMessage = message.senderUserId === currentUser.id;
                const canDeleteMessage = isAdmin || ownMessage;
                const isLastMessage = index === conversation.messages.length - 1;
                const seenByViewers =
                  ownMessage && isLastMessage && conversation.lastSeenByDisplayNames.length > 0
                    ? conversation.lastSeenByDisplayNames
                    : [];
                const senderParticipant = currentParticipants.find((participant) => participant.id === message.senderUserId);
                const showSenderName = isAdmin && senderParticipant?.role === USER_ROLES.ADMIN;
                const replySenderParticipant = message.replyTo
                  ? currentParticipants.find((participant) => participant.id === message.replyTo?.senderUserId)
                  : null;
                const showReplySenderName = isAdmin && replySenderParticipant?.role === USER_ROLES.ADMIN;
                return (
                  <div id={`chat-message-${message.id}`} key={message.id} className={`scroll-mt-24 flex ${ownMessage ? "justify-end" : "justify-start"}`}>
                    <div className={`flex w-full flex-col ${ownMessage ? "items-end" : "items-start"}`}>
                      {message.isPinned || showSenderName ? (
                        <div className={`mb-1 flex max-w-[82%] flex-col gap-1 px-1 ${ownMessage ? "items-end" : "items-start"}`}>
                          {message.isPinned ? (
                            <Badge className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-amber-300 bg-amber-50 px-2 py-0 text-[10px] leading-4 text-amber-700">
                              <Pin className="h-3 w-3 shrink-0" />
                              Đã ghim
                            </Badge>
                          ) : null}
                          {showSenderName ? (
                            <p className="text-xs font-medium text-muted-foreground">
                              {message.visibility === "internal" ? "Ghi chú nội bộ" : message.senderDisplayName}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                      <div className={`flex max-w-[82%] items-end gap-1.5 ${ownMessage ? "flex-row-reverse" : ""}`}>
                        <div
                          className={`min-w-0 rounded-lg border px-3 py-2 text-sm ${
                            ownMessage ? "bg-primary text-primary-foreground" : "bg-muted/60"
                          }`}
                        >
                          {message.replyTo ? (
                            <div
                              className={`mb-2 rounded-md border px-2 py-1 text-xs ${
                                ownMessage ? "border-primary-foreground/30 bg-primary-foreground/10" : "bg-background/60"
                              }`}
                            >
                              {showReplySenderName ? <p className="font-medium">{message.replyTo.senderDisplayName}</p> : null}
                              <p className="line-clamp-2 whitespace-pre-wrap break-words">{message.replyTo.body || "Tin nhắn đính kèm"}</p>
                            </div>
                          ) : null}
                          {message.visibility === "internal" ? (
                            <div className={`mb-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] ${ownMessage ? "bg-primary-foreground/10" : "bg-amber-100 text-amber-800"}`}>
                              <StickyNote className="h-3 w-3" />
                              Chỉ admin thấy
                            </div>
                          ) : null}
                          {message.body ? <p className="whitespace-pre-wrap break-words">{message.body}</p> : null}
                          {renderAttachment(message)}
                        </div>
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            aria-label="Tùy chọn tin nhắn"
                            onClick={() => setOpenMessageMenuId((current) => (current === message.id ? "" : message.id))}
                            className="inline-flex h-5 w-6 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                          {openMessageMenuId === message.id ? (
                            <>
                              <button
                                type="button"
                                aria-label="Đóng tùy chọn tin nhắn"
                                className="fixed inset-0 z-20 cursor-default"
                                onClick={() => setOpenMessageMenuId("")}
                              />
                              <div className={`absolute bottom-6 z-30 w-60 rounded-md border bg-background p-1 text-foreground shadow-lg ${ownMessage ? "right-0" : "left-0"}`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyTarget(message);
                                    setOpenMessageMenuId("");
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-muted"
                                >
                                  <Reply className="h-3.5 w-3.5" />
                                  Trả lời
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleUpdateMessageState(message, { isPinned: !message.isPinned })}
                                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs hover:bg-muted"
                                >
                                  <Pin className="h-3.5 w-3.5" />
                                  {message.isPinned ? "Bỏ ghim tin nhắn" : "Ghim tin nhắn"}
                                </button>
                                {canDeleteMessage ? (
                                  <>
                                    <div className="my-1 border-t" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenMessageMenuId("");
                                        void handleDeleteMessage(message.id);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Xóa tin nhắn
                                    </button>
                                  </>
                                ) : null}
                              </div>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className={`mt-1 flex px-1 text-[11px] text-muted-foreground ${ownMessage ? "justify-end" : "justify-start"}`}>
                        <span>{formatTime(message.createdAt)}</span>
                      </div>
                      {seenByViewers.length > 0 ? (
                        <div className="mt-1 flex justify-end">
                          <div className="flex items-center gap-2 rounded-full border bg-background/90 px-2 py-1 text-[11px] text-muted-foreground shadow-sm">
                            <div className="flex -space-x-2">
                              {seenByViewers.map((viewer) => (
                                <span
                                  key={viewer}
                                  title={viewer}
                                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-background bg-muted text-[9px] font-medium text-foreground"
                                >
                                  {getViewerBadgeLabel(viewer)}
                                </span>
                              ))}
                            </div>
                            <span>Đã xem</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          <ChatComposer
            onSubmit={handleSend}
            replyTarget={replyTarget}
            onReplyClear={() => setReplyTarget(null)}
            attachmentUrl={attachmentUrl}
            onAttachmentClear={() => setAttachmentUrl("")}
            banner={
              messageVisibility === "internal" ? (
                <div className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <StickyNote className="h-3.5 w-3.5" />
                  Đang ở chế độ ghi chú nội bộ
                </div>
              ) : null
            }
            messageBody={messageBody}
            onMessageChange={setMessageBody}
            onMessageKeyDown={handleMessageKeyDown}
            placeholder={messageVisibility === "internal" ? "Nhập ghi chú nội bộ..." : "Nhập tin nhắn..."}
            disabled={!selectedConversationId || isSending}
            sendDisabled={!selectedConversationId || (!messageBody.trim() && !attachmentUrl) || isSending}
            actions={
              <>
                {isAdmin ? (
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 px-3"
                      onClick={() => {
                        setQuickRepliesOpen((current) => !current);
                        setComposerActionsOpen(false);
                      }}
                      disabled={!selectedConversationId}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                    {quickRepliesOpen ? (
                      <div className="absolute bottom-14 right-0 z-20 w-[36rem] max-w-[calc(100vw-2rem)] rounded-lg border bg-background p-2 shadow-lg">
                        <div className="space-y-1">
                          <p className="px-3 py-1 text-[11px] font-medium uppercase text-muted-foreground">
                            Mẫu sẵn
                          </p>
                          {quickReplies.map((reply) => (
                            <button
                              key={reply}
                              type="button"
                              className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                              onClick={() => {
                                setMessageBody(reply);
                                setQuickRepliesOpen(false);
                              }}
                            >
                              <Tag className="mt-0.5 h-4 w-4 shrink-0" />
                              <span className="whitespace-normal break-words">{reply}</span>
                            </button>
                          ))}
                          <div className="border-t pt-2">
                            <button
                              type="button"
                              className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                              onClick={() => {
                                setGeneralSettingsDialogOpen(true);
                                setGeneralSettingsSection("quickReplies");
                                setQuickRepliesOpen(false);
                              }}
                            >
                              Mở cài đặt chung
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-3"
                    onClick={() => {
                      setComposerActionsOpen((current) => !current);
                      setQuickRepliesOpen(false);
                    }}
                    disabled={!selectedConversationId}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {composerActionsOpen ? (
                    <div className="absolute bottom-14 right-0 z-20 w-72 rounded-lg border bg-background p-2 shadow-lg">
                      <div className="space-y-1">
                        <p className="px-3 py-1 text-[11px] font-medium uppercase text-muted-foreground">
                          Tuỳ chọn
                        </p>
                        <div className="rounded-md p-1">
                          <MediaSelector
                            compact
                            value={attachmentUrl}
                            onChange={(next) => {
                              setAttachmentUrl(next);
                              setComposerActionsOpen(false);
                            }}
                          />
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => {
                              setMessageVisibility((current) => (current === "internal" ? "all" : "internal"));
                              setComposerActionsOpen(false);
                            }}
                          >
                            <StickyNote className="h-4 w-4" />
                            {messageVisibility === "internal" ? "Chuyển sang tin nhắn thường" : "Ghi chú nội bộ"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            }
          />
        </div>
      </section>

      {openConversationMenu ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4" onClick={() => setOpenConversationMenuId("")}>
          <div
            className="w-full max-w-sm overflow-hidden rounded-lg border bg-background text-left text-foreground shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b px-4 py-3">
              <p className="truncate text-sm font-medium">
                {getConversationDisplayTitle(openConversationMenu, currentUser.id, isAdmin)}
              </p>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{getMessagePreview(openConversationMenu.lastMessage)}</p>
            </div>
            <div className="max-h-[min(70vh,32rem)] overflow-y-auto p-1">
              <button
                type="button"
                onClick={() => void handleUpdateConversationState(openConversationMenu, { isPinned: !openConversationMenu.isPinned })}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <Pin className="h-4 w-4" />
                {openConversationMenu.isPinned ? "Bỏ ghim hội thoại" : "Ghim lên đầu"}
              </button>
              <button
                type="button"
                onClick={() => void handleUpdateConversationState(openConversationMenu, { markUnread: true })}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <MessageCircle className="h-4 w-4" />
                Đánh dấu chưa xem
              </button>
              <div className="my-1 border-t" />
              <p className="px-3 py-1 text-[10px] font-medium uppercase text-muted-foreground">Mức ưu tiên</p>
              {(["none", "low", "normal", "high", "urgent"] as ChatConversationUserPriority[]).map((priority) => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => void handleUpdateConversationState(openConversationMenu, { userPriority: priority })}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    {getPriorityLabel(priority)}
                  </span>
                  {openConversationMenu.userPriority === priority ? <span>✓</span> : null}
                </button>
              ))}
              <div className="my-1 border-t" />
              <div className="space-y-1 px-3 py-2 text-xs text-muted-foreground">
                <p>Loại: {getConversationLabel(openConversationMenu)}</p>
                <p>Trạng thái: {getConversationStatusLabel(openConversationMenu.status)}</p>
                <p>Owner: {openConversationMenu.ownerDisplayName || "Chưa giao"}</p>
                {openConversationMenu.tags.length > 0 ? <p>Tags: #{openConversationMenu.tags.join(" #")}</p> : null}
                {openConversationMenu.isLegacy ? <p>Legacy</p> : null}
              </div>
              <div className="my-1 border-t" />
              <button
                type="button"
                onClick={() => void handleUpdateConversationState(openConversationMenu, { isHidden: true })}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Xóa khỏi danh sách
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!isAdmin ? (
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo yêu cầu hỗ trợ mới</DialogTitle>
              <DialogDescription>Chọn đúng loại trao đổi để đội ngũ xử lý rõ ràng hơn.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateSupportRequest} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {SUPPORT_REQUEST_OPTIONS.map((option) => {
                  const active = option.value === supportRequestCategory;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSupportRequestCategory(option.value)}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        active ? "border-primary bg-primary/5" : "hover:bg-muted/60"
                      }`}
                    >
                      <p className="font-medium">{option.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tiêu đề hiển thị</label>
                <Input
                  value={supportRequestTitle}
                  onChange={(event) => setSupportRequestTitle(event.target.value)}
                  placeholder="Để trống nếu muốn hệ thống tự đặt tên"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isCreating}>
                  <MessageCircle className="h-4 w-4" />
                  {isCreating ? "Đang tạo..." : "Tạo yêu cầu"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {isAdmin ? (
        <>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo hội thoại</DialogTitle>
                <DialogDescription>Chọn account để tạo direct chat hoặc group chat.</DialogDescription>
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
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle>Cài đặt hội thoại</DialogTitle>
                <DialogDescription>Quản lý thông tin, workflow, thành viên và trạng thái realtime.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
                  {[
                    { id: "overview", label: "Hội thoại" },
                    { id: "members", label: "Thành viên" },
                    { id: "workflow", label: "Xử lý" },
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

                <div className="min-h-[420px] rounded-lg border p-4">
                  {settingsSection === "overview" ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Tên hội thoại</p>
                          <p className="mt-1 font-medium">{currentConversation?.title ?? "Chưa chọn"}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Loại</p>
                          <p className="mt-1 font-medium">{currentConversation ? getConversationLabel(currentConversation) : "Chưa chọn"}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Owner</p>
                          <p className="mt-1 font-medium">{currentConversation?.ownerDisplayName || "Chưa giao"}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Tags</p>
                          <p className="mt-1 font-medium">{currentConversation?.tags.join(", ") || "Chưa có tag"}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {settingsSection === "members" ? (
                    <div className="space-y-4">
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

                        <Button type="submit" className="w-full" disabled={isCreating || !selectedConversationId || selectedMemberIds.length === 0}>
                          <Plus className="h-4 w-4" />
                          {isCreating ? "Đang thêm..." : "Thêm thành viên"}
                        </Button>
                      </form>
                    </div>
                  ) : null}

                  {settingsSection === "workflow" ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Owner</label>
                          <select
                            value={ownerUserId}
                            onChange={(event) => setOwnerUserId(event.target.value)}
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                          >
                            <option value="">Chưa giao</option>
                            {currentParticipants.map((participant) => (
                              <option key={participant.id} value={participant.id}>
                                {participant.displayName || participant.username}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Trạng thái</label>
                          <select
                            value={statusValue}
                            onChange={(event) => setStatusValue(event.target.value as ChatConversationStatus)}
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                          >
                            <option value="open">Open</option>
                            <option value="pending">Pending</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tags</label>
                        <Input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="vip, da-coc, can-goi-lai" />
                        <p className="text-xs text-muted-foreground">Ngăn cách tag bằng dấu phẩy.</p>
                      </div>
                      <Button type="button" className="w-full" onClick={handleSaveMeta} disabled={isSavingMeta || !selectedConversationId}>
                        {isSavingMeta ? "Đang lưu..." : "Lưu workflow"}
                      </Button>
                    </div>
                  ) : null}

                  {settingsSection === "realtime" ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Inbox stream</p>
                          <p className="mt-1 font-medium">{getRealtimeLabel(inboxRealtime.status)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Event: chat-inbox.changed</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Khung chat</p>
                          <p className="mt-1 font-medium">{getRealtimeLabel(conversationRealtime.status)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">Event: chat-conversation.changed</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Chưa xem toàn bộ</p>
                          <p className="mt-1 font-medium">{totalUnreadCount}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Typing hiện tại</p>
                          <p className="mt-1 font-medium">{activeTypingNames.join(", ") || "Không có"}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={generalSettingsDialogOpen} onOpenChange={setGeneralSettingsDialogOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Cài đặt chung</DialogTitle>
                <DialogDescription>
                  Các mục trong đây áp dụng cho toàn bộ inbox admin, không gắn với hội thoại đang mở.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
                <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
                  {[
                    { id: "overview", label: "Tổng quan" },
                    { id: "quickReplies", label: "Mẫu sẵn" },
                    { id: "composer", label: "Composer" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGeneralSettingsSection(item.id as typeof generalSettingsSection)}
                      className={`shrink-0 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        generalSettingsSection === item.id ? "bg-muted font-medium" : "hover:bg-muted/70"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>

                <div className="min-h-[420px] rounded-lg border p-4">
                  {generalSettingsSection === "overview" ? (
                    <div className="space-y-4">
                      <div className="rounded-md border p-3">
                        <p className="text-xs uppercase text-muted-foreground">Phạm vi</p>
                        <p className="mt-1 text-sm">
                          Cài đặt chung áp dụng cho toàn bộ inbox admin, không gắn với hội thoại đang mở.
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Mẫu sẵn hiện có</p>
                          <p className="mt-1 font-medium">{quickReplies.length}</p>
                        </div>
                        <div className="rounded-md border p-3">
                          <p className="text-xs uppercase text-muted-foreground">Composer chung</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Khung sẵn để thêm các cấu hình chung cho form chat ở các bước tiếp theo.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {generalSettingsSection === "quickReplies" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mẫu trả lời nhanh</label>
                        <textarea
                          value={quickRepliesInput}
                          onChange={(event) => setQuickRepliesInput(event.target.value)}
                          className="min-h-72 w-full resize-y rounded-md border bg-background px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Mỗi dòng là một mẫu sẵn"
                        />
                        <p className="text-xs text-muted-foreground">
                          Mỗi dòng là một mẫu trả lời nhanh. Các mục này sẽ xuất hiện ở nút `Mẫu sẵn`.
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleResetQuickReplies}>
                          Khôi phục mặc định
                        </Button>
                        <Button type="button" onClick={handleSaveQuickReplies}>
                          Lưu cài đặt chung
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {generalSettingsSection === "composer" ? (
                    <div className="space-y-4">
                      <div className="rounded-md border p-3">
                        <p className="text-xs uppercase text-muted-foreground">Khung mở rộng</p>
                        <p className="mt-1 text-sm">
                          Mục này được giữ sẵn để thêm các cấu hình chung cho composer như hành vi action menu, mẫu nhập nhanh,
                          hoặc các option hiển thị dùng chung cho toàn bộ inbox.
                        </p>
                      </div>
                      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                        Chưa có thiết lập nào trong mục này.
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
