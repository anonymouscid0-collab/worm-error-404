"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { Paperclip, X } from "lucide-react";
import { api, CurrentUser } from "@/lib/api";
import MessageContent from "@/components/MessageContent";

interface ChatMessage {
  id: string;
  sender: "USER" | "ASSISTANT";
  content: string;
  createdAt?: string;
}

interface ConversationSummary {
  id: string;
  title: string;
}

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Bonjour ${name}`;
  if (hour < 18) return `Bonne après-midi ${name}`;
  return `Bonsoir ${name}`;
}

export default function ChatPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [limitReached, setLimitReached] = useState(false);
  const [sending, setSending] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const draftSentRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    setCheckingAuth(false);

    fetch("https://worm-error-404.onrender.com/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem("accessToken");
        router.replace("/login");
      });

    fetch("https://worm-error-404.onrender.com/api/chat/conversations", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setConversations(data.conversations || []))
      .catch(() => {});

    const socket = io("https://worm-error-404.onrender.com", {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("chat:conversation_created", ({ conversationId }: { conversationId: string }) => {
      setConversationId(conversationId);
    });

    socket.on("chat:message_saved", ({ message }: { message: ChatMessage }) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("chat:reply", ({ message }: { message: ChatMessage }) => {
      setMessages((prev) => [...prev, message]);
      setSending(false);
    });

    socket.on("chat:limit_reached", () => {
      setLimitReached(true);
      setSending(false);
    });

    socket.on("chat:error", () => setSending(false));
    socket.on("connect_error", () => setSending(false));

    const draft = sessionStorage.getItem("draftMessage");
    if (draft && !draftSentRef.current) {
      draftSentRef.current = true;
      sessionStorage.removeItem("draftMessage");
      setTimeout(() => sendMessage(draft, socket), 300);
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function openConversation(id: string) {
    setConversationId(id);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`https://worm-error-404.onrender.com/api/chat/conversations/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setMessages(data.conversation?.messages || []);
    } catch {
      // on reste sur l'écran actuel sans planter
    }
  }

  function startNewConversation() {
    setConversationId(undefined);
    setMessages([]);
  }

  function sendMessage(content: string, socket: Socket | null = socketRef.current) {
    if (!content.trim() || limitReached || sending) return;
    if (!localStorage.getItem("accessToken")) {
      router.replace("/login");
      return;
    }
    setSending(true);
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, sender: "USER", content }]);
    socket?.emit("chat:message", { conversationId, content });
  }

  function handleSend() {
    sendMessage(input);
    setInput("");
    setFiles([]);
  }

  const remaining = user ? Math.max(0, user.freeLimit - user.messagesUsed) : null;

  if (checkingAuth) {
    return <div className="flex h-screen items-center justify-center bg-surface text-sm text-muted">Chargement...</div>;
  }

  return (
    <div className="flex h-screen bg-surface text-ink">
      <aside className="hidden w-64 flex-col border-r border-line bg-card md:flex">
        <div className="border-b border-line p-4">
          <Link href="/" className="text-sm text-muted hover:text-ink">
            ← retour à l'accueil
          </Link>
        </div>
        <button
          onClick={startNewConversation}
          className="m-3 rounded-lg border border-line bg-brand-light px-3 py-2 text-sm font-medium text-brand hover:bg-brand/10"
        >
          + Nouvelle conversation
        </button>
        <div className="flex-1 space-y-1 overflow-y-auto px-3">
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => openConversation(c.id)}
              className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm ${
                conversationId === c.id ? "bg-brand-light text-brand" : "text-body hover:bg-surface"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
        {user && (
          <div className="border-t border-line p-4 text-xs text-muted">
            <p className="truncate">{user.email}</p>
            <p className="mt-1">
              Plan : <span className="font-medium text-brand">{user.plan}</span>
              {user.plan === "FREE" && remaining !== null && (
                <span> ({remaining} message{remaining > 1 ? "s" : ""} restant{remaining > 1 ? "s" : ""})</span>
              )}
            </p>
          </div>
        )}
      </aside>

      <main className="flex flex-1 flex-col">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-8">
          {messages.length === 0 && user && (
            <div className="mx-auto max-w-lg pt-20 text-center text-sm text-muted">
              {getGreeting(user.name || user.email.split("@")[0])}
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`mx-auto max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.sender === "USER"
                  ? "ml-auto bg-brand text-white"
                  : "border border-line bg-card text-body"
              }`}
            >
              <p className={`mb-1 text-[11px] font-medium uppercase tracking-wide ${
                m.sender === "USER" ? "text-white/70" : "text-subtle"
              }`}>
                {m.sender === "USER" ? "Toi" : "WORM ERROR // 404"}
              </p>
              <MessageContent content={m.content} isUser={m.sender === "USER"} />
            </div>
          ))}
          {sending && (
            <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-card px-4 py-3">
              <span className="typing-dot mr-1 animate-dotPulse" />
              <span className="typing-dot mr-1 animate-dotPulse [animation-delay:0.15s]" />
              <span className="typing-dot animate-dotPulse [animation-delay:0.3s]" />
            </div>
          )}
        </div>

        <div className="border-t border-line bg-card p-4">
          {files.length > 0 && (
            <div className="mx-auto mb-2 flex max-w-2xl flex-wrap gap-2">
              {files.map((f, i) => (
                <span
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1 text-xs text-brand"
                >
                  {f.name}
                  <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="mx-auto flex max-w-2xl items-end gap-3">
            <label className="cursor-pointer rounded-xl border border-line bg-surface p-3 text-muted hover:border-brand hover:text-brand">
              <Paperclip size={18} />
              <input
                type="file"
                multiple
                className="hidden"
                accept="image/*,.zip,.pdf"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder=""
              className="flex-1 resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none focus:border-brand"
            />
            <button
              onClick={handleSend}
              disabled={sending || limitReached}
              className="rounded-xl bg-brand px-5 py-3 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {sending ? "..." : "Envoyer"}
            </button>
          </div>
        </div>
      </main>

      {limitReached && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-8 text-center shadow-soft">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand">
              Limite atteinte
            </p>
            <h2 className="mb-4 text-xl font-bold text-ink">
              Vous avez utilisé vos 15 messages gratuits.
            </h2>
            <Link
              href="/premium"
              className="block rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Passer au plan Pro (10 $)
            </Link>
            <button
              onClick={() => setLimitReached(false)}
              className="mt-4 text-xs text-muted hover:text-ink"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
