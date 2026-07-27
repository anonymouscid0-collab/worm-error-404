import { MessageCircle, Send } from "lucide-react";

const WHATSAPP_URL = "https://whatsapp.com/channel/0029Vb8jYDHIXnlp8x3PsY09";
const TELEGRAM_USERNAME = "";

export default function Footer() {
  const telegramUrl = TELEGRAM_USERNAME ? `https://t.me/${TELEGRAM_USERNAME}` : "https://t.me/";

  return (
    <footer className="border-t border-line bg-ink py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 text-center">
        <p className="text-sm text-white/60">Plan Pro ou besoin d'aide ? Contacte-moi directement.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-dark"
          >
            <MessageCircle size={16} />
            Rejoindre le canal WhatsApp
          </a>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition hover:border-brand hover:bg-white/5"
          >
            <Send size={16} />
            Telegram
          </a>
        </div>
        <p className="text-xs text-white/40">Powered by CID ERROR 404</p>
      </div>
    </footer>
  );
}
