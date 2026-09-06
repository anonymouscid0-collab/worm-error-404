import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { AiChatMessage } from "./aiService";
import { callWithFallback, ProviderKey } from "./providerManager";
import { prisma } from "../config/prisma";

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface ProjectGenerationResult {
  ok: boolean;
  projectName?: string;
  files?: GeneratedFile[];
  zipUrl?: string;
  zipFileName?: string;
  version?: number;
  ciType?: "flutter" | "android-native" | null;
  error?: string;
}

const MAX_FILES = 40;
const MAX_TOTAL_CHARS = 400_000;

function detectMobileCI(files: GeneratedFile[]): "flutter" | "android-native" | null {
  const hasPubspec = files.some((f) => f.path.toLowerCase().endsWith("pubspec.yaml"));
  if (hasPubspec) return "flutter";
  const hasGradle = files.some((f) => /(^|\/)build\.gradle(\.kts)?$/i.test(f.path));
  if (hasGradle) return "android-native";
  return null;
}

function flutterCiWorkflow(): string {
  return `name: Build Mobile App

on:
  push:
    branches: [ main ]
  workflow_dispatch: {}

jobs:
  build-android:
    name: Build Android APK
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter pub get
      - run: flutter build apk --release
      - uses: actions/upload-artifact@v4
        with:
          name: app-release-apk
          path: build/app/outputs/flutter-apk/app-release.apk

  build-ios:
    name: Build iOS (non signé, nécessite un compte Apple Developer pour installer)
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter pub get
      - run: flutter build ios --release --no-codesign
      - uses: actions/upload-artifact@v4
        with:
          name: app-ios-build
          path: build/ios/iphoneos
`;
}

function androidNativeCiWorkflow(): string {
  return `name: Build Android APK

on:
  push:
    branches: [ main ]
  workflow_dispatch: {}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
      - run: chmod +x ./gradlew
      - run: ./gradlew assembleDebug
      - uses: actions/upload-artifact@v4
        with:
          name: app-debug-apk
          path: '**/build/outputs/apk/debug/*.apk'
`;
}

export async function generateProjectFiles(
  history: AiChatMessage[],
  providers: ProviderKey[],
  reasoning: { recommendedStack: string[] },
  userId?: string
): Promise<ProjectGenerationResult> {
  const instruction = `Tu dois générer un projet complet basé sur la demande de l'utilisateur.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans balises markdown, au format exact :
{"projectName": "nom-du-projet", "files": [{"path": "chemin/relatif/fichier.ext", "content": "contenu complet du fichier"}]}

Contraintes :
- Génère au maximum ${MAX_FILES} fichiers, uniquement les fichiers essentiels et fonctionnels.
- Chaque fichier doit avoir un contenu réel et complet, jamais de "// TODO" à la place du code.
- Stack recommandée si pertinente : ${reasoning.recommendedStack.join(", ") || "au choix selon la demande"}.
- Si c'est un projet Flutter, inclus un pubspec.yaml correct et complet.
- Si c'est un projet Android natif, inclus build.gradle et la structure Gradle minimale correcte.
- N'inclus pas node_modules ni de fichiers binaires.`;

  const messages: AiChatMessage[] = [
    { role: "system", content: instruction },
    ...history,
  ];

  const result = await callWithFallback(messages, providers, { maxTokens: 8000, temperature: 0.4 });

  if (!result.ok || !result.content) {
    return { ok: false, error: result.error || "Réponse vide de tous les fournisseurs." };
  }

  const raw: string = result.content;

  const jsonText = extractJson(raw);
  if (!jsonText) {
    return { ok: false, error: "Réponse du modèle non exploitable (pas de JSON détecté)." };
  }

  let parsed: { projectName?: string; files?: GeneratedFile[] };
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "JSON invalide renvoyé par le modèle." };
  }

  if (!parsed.files || !Array.isArray(parsed.files) || parsed.files.length === 0) {
    return { ok: false, error: "Aucun fichier généré." };
  }

  const files = parsed.files
    .filter((f) => f && typeof f.path === "string" && typeof f.content === "string")
    .slice(0, MAX_FILES);

  const totalChars = files.reduce((sum, f) => sum + f.content.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) {
    return { ok: false, error: "Projet généré trop volumineux, reformule une demande plus précise." };
  }

  const projectName = (parsed.projectName || "worm-project")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .slice(0, 60);

  const ciType = detectMobileCI(files);
  if (ciType === "flutter") {
    files.push({ path: ".github/workflows/build-mobile.yml", content: flutterCiWorkflow() });
  } else if (ciType === "android-native") {
    files.push({ path: ".github/workflows/build-android.yml", content: androidNativeCiWorkflow() });
  }

  const zip = new JSZip();
  for (const file of files) {
    const safePath = file.path.replace(/^\/+/, "").replace(/\.\.(\/|\\)/g, "");
    zip.file(safePath, file.content);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  const uploadsDir = path.join(process.cwd(), "uploads", "projects");
  fs.mkdirSync(uploadsDir, { recursive: true });

  const zipFileName = `${projectName}-${Date.now()}.zip`;
  fs.writeFileSync(path.join(uploadsDir, zipFileName), zipBuffer);
  const zipUrl = `/uploads/projects/${zipFileName}`;

  let version = 1;
  if (userId) {
    try {
      const previous = await prisma.projectVersion.findFirst({
        where: { userId, projectName },
        orderBy: { version: "desc" },
      });
      version = (previous?.version || 0) + 1;
      await prisma.projectVersion.create({
        data: { userId, projectName, version, fileCount: files.length, zipUrl },
      });
    } catch (err) {
      console.error("ProjectVersion tracking error:", err);
    }
  }

  return { ok: true, projectName, files, zipUrl, zipFileName, version, ciType };
}

function extractJson(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return candidate.slice(start, end + 1);
}
