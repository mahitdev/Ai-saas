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
              </div>
              <p className="text-[11px] text-zinc-500">
                Use the menu to switch theme, model, and voice settings without leaving the canvas.
              </p>
            </div>

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
                        {message.role === "assistant" ? (
                          <button
                            type="button"
                            className="mt-2 text-[11px] text-zinc-500 underline decoration-dotted underline-offset-2"
                            onClick={() => void explainAssistantMessage(message)}
                          >
                            Why this answer?
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

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
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
