"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Tab = "stats" | "users" | "keys" | "conversations" | "settings" | "apikeys";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    refresh(tab);
  }, [tab]);

  async function refresh(t: Tab) {
    setError("");
    try {
      if (t === "stats") setStats((await api.get("/api/admin/stats")).data);
      if (t === "users") setUsers((await api.get("/api/admin/users")).data.users);
      if (t === "keys") setKeys((await api.get("/api/admin/premium-keys")).data.keys);
      if (t === "conversations")
        setConversations((await api.get("/api/admin/conversations")).data.conversations);
      if (t === "settings") setSettings((await api.get("/api/admin/settings")).data.settings);
      if (t === "apikeys") setApiKeys((await api.get("/api/admin/api-keys")).data.keys);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Accès refusé. Connecte-toi avec un compte admin.");
    }
  }

  async function generateKeys(count: number) {
    const res = await api.post("/api/admin/premium-keys", { count });
    setGeneratedKeys(res.data.keys);
    refresh("keys");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "stats", label: "Statistiques" },
    { id: "users", label: "Utilisateurs" },
    { id: "keys", label: "Clés Premium" },
    { id: "conversations", label: "Conversations" },
    { id: "settings", label: "Paramètres" },
    { id: "apikeys", label: "Clés API" },
  ];

  return (
    <div className="min-h-screen bg-surface px-6 py-10 text-ink">
      <h1 className="mb-1 text-2xl font-bold">Administration</h1>
      <p className="mb-8 text-sm text-muted">WORM ERROR // 404 — panneau admin</p>

      <div className="mb-8 flex flex-wrap gap-2 border-b border-line pb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm ${
              tab === t.id ? "bg-brand-light text-brand" : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-6 text-sm text-red-600">{error}</p>}

      {tab === "stats" && stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="rounded-xl border border-line bg-card p-4 shadow-soft">
              <p className="text-xs text-muted">{key}</p>
              <p className="mt-1 text-2xl font-bold text-brand">{String(value)}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="pb-2">Email</th>
              <th className="pb-2">Plan</th>
              <th className="pb-2">Rôle</th>
              <th className="pb-2">Messages</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line">
                <td className="py-2">{u.email}</td>
                <td className="py-2 font-medium text-brand">{u.plan}</td>
                <td className="py-2">{u.role}</td>
                <td className="py-2">{u.messagesUsed}/{u.freeLimit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "keys" && (
        <div>
          <button
            onClick={() => generateKeys(5)}
            className="mb-6 rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
          >
            Générer 5 clés Premium
          </button>
          {generatedKeys.length > 0 && (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
              <p className="mb-2 font-medium text-amber-700">
                Copie ces clés maintenant — elles ne seront plus jamais affichées en clair :
              </p>
              {generatedKeys.map((k) => (
                <p key={k} className="font-mono text-xs">{k}</p>
              ))}
            </div>
          )}
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="pb-2">Statut</th>
                <th className="pb-2">Créée le</th>
                <th className="pb-2">Utilisée le</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-t border-line">
                  <td className="py-2">
                    {k.isUsed ? (
                      <span className="text-muted">utilisée</span>
                    ) : (
                      <span className="font-medium text-brand">disponible</span>
                    )}
                  </td>
                  <td className="py-2">{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td className="py-2">{k.usedAt ? new Date(k.usedAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "conversations" && (
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="pb-2">Titre</th>
              <th className="pb-2">Utilisateur</th>
              <th className="pb-2">Messages</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="py-2">{c.title}</td>
                <td className="py-2">{c.user?.email}</td>
                <td className="py-2">{c._count?.messages}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "settings" && (
        <div className="space-y-3">
          {settings.map((s) => (
            <div key={s.key} className="flex items-center gap-4 rounded-lg border border-line bg-card p-3 text-sm">
              <span className="w-48 text-muted">{s.key}</span>
              <span className="text-ink">{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "apikeys" && (
        <div className="space-y-3">
          {apiKeys.map((k) => (
            <div key={k.id} className="flex items-center gap-4 rounded-lg border border-line bg-card p-3 text-sm">
              <span className="w-32 font-medium text-brand">{k.provider}</span>
              <span className="w-40 text-muted">{k.label}</span>
              <span>{k.keyValue}</span>
            </div>
          ))}
          <p className="text-xs text-muted">
            Ajoute une clé API IA depuis un client REST (POST /api/admin/api-keys) — un
            formulaire dédié pourra être branché ici plus tard.
          </p>
        </div>
      )}
    </div>
  );
}
