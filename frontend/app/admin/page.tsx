"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  messagesUsed: number;
  freeLimit: number;
  createdAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalConversations: 0, totalMessages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchData() {
    setLoading(true);
    setError("");
    try {
      const [usersRes, statsRes] = await Promise.all([
        api.get("/api/admin/users"),
        api.get("/api/admin/stats"),
      ]);
      setUsers(usersRes.data.users);
      setStats(statsRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Supprimer cet utilisateur ?")) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers(users.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.error ?? "Erreur.");
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-8 text-3xl font-bold text-ink">Panneau d'administration</h1>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-card p-6">
            <p className="text-sm text-muted">Utilisateurs</p>
            <p className="text-2xl font-bold text-ink">{stats.totalUsers}</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-6">
            <p className="text-sm text-muted">Conversations</p>
            <p className="text-2xl font-bold text-ink">{stats.totalConversations}</p>
          </div>
          <div className="rounded-xl border border-line bg-card p-6">
            <p className="text-sm text-muted">Messages</p>
            <p className="text-2xl font-bold text-ink">{stats.totalMessages}</p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">Utilisateurs</h2>
          <button
            onClick={fetchData}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Rafraîchir
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface text-muted">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Messages</th>
                <th className="px-4 py-3">Inscrit le</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink">{u.name ?? "-"}</td>
                  <td className="px-4 py-3 text-ink">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.plan === "PRO" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink">{u.messagesUsed} / {u.freeLimit}</td>
                  <td className="px-4 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    Aucun utilisateur.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
