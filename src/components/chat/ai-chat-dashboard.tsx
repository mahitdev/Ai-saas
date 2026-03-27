"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, Mic, MicOff, Plus, Send, Trash2, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth.client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

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

  function speak(text: string) {
    if (!voiceOutputEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
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
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        if (transcript) {
          setInput((previous) => `${previous} ${transcript}`.trim());
        }
        setListening(false);
      };
      recognition.onerror = () => {
        setListening(false);
      };
      recognitionRef.current = recognition;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    recognitionRef.current.start();
    setListening(true);
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
    setSending(true);
    const messageText = input.trim();
    setInput("");

    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId ?? undefined,
          message: messageText,
        }),
      });
      if (!response.ok) throw new Error("Failed to send message");
      const payload = (await response.json()) as {
        conversationId: string;
        userMessage: Message;
        assistantMessage: Message;
        memorySummary: string;
      };

      if (!activeConversationId) {
        await fetchConversations();
      }
      setActiveConversationId(payload.conversationId);
      setMessages((previous) => [...previous, payload.userMessage, payload.assistantMessage]);
      setMemory(payload.memorySummary);
      speak(payload.assistantMessage.content);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.2),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#111827_100%)] p-4 text-slate-100 md:p-8">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[290px_1fr]">
        <Card className="h-fit border-slate-700/70 bg-slate-950/80 text-slate-100 backdrop-blur">
          <CardHeader>
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
          <CardContent className="space-y-3">
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
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-cyan-200 [text-shadow:0_0_16px_rgba(34,211,238,0.55)]">
                  <Bot className="size-5 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]" />
                  AI Chat With Memory
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Your assistant remembers your context and prior conversations.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={listening ? "default" : "outline"}
                  size="sm"
                  className={listening ? "bg-cyan-500/20 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.35)]" : "border-slate-700 bg-slate-900 text-slate-200"}
                  onClick={toggleListening}
                >
                  {listening ? <MicOff className="mr-2 size-4" /> : <Mic className="mr-2 size-4" />}
                  {listening ? "Stop" : "Talk"}
                </Button>
                <Button
                  type="button"
                  variant={voiceOutputEnabled ? "default" : "outline"}
                  size="sm"
                  className={voiceOutputEnabled ? "bg-indigo-500/20 text-indigo-100 shadow-[0_0_14px_rgba(129,140,248,0.35)]" : "border-slate-700 bg-slate-900 text-slate-200"}
                  onClick={() => setVoiceOutputEnabled((current) => !current)}
                >
                  {voiceOutputEnabled ? <Volume2 className="mr-2 size-4" /> : <VolumeX className="mr-2 size-4" />}
                  Voice
                </Button>
              </div>
            </div>
            <Badge variant="outline" className="w-fit border-cyan-400/40 bg-cyan-500/10 text-cyan-200">
              Memory: {memory ? `${memory.split("\n").length} notes` : "empty"}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
              <div className="space-y-3">
                <ScrollArea className="h-[420px] rounded-lg border border-slate-700 bg-[#050914] p-4">
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
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                            message.role === "user"
                              ? "ml-auto border border-cyan-400/40 bg-slate-900 text-cyan-100 [text-shadow:0_0_10px_rgba(34,211,238,0.5)]"
                              : "border border-indigo-400/35 bg-slate-950/80 text-indigo-100 [text-shadow:0_0_10px_rgba(129,140,248,0.5)]"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

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
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                  <p className="text-xs font-semibold tracking-wide text-cyan-300 uppercase">Section 1: Chat Info</p>
                  <p className="mt-2 text-sm text-slate-300">Active chat</p>
                  <p className="truncate text-sm font-medium text-cyan-100">{activeConversation?.title ?? "No chat selected"}</p>
                  <p className="mt-2 text-xs text-slate-400">Messages: {messages.length}</p>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                  <p className="text-xs font-semibold tracking-wide text-indigo-300 uppercase">Section 2: Memory</p>
                  <div className="mt-2 space-y-1">
                    {memory ? memory.split("\n").slice(0, 5).map((line, idx) => (
                      <p key={`${line}-${idx}`} className="text-xs text-slate-300">- {line}</p>
                    )) : <p className="text-xs text-slate-500">No memory captured yet.</p>}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3">
                  <p className="text-xs font-semibold tracking-wide text-fuchsia-300 uppercase">Section 3: Quick Starters</p>
                  <div className="mt-2 space-y-2">
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
