"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";

export default function PremiumPage() {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await api.post("/api/premium/activate", { key });
      setStatus("success");
      setMessage(res.data.message ?? "Plan Pro débloqué avec succès.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.response?.data?.error ?? "Une erreur est survenue.");
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <section className="mx-auto flex max-w-xl flex-col items-center px-6 py-20 text-center">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">Plan Pro</h2>
        <h1 className="mb-4 text-3xl font-bold text-ink sm:text-4xl">Débloque le plan Pro</h1>
        <p className="mb-2 text-sm text-muted">Vous avez utilisé vos 15 messages gratuits.</p>
        <p className="mb-10 text-2xl font-bold text-brand">10 $</p>

        <form
          onSubmit={handleActivate}
          className="w-full rounded-2xl border border-line bg-card p-6 text-left shadow-soft"
        >
          <label className="mb-2 block text-xs font-medium text-muted" htmlFor="key">
            Clé d'activation Premium
          </label>
          <input
            id="key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="WORM-XXXX-XXXX-XXXX"
            className="mb-4 w-full rounded-lg border border-line bg-surface px-4 py-3 text-sm tracking-wide text-ink outline-none focus:border-brand"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {status === "loading" ? "Vérification..." : "Activer mon plan Pro"}
          </button>

          {status === "success" && <p className="mt-4 text-sm text-emerald-600">✔ {message}</p>}
          {status === "error" && <p className="mt-4 text-sm text-red-600">✕ {message}</p>}
        </form>

        <p className="mt-8 text-xs text-muted">
          Tu n'as pas encore de clé ? Rejoins le canal WhatsApp ou contacte CID sur Telegram
          pour en obtenir une.
        </p>
      </section>
      <Footer />
    </div>
  );
}
