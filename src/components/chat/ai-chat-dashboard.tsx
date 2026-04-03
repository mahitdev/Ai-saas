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
  ImagePlus,
  Loader2,
  Monitor,
  Mic,
  MicOff,
  Moon,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { authClient } from "@/lib/auth.client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
};

type ConversationPayload = {
  conversations: Conversation[];
  memory: string;
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
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId ?? undefined,
          message: messageText,
          assistant: selectedAssistant,
          imageDataUrl: imageDataUrl || undefined,
        }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      const payload = (await response.json()) as {
        conversationId: string;
        userMessage: Message;
        assistantMessage: Message;
        memorySummary: string;
        onboardingAha?: string | null;
      };

      if (!activeConversationId) {
        await fetchConversations();
      }
      setActiveConversationId(payload.conversationId);
      setMessages((previous) => [...previous, payload.userMessage, payload.assistantMessage]);
      setMemory(payload.memorySummary);
      if (payload.onboardingAha) {
        toast.success(payload.onboardingAha);
      }
      await speak(payload.assistantMessage.content);
      if (conversationMode && directVoiceMode && !listening) {
        startListening();
      }
    } catch (error) {
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

  async function explainAssistantMessage(message: Message) {
    if (message.role !== "assistant") return;
    const sourceLinks = activeConversation ? [`Conversation:${activeConversation.id}`] : ["Conversation:unknown"];
    const response = await fetch("/api/trust/xai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        taskId: message.id,
        question: "Why did I say this?",
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
    <main className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.2),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto grid w-full max-w-[1700px] gap-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:gap-8">
        <Card className="h-fit border-slate-700/70 bg-slate-950/80 text-slate-100 backdrop-blur">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={user.image ?? undefined} alt={user.name} />
                <AvatarFallback>{initials || "U"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
            <CardDescription className="text-slate-400">Your AI memory chat space.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full bg-cyan-500/15 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.28)] hover:bg-cyan-500/25" onClick={() => void createConversation()}>
              <Plus className="mr-2 size-4" />
              New Chat
            </Button>

            <ScrollArea className="h-72 rounded-md border border-slate-700 bg-slate-950/50 p-2">
              <div className="space-y-2">
                {loadingConversations ? (
                  <p className="px-2 py-1 text-sm text-slate-400">Loading chats...</p>
                ) : conversations.length === 0 ? (
                  <p className="px-2 py-1 text-sm text-slate-400">No chats yet.</p>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`flex items-center gap-2 rounded-md border p-2 ${
                        conversation.id === activeConversationId
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-700 bg-slate-900/70"
                      }`}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => setActiveConversationId(conversation.id)}
                      >
                        <p className="truncate text-sm font-medium">{conversation.title}</p>
                        <p className={`text-xs ${conversation.id === activeConversationId ? "text-slate-200" : "text-slate-400"}`}>
                          {new Date(conversation.updatedAt).toLocaleString()}
                        </p>
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className={conversation.id === activeConversationId ? "text-white hover:bg-slate-800" : "text-slate-300 hover:bg-slate-800/80"}
                        onClick={() => void deleteConversation(conversation.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="space-y-3 rounded-md border border-slate-700 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Sidebar Menu</p>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/chat">
                  <Bot className="mr-2 size-4" />
                  AI Chat
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/ubiquity">
                  <Sparkles className="mr-2 size-4" />
                  Ubiquity Layer
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/comparison">
                  <Brain className="mr-2 size-4" />
                  Comparison
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/mind-map">
                  <Sparkles className="mr-2 size-4" />
                  Mind Map
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/logic-builder">
                  <Cpu className="mr-2 size-4" />
                  Logic Builder
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/voice">
                  <Mic className="mr-2 size-4" />
                  Voice Actions
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/semantic">
                  <Brain className="mr-2 size-4" />
                  Semantic Layer
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/reports">
                  <Cpu className="mr-2 size-4" />
                  Weekly Digest
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/library">
                  <Sparkles className="mr-2 size-4" />
                  Library
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/analytics">
                  <Brain className="mr-2 size-4" />
                  Analytics
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/developer">
                  <Cpu className="mr-2 size-4" />
                  API & Developer
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/model-lab">
                  <Settings className="mr-2 size-4" />
                  Model Lab
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/orchestrator">
                  <Sparkles className="mr-2 size-4" />
                  Agent Orchestrator
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/security">
                  <ShieldCheck className="mr-2 size-4" />
                  Security Audit
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/style">
                  <Brain className="mr-2 size-4" />
                  Style Tuner
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/compliance">
                  <Cpu className="mr-2 size-4" />
                  Compliance & ESG
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/dashboard/growth">
                  <Sparkles className="mr-2 size-4" />
                  Growth & Trust
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              >
                <a href="/contact">
                  <Contact className="mr-2 size-4" />
                  Contact
                </a>
              </Button>
            </div>

            <div className="space-y-3 rounded-md border border-slate-700 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-300">What AI Has</p>
              <p className="flex items-center gap-2 text-xs text-slate-300">
                <Brain className="size-3.5 text-indigo-300" />
                Long-term memory by conversation
              </p>
              <p className="flex items-center gap-2 text-xs text-slate-300">
                <Mic className="size-3.5 text-cyan-300" />
                Voice input and spoken replies
              </p>
              <p className="flex items-center gap-2 text-xs text-slate-300">
                <Sparkles className="size-3.5 text-fuchsia-300" />
                Quick starters and context recall
              </p>
            </div>

            <div className="space-y-3 rounded-md border border-slate-700 bg-slate-950/60 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fuchsia-300">
                <Cpu className="size-3.5" />
                AI Models
              </p>
              <div className="grid gap-2">
                <button
                  type="button"
                  className={`rounded-md border px-2 py-2 text-left text-xs transition ${
                    selectedAssistant === "chatgpt"
                      ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-100"
                      : "border-slate-700 bg-slate-900 text-slate-300 hover:border-cyan-400/40"
                  }`}
                  onClick={() => setSelectedAssistant("chatgpt")}
                >
                  ChatGPT
                </button>
                <button
                  type="button"
                  className={`rounded-md border px-2 py-2 text-left text-xs transition ${
                    selectedAssistant === "gemini"
                      ? "border-indigo-400/70 bg-indigo-500/15 text-indigo-100"
                      : "border-slate-700 bg-slate-900 text-slate-300 hover:border-indigo-400/40"
                  }`}
                  onClick={() => setSelectedAssistant("gemini")}
                >
                  Gemini
                </button>
                <button
                  type="button"
                  className={`rounded-md border px-2 py-2 text-left text-xs transition ${
                    selectedAssistant === "auto"
                      ? "border-fuchsia-400/70 bg-fuchsia-500/15 text-fuchsia-100"
                      : "border-slate-700 bg-slate-900 text-slate-300 hover:border-fuchsia-400/40"
                  }`}
                  onClick={() => setSelectedAssistant("auto")}
                >
                  Auto (Recommended)
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Selected model is now used for new AI responses.
              </p>
            </div>

            <div className="space-y-3 rounded-md border border-slate-700 bg-slate-950/60 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                <Settings className="size-3.5" />
                Settings
              </p>
              <p className="text-[11px] text-slate-400">Theme: {theme ?? "system"}</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={theme === "light" ? "default" : "outline"}
                  className={theme === "light" ? "bg-amber-500/20 text-amber-100" : "border-slate-700 bg-slate-900 text-slate-200"}
                  onClick={() => setTheme("light")}
                >
                  <Sun className="mr-1 size-3.5" />
                  Light
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={theme === "dark" ? "default" : "outline"}
                  className={theme === "dark" ? "bg-slate-700 text-slate-100" : "border-slate-700 bg-slate-900 text-slate-200"}
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="mr-1 size-3.5" />
                  Dark
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={theme === "system" ? "default" : "outline"}
                  className={theme === "system" ? "bg-cyan-500/20 text-cyan-100" : "border-slate-700 bg-slate-900 text-slate-200"}
                  onClick={() => setTheme("system")}
                >
                  <Monitor className="mr-1 size-3.5" />
                  Auto
                </Button>
              </div>
              <Button
                type="button"
                variant={voiceOutputEnabled ? "default" : "outline"}
                size="sm"
                className={voiceOutputEnabled ? "w-full bg-indigo-500/20 text-indigo-100 shadow-[0_0_14px_rgba(129,140,248,0.35)]" : "w-full border-slate-700 bg-slate-900 text-slate-200"}
                onClick={() => setVoiceOutputEnabled((current) => !current)}
              >
                {voiceOutputEnabled ? <Volume2 className="mr-2 size-4" /> : <VolumeX className="mr-2 size-4" />}
                Voice Output
              </Button>
              <Button
                type="button"
                variant={directVoiceMode ? "default" : "outline"}
                size="sm"
                className={directVoiceMode ? "w-full bg-fuchsia-500/20 text-fuchsia-100 shadow-[0_0_14px_rgba(217,70,239,0.35)]" : "w-full border-slate-700 bg-slate-900 text-slate-200"}
                onClick={() => setDirectVoiceMode((current) => !current)}
              >
                {directVoiceMode ? <MicOff className="mr-2 size-4" /> : <Mic className="mr-2 size-4" />}
                Direct Voice Chat
              </Button>
              <Button
                type="button"
                variant={conversationMode ? "default" : "outline"}
                size="sm"
                className={conversationMode ? "w-full bg-cyan-500/20 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.35)]" : "w-full border-slate-700 bg-slate-900 text-slate-200"}
                onClick={() => {
                  const next = !conversationMode;
                  setConversationMode(next);
                  if (!next) {
                    stopListening();
                  } else if (directVoiceMode && !listening) {
                    startListening();
                  }
                }}
              >
                {conversationMode ? <MicOff className="mr-2 size-4" /> : <Mic className="mr-2 size-4" />}
                One-to-One Mode
              </Button>
            </div>

            <div className="space-y-3 rounded-md border border-slate-700 bg-slate-950/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Chat Details</p>
              <p className="text-xs text-slate-300">Active: {activeConversation?.title ?? "No chat selected"}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={adaptiveRole}
                  onChange={(event) => setAdaptiveRole(event.target.value as "developer" | "manager")}
                  className="h-9 rounded-md border border-slate-700 bg-slate-900 px-2 text-xs text-slate-200"
                >
                  <option value="developer">Developer Layout</option>
                  <option value="manager">Manager Layout</option>
                </select>
                <Button
                  type="button"
                  variant={listening ? "default" : "outline"}
                  size="sm"
                  className={listening ? "bg-cyan-500/20 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.35)]" : "border-slate-700 bg-slate-900 text-slate-200"}
                  onClick={toggleListening}
                >
                  {listening ? <MicOff className="mr-2 size-4" /> : <Mic className="mr-2 size-4" />}
                  {listening ? "Stop" : directVoiceMode ? "Talk & Send" : "Talk"}
                </Button>
              </div>
              <Button
                type="button"
                variant={cameraEnabled ? "default" : "outline"}
                size="sm"
                className={cameraEnabled ? "w-full bg-emerald-500/20 text-emerald-100 shadow-[0_0_14px_rgba(16,185,129,0.35)]" : "w-full border-slate-700 bg-slate-900 text-slate-200"}
                onClick={() => {
                  if (cameraEnabled) {
                    stopCamera();
                    return;
                  }
                  void startCamera();
                }}
              >
                {cameraEnabled ? <CameraOff className="mr-2 size-4" /> : <Camera className="mr-2 size-4" />}
                {cameraEnabled ? "Camera Off" : "Camera On"}
              </Button>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-cyan-400/40 bg-cyan-500/10 text-cyan-200">
                  Messages: {messages.length}
                </Badge>
                <Badge variant="outline" className="border-cyan-400/40 bg-cyan-500/10 text-cyan-200">
                  Memory: {memory ? `${memory.split("\n").length} notes` : "empty"}
                </Badge>
                <Badge variant="outline" className="border-indigo-400/40 bg-indigo-500/10 text-indigo-200">
                  Role: {adaptiveRole}
                </Badge>
                <Badge variant="outline" className="border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200">
                  Intent: {detectedIntent.replace("_", " ")}
                </Badge>
              </div>
              <div className="rounded-md border border-slate-700 bg-slate-900/70 p-2">
                {memory ? (
                  memory
                    .split("\n")
                    .slice(0, 4)
                    .map((line, idx) => (
                      <p key={`${line}-${idx}`} className="truncate text-[11px] text-slate-300">
                        - {line}
                      </p>
                    ))
                ) : (
                  <p className="text-[11px] text-slate-500">No memory captured yet.</p>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {directVoiceMode
                  ? "Direct voice is ON: your speech sends automatically."
                  : "Direct voice is OFF: speech is placed in input first."}
              </p>
              {cameraError ? <p className="text-xs text-rose-300">Camera: {cameraError}</p> : null}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-300">Quick Starters</p>
                {[
                  "Help me plan my day in 5 steps",
                  "Summarize what you remember about me",
                  "Give me a focused study plan",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-left text-xs text-slate-200 hover:border-cyan-400/60 hover:text-cyan-100"
                    onClick={() => setInput(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
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

        <Card className="border-slate-700/70 bg-slate-950/80 text-slate-100">
          <CardContent className="flex min-h-[78svh] flex-col gap-4 p-4 md:p-6">
            <div className="min-h-0 flex-1">
              <ScrollArea className="h-full rounded-lg border border-slate-700 bg-[#050914] p-4">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Start chatting. I will remember context.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[92%] rounded-lg px-3 py-2 text-sm ${
                          message.role === "user"
                            ? "ml-auto border border-cyan-400/40 bg-slate-900 text-cyan-100 [text-shadow:0_0_10px_rgba(34,211,238,0.5)]"
                            : "border border-indigo-400/35 bg-slate-950/80 text-indigo-100 [text-shadow:0_0_10px_rgba(129,140,248,0.5)]"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.role === "assistant" ? (
                          <button
                            type="button"
                            className="mt-2 text-[11px] text-indigo-200 underline decoration-dotted underline-offset-2"
                            onClick={() => void explainAssistantMessage(message)}
                          >
                            Why did I say this?
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            </div>

            {cameraEnabled ? (
              <div className="rounded-lg border border-emerald-500/35 bg-slate-950/60 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Face-to-Face Camera</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={sendLiveFrame ? "default" : "outline"}
                      className={sendLiveFrame ? "bg-emerald-500/20 text-emerald-100" : "border-slate-700 bg-slate-900 text-slate-200"}
                      onClick={() => setSendLiveFrame((current) => !current)}
                    >
                      Live Frame
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-slate-700 bg-slate-900 text-slate-200"
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
                    className="aspect-video w-full rounded-md border border-slate-700 bg-slate-900 object-cover"
                  />
                  {capturedImage ? (
                    <div className="relative">
                      <Image
                        src={capturedImage}
                        alt="Captured preview"
                        width={640}
                        height={360}
                        unoptimized
                        className="aspect-video w-full rounded-md border border-cyan-500/40 object-cover"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-2 rounded-full border border-slate-700 bg-slate-950/80 p-1 text-slate-200 hover:bg-slate-900"
                        onClick={() => setCapturedImage(null)}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-md border border-dashed border-slate-700 bg-slate-900/60 text-xs text-slate-400">
                      No manual frame captured yet.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask anything..."
                className="border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
              />
              <Button className="bg-cyan-500/15 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.25)] hover:bg-cyan-500/25" onClick={() => void sendMessage()} disabled={sending || !input.trim()}>
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
