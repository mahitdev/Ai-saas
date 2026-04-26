"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Brain,
  Camera,
  CameraOff,
  Contact,
  Cpu,
  Command,
  Check,
  CheckCheck,
  ImagePlus,
  Loader2,
  Monitor,
  Mic,
  MicOff,
  Moon,
  MoreHorizontal,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
  Search,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { authClient } from "@/lib/auth.client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type User = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  receipt?: {
    sentAt: string;
    deliveredAt: string | null;
    readAt: string | null;
  } | null;
  attachments?: Array<{ name: string; mimeType: string; url?: string }>;
  reactions?: Array<{ messageId: string; userId: string; emoji: string; createdAt: string }>;
  threadReplies?: Array<{ id: string; messageId: string; userId: string; content: string; createdAt: string }>;
};

type ConversationPayload = {
  conversations: Conversation[];
  memory: string;
};

type ChatPresence = {
  userId: string;
  status: "online" | "away" | "offline";
  lastSeenAt: string;
  typingConversationId: string | null;
  typing: boolean;
  updatedAt: string;
} | null;

type ChatNotification = {
  id: string;
  kind: "message" | "task" | "mention" | "deadline" | "security";
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  conversationId?: string | null;
  messageId?: string | null;
};

type ChatSearchResult = {
  messageId: string;
  conversationId: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
  conversationTitle: string | null;
  highlight: string;
};

type ChatAnalytics = {
  activeUsers: number;
  messageLatencyMs: number;
  sentimentScore: number;
  churnRisk: number;
  presence: ChatPresence;
};

type IntegrationLink = {
  id: string;
  provider: "slack" | "discord" | "github" | "calendar";
  target: string;
  status: "connected" | "pending" | "disabled";
  createdAt: string;
  updatedAt: string;
};

type CallSession = {
  id: string;
  roomName: string;
  mode: "one_to_one" | "group";
  status: "idle" | "ringing" | "active" | "ended";
  screenSharing: boolean;
  recording: boolean;
  participants: string[];
  updatedAt: string;
};

type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionType;
    SpeechRecognition?: new () => SpeechRecognitionType;
  }
}

export function AiChatDashboard({ user }: { user: User }) {
  const { theme, setTheme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [memory, setMemory] = useState("");
  const [input, setInput] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [directVoiceMode, setDirectVoiceMode] = useState(false);
  const [conversationMode, setConversationMode] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<"chatgpt" | "gemini" | "auto">("auto");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [sendLiveFrame, setSendLiveFrame] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<Array<{ name: string; mimeType: string; previewUrl: string; size: number }>>([]);
  const [presence, setPresence] = useState<ChatPresence>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatSearchResult[]>([]);
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);
  const [adminAuditLogs, setAdminAuditLogs] = useState<Array<{ id: string; action: string; targetType: string; targetId: string; detail: string; createdAt: string }>>([]);
  const [integrations, setIntegrations] = useState<IntegrationLink[]>([]);
  const [callSessions, setCallSessions] = useState<CallSession[]>([]);
  const [callRoomName, setCallRoomName] = useState("Design review");
  const [callParticipants, setCallParticipants] = useState("alice@example.com,bob@example.com");
  const [callMode, setCallMode] = useState<"one_to_one" | "group">("one_to_one");
  const [callScreenSharing, setCallScreenSharing] = useState(true);
  const [callRecording, setCallRecording] = useState(false);
  const [reactionDraft, setReactionDraft] = useState<{ messageId: string; emoji: string }>({ messageId: "", emoji: "👍" });
  const [threadDraft, setThreadDraft] = useState<{ messageId: string; content: string }>({ messageId: "", content: "" });
  const [themeAccent, setThemeAccent] = useState("#0ea5e9");
  const [highContrast, setHighContrast] = useState(false);
  const [translationTarget, setTranslationTarget] = useState("es");
  const [suggestedReply, setSuggestedReply] = useState("");
  const [summaryPreview, setSummaryPreview] = useState("");
  const [emotionLabel, setEmotionLabel] = useState("neutral");
  const [offlineDraftStatus, setOfflineDraftStatus] = useState("online");
  const [adaptiveRole, setAdaptiveRole] = useState<"developer" | "manager">(
    /dev|engineer|tech|code/i.test(user.email) ? "developer" : "manager",
  );
  const [detectedIntent, setDetectedIntent] = useState<
    "general_chat" | "budget_analysis" | "developer_ops" | "manager_overview"
  >("general_chat");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const isAdmin = /admin/i.test(user.email) || (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "").split(",").map((item) => item.trim().toLowerCase()).includes(user.email.toLowerCase());

  const initials = useMemo(
    () =>
      user.name
        .split(" ")
        .map((part) => part[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [user.name],
  );
  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );
  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function fetchConversations() {
    setLoadingConversations(true);
    try {
      const response = await fetch("/api/chat/conversations", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load conversations");
      const payload = (await response.json()) as ConversationPayload;
      setConversations(payload.conversations);
      setMemory(payload.memory);
      setActiveConversationId((current) => current ?? payload.conversations[0]?.id ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to fetch conversations");
    } finally {
      setLoadingConversations(false);
    }
  }

  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load messages");
      const payload = (await response.json()) as { messages: Message[] };
      setMessages(payload.messages);
      setTimeout(scrollToBottom, 50);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to fetch messages");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    void fetchConversations();
  }, []);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    void fetchMessages(activeConversationId);
  }, [activeConversationId, fetchMessages]);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/chat/presence", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { presence?: ChatPresence };
      setPresence(payload.presence ?? null);
    })();
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;
    const source = new EventSource("/api/chat/realtime");
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as
          | { type: "snapshot"; presence: ChatPresence; notifications: ChatNotification[]; uploads: unknown[]; auditLogs: unknown[] }
          | { type: "typing"; userId: string; conversationId: string | null; typing: boolean; updatedAt: string }
          | { type: "presence"; presence: ChatPresence }
          | { type: "receipt"; receipt: { messageId: string; sentAt: string; deliveredAt: string | null; readAt: string | null } }
          | { type: "notification"; notification: ChatNotification };
        if (payload.type === "snapshot") {
          setPresence(payload.presence);
          setNotifications(payload.notifications);
          return;
        }
        if (payload.type === "typing") {
          setTypingUser(payload.typing ? payload.userId : null);
          return;
        }
        if (payload.type === "presence") {
          setPresence(payload.presence);
          return;
        }
        if (payload.type === "receipt") {
          setMessages((current) =>
            current.map((message) =>
              message.id === payload.receipt.messageId ? { ...message, receipt: payload.receipt } : message,
            ),
          );
          return;
        }
        if (payload.type === "notification") {
          setNotifications((current) => [payload.notification, ...current]);
          toast(payload.notification.title);
        }
      } catch {
        // ignore malformed realtime frame
      }
    };
    return () => source.close();
  }, [activeConversationId]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;
    const handleFocus = () => void fetch("/api/chat/presence", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "online" }) });
    const handleBlur = () => void fetch("/api/chat/presence", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "away" }) });
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [activeConversationId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      const response = await fetch(
        `/api/chat/search?q=${encodeURIComponent(searchQuery)}${activeConversation ? `&conversationId=${activeConversation.id}` : ""}`,
        { cache: "no-store" },
      );
      if (!response.ok) return;
      const payload = (await response.json()) as { results: ChatSearchResult[] };
      setSearchResults(payload.results ?? []);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchQuery, activeConversation?.id]);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/chat/analytics", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as ChatAnalytics;
      setAnalytics(payload);
    })();
  }, [messages.length, notifications.length, activeConversationId]);

  useEffect(() => {
    const recentText = messages.slice(-8).map((message) => message.content).join("\n");
    if (!recentText.trim()) return;
    void (async () => {
      const [summaryResponse, sentimentResponse, suggestionResponse, translateResponse] = await Promise.all([
        fetch("/api/chat/ai", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode: "summarize", text: recentText }),
        }),
        fetch("/api/chat/ai", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode: "sentiment", text: recentText }),
        }),
        fetch("/api/chat/ai", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode: "suggest", text: input || recentText }),
        }),
        fetch("/api/chat/ai", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode: "translate", text: recentText, targetLanguage: translationTarget }),
        }),
      ]);
      if (summaryResponse.ok) {
        const payload = (await summaryResponse.json()) as { summary?: string };
        setSummaryPreview(payload.summary ?? "");
      }
      if (sentimentResponse.ok) {
        const payload = (await sentimentResponse.json()) as { label?: string };
        setEmotionLabel(payload.label ?? "neutral");
      }
      if (suggestionResponse.ok) {
        const payload = (await suggestionResponse.json()) as { suggestion?: string };
        setSuggestedReply(payload.suggestion ?? "");
      }
      if (translateResponse.ok) {
        const payload = (await translateResponse.json()) as { translation?: string };
        setMemory((current) => `${current}\n${payload.translation ?? ""}`.trim());
      }
    })();
  }, [messages, input, translationTarget]);

  useEffect(() => {
    const savedAccent = window.localStorage.getItem("ai-agent-theme-accent");
    const savedContrast = window.localStorage.getItem("ai-agent-high-contrast");
    if (savedAccent) setThemeAccent(savedAccent);
    if (savedContrast) setHighContrast(savedContrast === "true");
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-accent", themeAccent);
    window.localStorage.setItem("ai-agent-theme-accent", themeAccent);
  }, [themeAccent]);

  useEffect(() => {
    document.documentElement.dataset.highContrast = highContrast ? "true" : "false";
    window.localStorage.setItem("ai-agent-high-contrast", String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    const syncOfflineQueue = async () => {
      if (!navigator.onLine) {
        setOfflineDraftStatus("offline");
        return;
      }
      setOfflineDraftStatus("online");
      const raw = window.localStorage.getItem("ai-agent-offline-queue");
      if (!raw) return;
      try {
        const queue = JSON.parse(raw) as Array<{ messageText: string; imageDataUrl?: string }>;
        if (queue.length === 0) return;
        for (const item of queue) {
          await sendMessageText(item.messageText, item.imageDataUrl);
        }
        window.localStorage.removeItem("ai-agent-offline-queue");
        toast.success("Offline messages synced.");
      } catch {
        // keep queue for later
      }
    };
    void syncOfflineQueue();
    window.addEventListener("online", syncOfflineQueue);
    return () => window.removeEventListener("online", syncOfflineQueue);
  }, [activeConversationId, capturedImage, cameraEnabled, sendLiveFrame, selectedAssistant, conversationMode, directVoiceMode, listening, pendingPreviews]);

  useEffect(() => {
    void (async () => {
      const [integrationsResponse, callsResponse] = await Promise.all([
        fetch("/api/chat/integrations", { cache: "no-store" }),
        fetch("/api/chat/calls", { cache: "no-store" }),
      ]);
      if (integrationsResponse.ok) {
        const integrationsPayload = (await integrationsResponse.json()) as { integrations?: IntegrationLink[] };
        setIntegrations(integrationsPayload.integrations ?? []);
      }
      if (callsResponse.ok) {
        const callsPayload = (await callsResponse.json()) as { calls?: CallSession[] };
        setCallSessions(callsPayload.calls ?? []);
      }
    })();
  }, [activeConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const lower = input.toLowerCase();
    if (/budget|profit|revenue|expense|forecast|roi|cost/.test(lower)) {
      setDetectedIntent("budget_analysis");
      return;
    }
    if (/debug|error|api|deploy|build|code|stack/.test(lower)) {
      setDetectedIntent("developer_ops");
      return;
    }
    if (/roadmap|team|kpi|strategy|quarter|report/.test(lower)) {
      setDetectedIntent("manager_overview");
      return;
    }
    setDetectedIntent("general_chat");
  }, [input]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  async function startCamera() {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not supported in this browser.");
      return;
    }
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCameraEnabled(true);
      setCameraReady(true);
    } catch (error) {
      setCameraEnabled(false);
      setCameraReady(false);
      setCameraError(error instanceof Error ? error.message : "Unable to access camera.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraEnabled(false);
    setCameraReady(false);
  }

  function captureFrame() {
    if (!videoRef.current || !cameraReady) return "";
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 360;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return "";
    context.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.75);
  }

  async function prepareFiles(files: File[]) {
    const nextPreviews = await Promise.all(
      files.map(
        (file) =>
          new Promise<{ name: string; mimeType: string; previewUrl: string; size: number }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                name: file.name,
                mimeType: file.type || "application/octet-stream",
                previewUrl: typeof reader.result === "string" ? reader.result : "",
                size: file.size,
              });
            reader.readAsDataURL(file);
          }),
      ),
    );
    setPendingFiles(files);
    setPendingPreviews(nextPreviews);
  }

  function speak(text: string) {
    return new Promise<void>((resolve) => {
      if (!voiceOutputEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }

  function startListening() {
    if (typeof window === "undefined") return;
    const RecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new RecognitionCtor();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognitionRef.current = recognition;
    }

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      if (transcript) {
        if (directVoiceMode) {
          void sendMessageText(transcript.trim());
        } else {
          setInput((previous) => `${previous} ${transcript}`.trim());
        }
      }
      setListening(false);
    };
    recognitionRef.current.onerror = () => {
      setListening(false);
    };

    recognitionRef.current.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function sendMessageText(messageText: string, explicitImageDataUrl?: string) {
    if (!messageText.trim() || sending) return;
    setSending(true);
    const imageDataUrl = explicitImageDataUrl || (cameraEnabled && sendLiveFrame ? captureFrame() : "");

    try {
      const attachments = pendingPreviews.map((item) => ({
        name: item.name,
        mimeType: item.mimeType,
        size: item.size,
        url: item.previewUrl,
      }));
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId ?? undefined,
          message: messageText,
          assistant: selectedAssistant,
          imageDataUrl: imageDataUrl || undefined,
          attachments: attachments.length ? attachments : undefined,
        }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      const payload = (await response.json()) as {
        conversationId: string;
        userMessage: Message;
        assistantMessage: Message;
        memorySummary: string;
        onboardingAha?: string | null;
        receipts?: {
          user: { sentAt: string; deliveredAt: string | null; readAt: string | null };
          assistant: { sentAt: string; deliveredAt: string | null; readAt: string | null };
        };
      };

      if (!activeConversationId) {
        await fetchConversations();
      }
      setActiveConversationId(payload.conversationId);
      const attachmentSummary = pendingPreviews.map((item) => ({
        name: item.name,
        mimeType: item.mimeType,
        url: item.previewUrl,
      }));
      setMessages((previous) => [
        ...previous,
        { ...payload.userMessage, attachments: attachmentSummary },
        payload.assistantMessage,
      ]);
      setMemory(payload.memorySummary);
      if (payload.receipts) {
        if (payload.receipts.user) {
          setMessages((current) =>
            current.map((message) => (message.id === payload.userMessage.id ? { ...message, receipt: payload.receipts!.user } : message)),
          );
        }
        if (payload.receipts.assistant) {
          setMessages((current) =>
            current.map((message) =>
              message.id === payload.assistantMessage.id ? { ...message, receipt: payload.receipts!.assistant } : message,
            ),
          );
        }
      }
      if (payload.onboardingAha) {
        toast.success(payload.onboardingAha);
      }
      await speak(payload.assistantMessage.content);
      setPendingFiles([]);
      setPendingPreviews([]);
      if (conversationMode && directVoiceMode && !listening) {
        startListening();
      }
    } catch (error) {
      if (!navigator.onLine) {
        const existingQueue = JSON.parse(window.localStorage.getItem("ai-agent-offline-queue") || "[]") as Array<{ messageText: string; imageDataUrl?: string }>;
        existingQueue.push({ messageText, imageDataUrl: imageDataUrl || undefined });
        window.localStorage.setItem("ai-agent-offline-queue", JSON.stringify(existingQueue));
        setOfflineDraftStatus("queued");
        toast.info("You're offline. Message queued for sync.");
        return;
      }
      toast.error(error instanceof Error ? error.message : "Unable to send message");
    } finally {
      setSending(false);
    }
  }

  function toggleListening() {
    if (listening) {
      stopListening();
      return;
    }
    startListening();
  }

  async function createConversation() {
    try {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      if (!response.ok) throw new Error("Failed to create chat");
      const payload = (await response.json()) as { conversation: Conversation };
      setConversations((previous) => [payload.conversation, ...previous]);
      setActiveConversationId(payload.conversation.id);
      setMessages([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create chat");
    }
  }

  async function deleteConversation(conversationId: string) {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete conversation");
      setConversations((previous) => previous.filter((conversation) => conversation.id !== conversationId));
      setActiveConversationId((current) => {
        if (current !== conversationId) return current;
        return conversations.find((conversation) => conversation.id !== conversationId)?.id ?? null;
      });
      toast.success("Conversation deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete conversation");
    }
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const messageText = input.trim();
    const imageToSend = capturedImage ?? undefined;
    setInput("");
    setCapturedImage(null);
    await sendMessageText(messageText, imageToSend);
  }

  async function uploadFile(file: File) {
    const response = await fetch("/api/chat/uploads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        previewUrl: await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.readAsDataURL(file);
        }),
      }),
    });
    if (!response.ok) throw new Error("Upload failed");
    return (await response.json()) as { upload: { name: string; mimeType: string; previewUrl: string; shareUrl: string; expiresAt: string } };
  }

  async function handleFileDrop(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    try {
      await prepareFiles(list);
      for (const file of list) {
        await uploadFile(file);
      }
      toast.success("Files attached and staged for chat sharing.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to stage files");
    }
  }

  async function addMessageReaction(messageId: string, emoji: string) {
    const response = await fetch("/api/chat/reactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messageId, emoji }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { reaction: { messageId: string; userId: string; emoji: string; createdAt: string } };
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, reactions: [...(message.reactions ?? []), payload.reaction] }
          : message,
      ),
    );
  }

  async function sendThreadReply() {
    if (!threadDraft.messageId || !threadDraft.content.trim()) return;
    const response = await fetch("/api/chat/threads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(threadDraft),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { reply: { id: string; messageId: string; userId: string; content: string; createdAt: string } };
    setMessages((current) =>
      current.map((message) =>
        message.id === threadDraft.messageId
          ? { ...message, threadReplies: [...(message.threadReplies ?? []), payload.reply] }
          : message,
      ),
    );
    setThreadDraft({ messageId: "", content: "" });
  }

  function openThreadComposer(messageId: string) {
    setThreadDraft((current) => ({
      messageId,
      content: current.messageId === messageId ? current.content : "",
    }));
  }

  async function connectIntegration(provider: IntegrationLink["provider"]) {
    const response = await fetch("/api/chat/integrations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider, target: user.email }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { integration?: IntegrationLink };
    if (payload.integration) {
      setIntegrations((current) => [payload.integration!, ...current.filter((item) => item.provider !== provider)]);
      toast.success(`${provider} connected.`);
    }
  }

  async function startCallRoom() {
    const response = await fetch("/api/chat/calls", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        roomName: callRoomName,
        mode: callMode,
        screenSharing: callScreenSharing,
        recording: callRecording,
        participants: callParticipants.split(",").map((item) => item.trim()).filter(Boolean),
        status: "ringing",
      }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { call?: CallSession };
    if (payload.call) {
      setCallSessions((current) => [payload.call!, ...current]);
      toast.success("Call room created.");
    }
  }

  async function updateCallRoom(callId: string, status: CallSession["status"]) {
    await fetch("/api/chat/calls", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callId, status }),
    });
    setCallSessions((current) => current.map((call) => (call.id === callId ? { ...call, status } : call)));
  }

  async function askAIHelp(mode: "summarize" | "sentiment" | "suggest" | "translate") {
    const text = messages.slice(-8).map((message) => message.content).join("\n");
    if (!text.trim()) return;
    const response = await fetch("/api/chat/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode, text, targetLanguage: translationTarget }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as Record<string, string>;
    if (payload.summary) setSummaryPreview(payload.summary);
    if (payload.label) setEmotionLabel(payload.label);
    if (payload.suggestion) setSuggestedReply(payload.suggestion);
    if (payload.translation) toast.success(payload.translation);
  }

  function markTyping(nextValue: string) {
    setInput(nextValue);
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }
    void fetch("/api/chat/typing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversationId: activeConversationId ?? null, typing: Boolean(nextValue.trim()) }),
    });
    typingTimerRef.current = window.setTimeout(() => {
      void fetch("/api/chat/typing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId: activeConversationId ?? null, typing: false }),
      });
    }, 600);
  }

  async function explainAssistantMessage(message: Message) {
    if (message.role !== "assistant") return;
    const sourceLinks = activeConversation ? [`Conversation:${activeConversation.id}`] : ["Conversation:unknown"];
    const response = await fetch("/api/trust/xai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        taskId: message.id,
        question: "Why this answer?",
        answer: message.content,
        reasoning: "Response was generated from recent chat history, memory summary, and active model routing strategy.",
        sources: sourceLinks,
        complianceFlags: [],
        modelVersion: selectedAssistant === "auto" ? "auto-routed" : selectedAssistant,
      }),
    });
    if (response.ok) {
      toast.success("Explainable log saved. Check Growth & Trust page.");
      return;
    }
    toast.error("Unable to generate explanation log.");
  }

  return (
    <main className="min-h-svh bg-neutral-50 p-4 text-zinc-950 md:p-6">
      <div className="mx-auto grid w-full max-w-[1700px] gap-6 lg:grid-cols-[360px_minmax(0,1fr)] xl:gap-8">
        <Card className="h-fit border-zinc-200 bg-white/90 text-zinc-950 shadow-sm backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback>{initials || "U"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.name}</p>
                  <p className="truncate text-sm text-zinc-500">{user.email}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-zinc-600 hover:bg-zinc-100"
                    aria-label="Workspace settings"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 border-zinc-200 bg-white">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 size-4" />
                    Light theme
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 size-4" />
                    Dark theme
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="mr-2 size-4" />
                    System theme
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked={voiceOutputEnabled} onCheckedChange={(checked) => setVoiceOutputEnabled(Boolean(checked))}>
                    <Volume2 className="mr-2 size-4" />
                    Voice output
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={directVoiceMode} onCheckedChange={(checked) => setDirectVoiceMode(Boolean(checked))}>
                    <Mic className="mr-2 size-4" />
                    Direct voice
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={conversationMode}
                    onCheckedChange={(checked) => {
                      const next = Boolean(checked);
                      setConversationMode(next);
                      if (!next) {
                        stopListening();
                      } else if (directVoiceMode && !listening) {
                        startListening();
                      }
                    }}
                  >
                    <Sparkles className="mr-2 size-4" />
                    One-to-one mode
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={selectedAssistant} onValueChange={(value) => setSelectedAssistant(value as typeof selectedAssistant)}>
                    <DropdownMenuRadioItem value="auto">Auto model</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="chatgpt">ChatGPT</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="gemini">Gemini</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.dispatchEvent(new Event("open-global-command-bar"))}>
                    <Command className="mr-2 size-4" />
                    Open command bar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription className="text-zinc-500">
              Calm workspace for chat, memory, voice, and task capture.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full rounded-2xl bg-zinc-950 text-white shadow-sm hover:bg-zinc-800" onClick={() => void createConversation()}>
              <Plus className="mr-2 size-4" />
              New Chat
            </Button>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
              <ScrollArea className="h-[24rem]">
                <div className="space-y-2">
                  {loadingConversations ? (
                    <p className="px-2 py-1 text-sm text-zinc-500">Loading chats...</p>
                  ) : conversations.length === 0 ? (
                    <p className="px-2 py-1 text-sm text-zinc-500">No chats yet.</p>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`flex items-center gap-2 rounded-2xl border p-2 ${
                          conversation.id === activeConversationId
                            ? "border-zinc-900 bg-zinc-950 text-white"
                            : "border-zinc-200 bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => setActiveConversationId(conversation.id)}
                        >
                          <p className="truncate text-sm font-medium">{conversation.title}</p>
                          <p className={`text-xs ${conversation.id === activeConversationId ? "text-zinc-300" : "text-zinc-500"}`}>
                            {new Date(conversation.updatedAt).toLocaleString()}
                          </p>
                        </button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={conversation.id === activeConversationId ? "text-white hover:bg-zinc-800" : "text-zinc-500 hover:bg-zinc-100"}
                          onClick={() => void deleteConversation(conversation.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-3 text-xs text-zinc-600">
              <p className="font-semibold uppercase tracking-wide text-zinc-400">Workspace at a glance</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                  Messages: {messages.length}
                </Badge>
                <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                  Memory: {memory ? `${memory.split("\n").length} notes` : "empty"}
                </Badge>
                <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                  Intent: {detectedIntent.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                  Presence: {presence?.status ?? "offline"}
                </Badge>
                <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                  Sync: {offlineDraftStatus}
                </Badge>
                <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                  Role: {adaptiveRole}
                </Badge>
                <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                  Latency: {analytics?.messageLatencyMs ?? 0}ms
                </Badge>
                <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                  Sentiment: {analytics?.sentimentScore ?? 0}
                </Badge>
                <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                  Churn risk: {analytics?.churnRisk ?? 0}
                </Badge>
                {typingUser ? (
                  <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                    User is typing...
                  </Badge>
                ) : null}
              </div>
              <div className="space-y-2">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search messages..."
                  className="border-zinc-200 bg-white text-zinc-950 placeholder:text-zinc-400"
                />
                {searchResults.length > 0 ? (
                  <div className="max-h-40 space-y-2 overflow-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-2">
                    {searchResults.map((result) => (
                      <div key={result.messageId} className="rounded-xl border border-zinc-200 bg-white p-2">
                        <p className="text-[11px] uppercase tracking-wide text-zinc-400">{result.conversationTitle ?? "Conversation"}</p>
                        <p className="mt-1 text-sm text-zinc-800">{result.content}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <p className="text-[11px] text-zinc-500">
                Use the menu to switch theme, model, and voice settings without leaving the canvas.
              </p>
              <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Personalization</p>
                <div className="flex flex-wrap gap-2">
                  <input
                    aria-label="Accent color"
                    type="color"
                    value={themeAccent}
                    onChange={(event) => setThemeAccent(event.target.value)}
                    className="h-9 w-14 cursor-pointer rounded-md border border-zinc-200 bg-white"
                  />
                  <Button type="button" variant="outline" className="border-zinc-200 bg-white text-zinc-700" onClick={() => setHighContrast((value) => !value)}>
                    {highContrast ? "High contrast on" : "High contrast off"}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Integrations</p>
                <div className="flex flex-wrap gap-2">
                  {(["slack", "discord", "github", "calendar"] as const).map((provider) => (
                    <Button
                      key={provider}
                      type="button"
                      variant="outline"
                      className="border-zinc-200 bg-white text-zinc-700"
                      onClick={() => void connectIntegration(provider)}
                    >
                      Connect {provider}
                    </Button>
                  ))}
                </div>
                <div className="space-y-1 text-xs text-zinc-500">
                  {integrations.slice(0, 4).map((item) => (
                    <p key={item.id}>
                      {item.provider} · {item.target} · {item.status}
                    </p>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">AI Assist</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="border-zinc-200 bg-white text-zinc-700" onClick={() => void askAIHelp("summarize")}>
                    Summarize
                  </Button>
                  <Button type="button" variant="outline" className="border-zinc-200 bg-white text-zinc-700" onClick={() => void askAIHelp("sentiment")}>
                    Sentiment
                  </Button>
                  <Button type="button" variant="outline" className="border-zinc-200 bg-white text-zinc-700" onClick={() => void askAIHelp("suggest")}>
                    Suggest reply
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={translationTarget}
                    onChange={(event) => setTranslationTarget(event.target.value)}
                    className="border-zinc-200 bg-white text-zinc-950 placeholder:text-zinc-400"
                    placeholder="Translate to (es, fr, hi)"
                  />
                  <Button type="button" variant="outline" className="border-zinc-200 bg-white text-zinc-700" onClick={() => void askAIHelp("translate")}>
                    Translate
                  </Button>
                </div>
                {summaryPreview ? <p className="text-xs text-zinc-500">Summary: {summaryPreview}</p> : null}
                {suggestedReply ? <p className="text-xs text-zinc-500">Suggested reply: {suggestedReply}</p> : null}
                <p className="text-xs text-zinc-500">Emotion: {emotionLabel}</p>
              </div>
              <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Calls</p>
                <Input
                  value={callRoomName}
                  onChange={(event) => setCallRoomName(event.target.value)}
                  className="border-zinc-200 bg-white text-zinc-950 placeholder:text-zinc-400"
                  placeholder="Room name"
                />
                <Input
                  value={callParticipants}
                  onChange={(event) => setCallParticipants(event.target.value)}
                  className="border-zinc-200 bg-white text-zinc-950 placeholder:text-zinc-400"
                  placeholder="Participants, comma separated"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant={callMode === "one_to_one" ? "default" : "outline"} onClick={() => setCallMode("one_to_one")}>
                    1:1
                  </Button>
                  <Button type="button" variant={callMode === "group" ? "default" : "outline"} onClick={() => setCallMode("group")}>
                    Group
                  </Button>
                  <Button type="button" variant="outline" className="border-zinc-200 bg-white text-zinc-700" onClick={() => setCallScreenSharing((value) => !value)}>
                    {callScreenSharing ? "Screen share on" : "Screen share off"}
                  </Button>
                  <Button type="button" variant="outline" className="border-zinc-200 bg-white text-zinc-700" onClick={() => setCallRecording((value) => !value)}>
                    {callRecording ? "Recording on" : "Recording off"}
                  </Button>
                </div>
                <Button type="button" className="bg-zinc-950 text-white hover:bg-zinc-800" onClick={() => void startCallRoom()}>
                  Start call room
                </Button>
                <div className="space-y-2 text-xs text-zinc-500">
                  {callSessions.slice(0, 3).map((call) => (
                    <div key={call.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-2">
                      <p className="font-medium text-zinc-900">{call.roomName}</p>
                      <p>
                        {call.mode} · {call.status} · {call.participants.length} participants
                      </p>
                      <div className="mt-2 flex gap-2">
                        <Button type="button" size="sm" variant="outline" className="border-zinc-200 bg-white text-zinc-700" onClick={() => void updateCallRoom(call.id, "active")}>
                          Join
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="border-zinc-200 bg-white text-zinc-700" onClick={() => void updateCallRoom(call.id, "ended")}>
                          End
                        </Button>
                      </div>
                    </div>
                  ))}
                  {callSessions.length === 0 ? <p>No call rooms yet.</p> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="border-zinc-200 bg-white text-zinc-700" onClick={() => void fetch("/api/chat/presence", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "online" }) })}>
                  Mark online
                </Button>
                <Button type="button" variant="outline" className="border-zinc-200 bg-white text-zinc-700" onClick={() => void fetch("/api/chat/presence", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: "away" }) })}>
                  Mark away
                </Button>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Notifications</p>
                <div className="mt-2 space-y-2">
                  {notifications.slice(0, 3).map((notification) => (
                    <div key={notification.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-2">
                      <p className="text-sm font-medium text-zinc-900">{notification.title}</p>
                      <p className="text-xs text-zinc-500">{notification.body}</p>
                    </div>
                  ))}
                  {notifications.length === 0 ? <p className="text-xs text-zinc-400">No unread alerts.</p> : null}
                </div>
              </div>
            </div>

            {isAdmin ? (
              <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-3 text-xs text-zinc-600">
                <p className="font-semibold uppercase tracking-wide text-zinc-400">Admin moderation</p>
                <Button
                  variant="outline"
                  className="border-zinc-200 bg-white text-zinc-700"
                  onClick={async () => {
                    const response = await fetch("/api/chat/admin", { cache: "no-store" });
                    if (!response.ok) return;
                    const payload = (await response.json()) as { auditLogs?: Array<{ id: string; action: string; targetType: string; targetId: string; detail: string; createdAt: string }> };
                    setAdminAuditLogs(payload.auditLogs ?? []);
                  }}
                >
                  Load audit logs
                </Button>
                <div className="space-y-2">
                  {adminAuditLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-2">
                      <p className="text-sm font-medium text-zinc-900">{log.action}</p>
                      <p className="text-xs text-zinc-500">
                        {log.targetType} · {log.targetId}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <Button
              variant="outline"
              className="w-full rounded-2xl border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              onClick={() =>
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => window.location.assign("/"),
                  },
                })
              }
            >
              Sign out
            </Button>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white/90 text-zinc-950 shadow-sm">
          <CardContent className="flex min-h-[78svh] flex-col gap-4 p-4 md:p-6">
            <div className="min-h-0 flex-1">
              <ScrollArea className="h-full rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                    Start chatting. I will remember context.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm ${
                          message.role === "user"
                            ? "ml-auto border border-zinc-900 bg-zinc-950 text-white"
                            : "border border-zinc-200 bg-white text-zinc-900"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.attachments?.length ? (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment) => (
                              <div key={`${message.id}-${attachment.name}`} className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-[11px]">
                                {attachment.name} · {attachment.mimeType}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500">
                          <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                          {message.role === "user" ? (
                            <span className="inline-flex items-center gap-1">
                              {message.receipt?.readAt ? <CheckCheck className="size-3.5 text-emerald-500" /> : message.receipt?.deliveredAt ? <CheckCheck className="size-3.5 text-zinc-400" /> : <Check className="size-3.5 text-zinc-400" />}
                              {message.receipt?.readAt ? "Read" : message.receipt?.deliveredAt ? "Delivered" : "Sent"}
                            </span>
                          ) : null}
                        </div>
                        {message.role === "assistant" ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                            <button
                              type="button"
                              className="underline decoration-dotted underline-offset-2"
                              onClick={() => void explainAssistantMessage(message)}
                            >
                              Why this answer?
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-600 hover:bg-zinc-50"
                              onClick={() => openThreadComposer(message.id)}
                            >
                              Reply in thread
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-600 hover:bg-zinc-50"
                              onClick={() => void addMessageReaction(message.id, "👍")}
                            >
                              👍
                            </button>
                            <button
                              type="button"
                              className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-600 hover:bg-zinc-50"
                              onClick={() => void addMessageReaction(message.id, "🎯")}
                            >
                              🎯
                            </button>
                          </div>
                        ) : null}
                        {message.reactions?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {message.reactions.map((reaction, index) => (
                              <span
                                key={`${message.id}-${reaction.userId}-${reaction.emoji}-${index}`}
                                className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600"
                              >
                                {reaction.emoji}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {message.threadReplies?.length ? (
                          <div className="mt-2 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
                            {message.threadReplies.map((reply) => (
                              <div key={reply.id} className="rounded-lg bg-white px-2 py-1 text-xs text-zinc-700">
                                {reply.content}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            </div>

            {cameraEnabled ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Face-to-face camera</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={sendLiveFrame ? "default" : "outline"}
                      className={sendLiveFrame ? "bg-zinc-950 text-white" : "border-zinc-200 bg-white text-zinc-700"}
                      onClick={() => setSendLiveFrame((current) => !current)}
                    >
                      Live Frame
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-zinc-200 bg-white text-zinc-700"
                      onClick={() => {
                        const frame = captureFrame();
                        if (frame) {
                          setCapturedImage(frame);
                          toast.success("Frame captured and attached.");
                        }
                      }}
                    >
                      <ImagePlus className="mr-1 size-4" />
                      Capture
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="aspect-video w-full rounded-2xl border border-zinc-200 bg-zinc-100 object-cover"
                  />
                  {capturedImage ? (
                    <div className="relative">
                      <Image
                        src={capturedImage}
                        alt="Captured preview"
                        width={640}
                        height={360}
                        unoptimized
                        className="aspect-video w-full rounded-2xl border border-zinc-200 object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-2 rounded-full border border-zinc-200 bg-white p-1 text-zinc-600 hover:bg-zinc-50"
                        onClick={() => setCapturedImage(null)}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white text-xs text-zinc-500">
                      No manual frame captured yet.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div
              className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void handleFileDrop(event.dataTransfer.files);
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <p>Drag and drop files here for previews and share links.</p>
                <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-700">
                  {pendingFiles.length} file(s)
                </span>
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[11px] text-zinc-700">
                  <ImagePlus className="size-3.5" />
                  Upload
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const files = event.target.files;
                      if (files) {
                        void handleFileDrop(files);
                      }
                    }}
                  />
                </label>
              </div>
              {pendingPreviews.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {pendingPreviews.map((file) => (
                    <span key={`${file.name}-${file.size}`} className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-700">
                      {file.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {threadDraft.messageId ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Thread reply</p>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setThreadDraft({ messageId: "", content: "" })}>
                    Clear
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={threadDraft.content}
                    onChange={(event) => setThreadDraft((current) => ({ ...current, content: event.target.value }))}
                    placeholder="Write a thread reply..."
                    className="border-zinc-200 bg-white text-zinc-950 placeholder:text-zinc-400"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void sendThreadReply();
                      }
                    }}
                  />
                  <Button type="button" className="bg-zinc-950 text-white hover:bg-zinc-800" onClick={() => void sendThreadReply()}>
                    Reply
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(event) => markTyping(event.target.value)}
                placeholder="Ask anything..."
                className="border-zinc-200 bg-white text-zinc-950 placeholder:text-zinc-400"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
              />
              <Button className="bg-zinc-950 text-white hover:bg-zinc-800" onClick={() => void sendMessage()} disabled={sending || !input.trim()}>
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
