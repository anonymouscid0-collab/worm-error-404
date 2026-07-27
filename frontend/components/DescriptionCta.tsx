import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";

const WHATSAPP_URL = "https://whatsapp.com/channel/0029Vb8jYDHIXnlp8x3PsY09";
const TELEGRAM_USERNAME = "";
const telegramUrl = TELEGRAM_USERNAME ? `https://t.me/${TELEGRAM_USERNAME}` : "https://t.me/";

export function ActionButtons() {
  return (
    <div className="flex flex-wrap gap-2.5">
      <Link
        href="/chat"
        className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
      >
        Discuter avec l'IA
      </Link>
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full border border-brand/30 px-5 py-2 text-sm font-medium text-brand transition hover:bg-brand-light"
      >
        <Send size={15} />
        Telegram
      </a>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full border border-brand/30 px-5 py-2 text-sm font-medium text-brand transition hover:bg-brand-light"
      >
        <MessageCircle size={15} />
        WhatsApp
      </a>
    </div>
  );
}

export default function DescriptionCta({ text }: { text: string }) {
  return (
    <div className="space-y-4">
      <p className="text-[15px] leading-relaxed text-brand-dark">{text}</p>
      <ActionButtons />
    </div>
  );
}
