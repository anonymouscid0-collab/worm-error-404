"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FolderGit2, FileCode, Download, ArrowLeft } from "lucide-react";

import { api } from "@/lib/api";

interface ProjectVersionSummary {
  id: string;
  projectName: string;
  version: number;
  fileCount: number;
  zipUrl: string;
  createdAt: string;
}

interface ProjectFile {
  path: string;
  content: string;
}

interface ProjectVersionDetail extends ProjectVersionSummary {
  files: ProjectFile[] | null;
}

async function downloadVersion(id: string, projectName: string, version: number) {
  try {
    const response = await api.get(`/api/projects/${id}/download`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectName}-v${version}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Téléchargement échoué:", err);
  }
}

export default function WorkspacePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [versions, setVersions] = useState<ProjectVersionSummary[]>([]);
  const [selected, setSelected] = useState<ProjectVersionDetail | null>(null);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.replace("/login");
      return;
    }
    setCheckingAuth(false);

    api
      .get("/api/projects")
      .then((response) => setVersions(response.data?.versions || []))
      .catch((err) => console.error("Erreur chargement projets:", err));
  }, [router]);

  function openVersion(id: string) {
    setLoading(true);
    setSelectedFile(null);
    api
      .get(`/api/projects/${id}`)
      .then((response) => {
        setSelected(response.data?.version || null);
        const files = response.data?.version?.files;
        if (Array.isArray(files) && files.length > 0) {
          setSelectedFile(files[0]);
        }
      })
      .catch((err) => console.error("Erreur chargement version:", err))
      .finally(() => setLoading(false));
  }

  if (checkingAuth) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted">Chargement...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-body md:flex-row">
      <aside className="w-full border-b border-line bg-card md:w-72 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 border-b border-line p-4">
          <Link href="/chat" className="text-muted hover:text-brand">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-sm font-semibold">Mes projets générés</h1>
        </div>

        <div className="max-h-[40vh] overflow-y-auto md:max-h-[calc(100vh-57px)]">
          {versions.length === 0 && (
            <p className="p-4 text-xs text-muted">
              Aucun projet généré pour l'instant. Demande un projet complet dans le chat (plan PRO).
            </p>
          )}
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => openVersion(v.id)}
              className={`flex w-full items-start gap-2 border-b border-line px-4 py-3 text-left text-sm hover:bg-surface ${
                selected?.id === v.id ? "bg-surface" : ""
              }`}
            >
              <FolderGit2 size={16} className="mt-0.5 shrink-0 text-brand" />
              <span className="flex-1">
                <span className="block font-medium">{v.projectName}</span>
                <span className="block text-xs text-muted">
                  v{v.version} · {v.fileCount} fichiers · {new Date(v.createdAt).toLocaleDateString()}
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="flex flex-1 flex-col md:flex-row">
        {selected ? (
          <>
            <div className="w-full border-b border-line bg-card md:w-64 md:border-b-0 md:border-r">
              <div className="flex items-center justify-between border-b border-line p-3">
                <span className="text-xs font-medium text-muted">
                  {selected.projectName} · v{selected.version}
                </span>
                <button
                  onClick={() => downloadVersion(selected.id, selected.projectName, selected.version)}
                  className="text-brand hover:text-brand/80"
                  title="Télécharger le zip"
                >
                  <Download size={16} />
                </button>
              </div>
              <div className="max-h-[30vh] overflow-y-auto md:max-h-[calc(100vh-49px)]">
                {(selected.files || []).map((f) => (
                  <button
                    key={f.path}
                    onClick={() => setSelectedFile(f)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-surface ${
                      selectedFile?.path === f.path ? "bg-surface text-brand" : "text-body"
                    }`}
                  >
                    <FileCode size={14} className="shrink-0" />
                    <span className="truncate">{f.path}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-surface p-4">
              {loading && <p className="text-xs text-muted">Chargement...</p>}
              {!loading && selectedFile && (
                <>
                  <p className="mb-2 text-xs font-medium text-muted">{selectedFile.path}</p>
                  <pre className="whitespace-pre-wrap break-words rounded-lg border border-line bg-card p-4 text-xs">
                    {selectedFile.content}
                  </pre>
                </>
              )}
              {!loading && !selectedFile && (
                <p className="text-xs text-muted">Sélectionne un fichier à gauche.</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted">
            Sélectionne un projet dans la liste pour voir ses fichiers.
          </div>
        )}
      </main>
    </div>
  );
}
