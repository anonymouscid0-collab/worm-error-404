"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import {
  Paperclip,
  X,
  Send,
  RefreshCw,
  FileText,
  Archive,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";

import { api, CurrentUser } from "@/lib/api";
import MessageContent from "@/components/MessageContent";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".pdf",
  ".zip",
];

interface ChatMessage {
  id: string;
  sender: "USER" | "ASSISTANT";
  content: string;
  createdAt?: string;
  isDownloadable?: boolean;
  downloadUrl?: string | null;
  downloadFileName?: string | null;
}

interface ConversationSummary {
  id: string;
  title: string;
}

interface FileItem {
  id: string;
  file: File;
  preview?: string;
}

function getGreeting(name: string) {
  const hour = new Date().getHours();

  if (hour < 12) return `Bonjour ${name}`;
  if (hour < 18) return `Bonne après-midi ${name}`;

  return `Bonsoir ${name}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) {
    return <ImageIcon size={15} />;
  }

  if (file.type === "application/pdf") {
    return <FileText size={15} />;
  }

  return <Archive size={15} />;
}

function isAllowedFile(file: File) {
  const name = file.name.toLowerCase();

  return ALLOWED_EXTENSIONS.some((extension) =>
    name.endsWith(extension)
  );
}

export default function ChatPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);

  const [conversations, setConversations] = useState<
    ConversationSummary[]
  >([]);

  const [conversationId, setConversationId] = useState<
    string | undefined
  >(undefined);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const [files, setFiles] = useState<FileItem[]>([]);

  const [limitReached, setLimitReached] = useState(false);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);

  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const draftSentRef = useRef(false);
  const mountedRef = useRef(true);

  /*
   * Auth + Socket
   */
  useEffect(() => {
    mountedRef.current = true;

    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/login");
      return;
    }

    setCheckingAuth(false);

    api
      .get("/api/auth/me")
      .then((response) => {
        if (!mountedRef.current) return;
        setUser(response.data);
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        router.replace("/login");
      });

    api
      .get("/api/chat/conversations")
      .then((response) => {
        if (!mountedRef.current) return;

        setConversations(
          response.data?.conversations || []
        );
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setError("Impossible de charger les conversations.");
      });

    const socket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (!mountedRef.current) return;

      setConnected(true);
      setError("");
    });

    socket.on("disconnect", () => {
      if (!mountedRef.current) return;

      setConnected(false);
    });

    socket.on("connect_error", () => {
      if (!mountedRef.current) return;

      setConnected(false);
      setSending(false);
      setError("Connexion au serveur interrompue.");
    });

    socket.on(
      "chat:conversation_created",
      ({
        conversationId,
      }: {
        conversationId: string;
      }) => {
        if (!mountedRef.current) return;

        setConversationId(conversationId);

        refreshConversations();
      }
    );

    socket.on(
      "chat:message_saved",
      ({
        message,
      }: {
        message: ChatMessage;
      }) => {
        if (!mountedRef.current) return;

        setMessages((previous) => {
          const alreadyExists = previous.some(
            (item) => item.id === message.id
          );

          if (alreadyExists) return previous;

          return [...previous, message];
        });
      }
    );

    socket.on(
      "chat:reply",
      ({
        message,
      }: {
        message: ChatMessage;
      }) => {
        if (!mountedRef.current) return;

        setMessages((previous) => {
          const alreadyExists = previous.some(
            (item) => item.id === message.id
          );

          if (alreadyExists) return previous;

          return [...previous, message];
        });

        setSending(false);
      }
    );

    socket.on("chat:limit_reached", () => {
      if (!mountedRef.current) return;

      setLimitReached(true);
      setSending(false);
    });

    socket.on(
      "chat:error",
      ({
        error: socketError,
      }: {
        error?: string;
      }) => {
        if (!mountedRef.current) return;

        setSending(false);
        setError(
          socketError || "Une erreur est survenue pendant l'envoi."
        );
      }
    );

    const draft = sessionStorage.getItem("draftMessage");

    if (draft && !draftSentRef.current) {
      draftSentRef.current = true;

      sessionStorage.removeItem("draftMessage");

      setTimeout(() => {
        if (mountedRef.current) {
          sendMessage(draft, socket);
        }
      }, 400);
    }

    return () => {
      mountedRef.current = false;

      socket.removeAllListeners();
      socket.disconnect();

      socketRef.current = null;
    };
  }, [router]);

  /*
   * Scroll automatique
   */
  useEffect(() => {
    const element = scrollRef.current;

    if (!element) return;

    element.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  /*
   * Nettoyage des previews
   */
  useEffect(() => {
    return () => {
      files.forEach((item) => {
        if (item.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [files]);

  /*
   * Conversations
   */
  async function refreshConversations() {
    try {
      const response = await api.get(
        "/api/chat/conversations"
      );

      if (!mountedRef.current) return;

      setConversations(
        response.data?.conversations || []
      );
    } catch {
      // Pas bloquant pour le chat.
    }
  }

  async function openConversation(id: string) {
    setError("");
    setConversationId(id);

    try {
      const response = await api.get(
        `/api/chat/conversations/${id}`
      );

      if (!mountedRef.current) return;

      setMessages(
        response.data?.conversation?.messages || []
      );
    } catch {
      setError(
        "Impossible de charger cette conversation."
      );
    }
  }

  function startNewConversation() {
    setConversationId(undefined);
    setMessages([]);
    setError("");
    setUploadError("");
  }

  /*
   * Fichiers
   */
  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setUploadError("");

    const selected = Array.from(
      event.target.files || []
    );

    if (!selected.length) return;

    const currentCount = files.length;

    if (currentCount + selected.length > MAX_FILES) {
      setUploadError(
        `Maximum ${MAX_FILES} fichiers par message.`
      );

      event.target.value = "";
      return;
    }

    const validFiles: FileItem[] = [];

    for (const file of selected) {
      if (!isAllowedFile(file)) {
        setUploadError(
          `Type de fichier non supporté : ${file.name}`
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setUploadError(
          `${file.name} dépasse la limite de ${formatFileSize(
            MAX_FILE_SIZE
          )}.`
        );
        continue;
      }

      const item: FileItem = {
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
      };

      if (file.type.startsWith("image/")) {
        item.preview = URL.createObjectURL(file);
      }

      validFiles.push(item);
    }

    if (validFiles.length > 0) {
      setFiles((previous) => [
        ...previous,
        ...validFiles,
      ]);
    }

    event.target.value = "";
  }

  function removeFile(id: string) {
    setFiles((previous) => {
      const item = previous.find(
        (fileItem) => fileItem.id === id
      );

      if (item?.preview) {
        URL.revokeObjectURL(item.preview);
      }

      return previous.filter(
        (fileItem) => fileItem.id !== id
      );
    });
  }

  /*
   * Envoi du message
   *
   * Le socket actuel de ton backend accepte :
   * conversationId + content.
   *
   * Les fichiers sont donc conservés dans l'interface
   * pour l'instant. L'upload serveur sera branché dans
   * la phase backend dédiée.
   */
  function sendMessage(
    content: string,
    socket: Socket | null = socketRef.current
  ) {
    const cleanContent = content.trim();

    if (!cleanContent && files.length === 0) {
      return;
    }

    if (limitReached || sending) {
      return;
    }

    const token = localStorage.getItem(
      "accessToken"
    );

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!socket || !socket.connected) {
      setError(
        "Le serveur n'est pas connecté. Réessaie dans un instant."
      );
      return;
    }

    setError("");
    setSending(true);

    /*
     * Pour le moment le backend reçoit uniquement le texte.
     * Les fichiers seront envoyés via le endpoint d'upload
     * lors de la phase backend.
     */
    socket.emit("chat:message", {
      conversationId,
      content: cleanContent,
    });
  }

  function handleSend() {
    if (
      (!input.trim() && files.length === 0) ||
      sending ||
      limitReached
    ) {
      return;
    }

    /*
     * Si des fichiers sont présents mais aucun texte,
     * on donne un contexte au backend actuel.
     */
    const content =
      input.trim() ||
      `Analyse les fichiers joints : ${files
        .map((item) => item.file.name)
        .join(", ")}`;

    sendMessage(content);

    setInput("");

    /*
     * On ne détruit pas les fichiers avant la future
     * phase d'upload. Pour cette version, on les nettoie
     * après lancement de l'envoi.
     */
    setFiles((previous) => {
      previous.forEach((item) => {
        if (item.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });

      return [];
    });
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSend();
    }
  }

  const remaining = user
    ? Math.max(
        0,
        user.freeLimit - user.messagesUsed
      )
    : null;

  if (checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface text-sm text-muted">
        Chargement...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface text-ink">
      {/* SIDEBAR */}

      <aside className="hidden w-64 flex-col border-r border-line bg-card md:flex">
        <div className="border-b border-line p-4">
          <Link
            href="/"
            className="text-sm text-muted hover:text-ink"
          >
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
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() =>
                openConversation(conversation.id)
              }
              className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm ${
                conversationId === conversation.id
                  ? "bg-brand-light text-brand"
                  : "text-body hover:bg-surface"
              }`}
            >
              {conversation.title}
            </button>
          ))}
        </div>

        {user && (
          <div className="border-t border-line p-4 text-xs text-muted">
            <p className="truncate">
              {user.email}
            </p>

            <p className="mt-1">
              Plan :{" "}
              <span className="font-medium text-brand">
                {user.plan}
              </span>

              {user.plan === "FREE" &&
                remaining !== null && (
                  <span>
                    {" "}
                    ({remaining} message
                    {remaining > 1 ? "s" : ""} restant
                    {remaining > 1 ? "s" : ""})
                  </span>
                )}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  connected
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />

              <span>
                {connected
                  ? "Serveur connecté"
                  : "Déconnecté"}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* CHAT */}

      <main className="flex min-w-0 flex-1 flex-col">
        {/* HEADER MOBILE */}

        <header className="flex items-center justify-between border-b border-line bg-card px-4 py-3 md:hidden">
          <Link
            href="/"
            className="text-sm text-muted"
          >
            ← Accueil
          </Link>

          <span className="text-sm font-semibold">
            WORM ERROR // 404
          </span>

          <button
            onClick={startNewConversation}
            className="text-xs text-brand"
          >
            Nouveau
          </button>
        </header>

        {/* MESSAGES */}

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto px-4 py-6 md:px-6 md:py-8"
        >
          {messages.length === 0 && user && (
            <div className="mx-auto max-w-lg pt-20 text-center">
              <p className="text-sm text-muted">
                {getGreeting(
                  user.name ||
                    user.email.split("@")[0]
                )}
              </p>

              <p className="mt-2 text-xs text-subtle">
                WORM ERROR // 404 est prêt.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`mx-auto max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.sender === "USER"
                  ? "ml-auto bg-brand text-white"
                  : "border border-line bg-card text-body"
              }`}
            >
              <p
                className={`mb-1 text-[11px] font-medium uppercase tracking-wide ${
                  message.sender === "USER"
                    ? "text-white/70"
                    : "text-subtle"
                }`}
              >
                {message.sender === "USER"
                  ? "Toi"
                  : "WORM ERROR // 404"}
              </p>

              <MessageContent
                content={message.content}
                isUser={
                  message.sender === "USER"
                }
              />

              {message.isDownloadable && message.downloadUrl && (
                <a
                  href={`${API_URL}${message.downloadUrl}`}
                  download={message.downloadFileName || undefined}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line bg-background px-3 py-2 text-xs font-medium text-body hover:bg-card"
                >
                  <Archive size={14} />
                  Télécharger {message.downloadFileName || "le projet"}
                </a>
              )}
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

        {/* ERROR */}

        {(error || uploadError) && (
          <div className="mx-auto mb-2 flex w-full max-w-2xl items-center gap-2 px-4 text-xs text-red-600">
            <AlertCircle size={14} />

            <span>
              {uploadError || error}
            </span>

            <button
              onClick={() => {
                setError("");
                setUploadError("");
              }}
              className="ml-auto"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* FILES */}

        {files.length > 0 && (
          <div className="mx-auto mb-2 flex w-full max-w-2xl flex-wrap gap-2 px-4">
            {files.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-xl border border-line bg-card"
              >
                {item.preview ? (
                  <div className="h-20 w-20 overflow-hidden">
                    <img
                      src={item.preview}
                      alt={item.file.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-20 w-28 flex-col items-center justify-center gap-1 px-2">
                    <span className="text-brand">
                      {getFileIcon(item.file)}
                    </span>

                    <span className="w-full truncate text-center text-[10px] text-body">
                      {item.file.name}
                    </span>

                    <span className="text-[9px] text-muted">
                      {formatFileSize(
                        item.file.size
                      )}
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    removeFile(item.id)
                  }
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label={`Supprimer ${item.file.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* COMPOSER */}

        <div className="border-t border-line bg-card p-3 md:p-4">
          <div className="mx-auto flex max-w-2xl items-end gap-2 md:gap-3">
            <label
              className="cursor-pointer rounded-xl border border-line bg-surface p-3 text-muted transition hover:border-brand hover:text-brand"
              title="Joindre un fichier"
            >
              <Paperclip size={18} />

              <input
                type="file"
                multiple
                className="hidden"
                accept="image/*,.zip,.pdf"
                onChange={handleFileChange}
              />
            </label>

            <textarea
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Écris ton message..."
              disabled={sending || limitReached}
              className="max-h-40 min-h-[46px] flex-1 resize-none rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none transition focus:border-brand disabled:opacity-50"
            />

            <button
              onClick={handleSend}
              disabled={
                sending ||
                limitReached ||
                (!input.trim() &&
                  files.length === 0)
              }
              className="flex items-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50 md:px-5"
            >
              {sending ? (
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Send size={17} />
              )}

              <span className="hidden sm:inline">
                {sending ? "..." : "Envoyer"}
              </span>
            </button>
          </div>

          <p className="mx-auto mt-2 max-w-2xl px-1 text-[10px] text-muted">
            Entrée pour envoyer · Shift + Entrée
            pour une nouvelle ligne
          </p>
        </div>
      </main>

      {/* LIMIT MODAL */}

      {limitReached && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-card p-8 text-center shadow-soft">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand">
              Limite atteinte
            </p>

            <h2 className="mb-4 text-xl font-bold text-ink">
              Vous avez utilisé vos 15 messages
              gratuits.
            </h2>

            <Link
              href="/premium"
              className="block rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Passer au plan Pro (10 $)
            </Link>

            <button
              onClick={() =>
                setLimitReached(false)
              }
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
