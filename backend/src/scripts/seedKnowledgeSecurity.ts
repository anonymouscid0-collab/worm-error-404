import "dotenv/config";
import { addKnowledge } from "../services/v4/knowledgeEngine";
import { prisma } from "../config/prisma";

const TOPICS: { title: string; tags: string[] }[] = [
  { title: "Cybersécurité : le triangle CIA (Confidentialité, Intégrité, Disponibilité)", tags: ["security", "fundamentals"] },
  { title: "Cybersécurité : notions de risque, menace et vulnérabilité", tags: ["security", "fundamentals", "risk"] },
  { title: "Cybersécurité : contrôles de sécurité (préventifs, détectifs, correctifs)", tags: ["security", "controls"] },
  { title: "Réseaux : modèle OSI et TCP/IP appliqués à la sécurité", tags: ["security", "networking"] },
  { title: "Réseaux : TLS/SSL, fonctionnement du chiffrement en transit", tags: ["security", "tls", "cryptography"] },
  { title: "Authentification : MFA et bonnes pratiques", tags: ["security", "authentication", "mfa"] },
  { title: "Contrôle d'accès : RBAC vs ABAC", tags: ["security", "access-control", "iam"] },
  { title: "OWASP Top 10 : vue d'ensemble", tags: ["security", "owasp", "appsec"] },
  { title: "Sécurité applicative : validation des entrées et injections", tags: ["security", "appsec", "secure-coding"] },
  { title: "Sécurité des sessions et des cookies", tags: ["security", "sessions", "web"] },
  { title: "Cryptographie : hachage vs chiffrement, cas d'usage", tags: ["security", "cryptography"] },
  { title: "SOC : rôle et fonctionnement d'un centre d'opérations de sécurité", tags: ["security", "soc", "analyst"] },
  { title: "SIEM : principes et analyse de logs", tags: ["security", "siem", "log-analysis"] },
  { title: "Détection : notions du framework MITRE ATT&CK", tags: ["security", "mitre", "detection"] },
  { title: "Réponse à incident : les phases (préparation à retour à la normale)", tags: ["security", "incident-response"] },
  { title: "Threat Intelligence : IOC et TTP, notions de base", tags: ["security", "threat-intel"] },
  { title: "Forensics numérique : principes de préservation de la preuve", tags: ["security", "forensics"] },
  { title: "Sécurité cloud : IAM et principe du moindre privilège", tags: ["security", "cloud", "iam"] },
  { title: "Sécurité des dépendances : SCA, SBOM, gestion des vulnérabilités", tags: ["security", "supply-chain", "sca"] },
  { title: "Normes de sécurité : NIST CSF, ISO 27001, CIS Controls", tags: ["security", "standards", "compliance"] },
];

async function generateOne(topic: { title: string; tags: string[] }) {
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || "https://openrouter.ai/api/v1/chat/completions";
  const model = process.env.AI_MODEL || "openrouter/free";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://worm-error-404.onrender.com",
      "X-Title": "WORM ERROR 404 - Knowledge Seed",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Tu es un rédacteur technique senior spécialisé en cybersécurité défensive. Réponds en français, " +
            "de façon dense et précise, avec des exemples concrets quand c'est pertinent. Reste strictement " +
            "conceptuel et défensif : explique les principes, la détection et la prévention, jamais de technique " +
            "d'attaque opérationnelle ni de code d'exploitation. Pas d'introduction, pas de conclusion, " +
            "va directement au contenu technique. 200 à 400 mots.",
        },
        { role: "user", content: `Rédige une fiche de connaissance technique sur : ${topic.title}` },
      ],
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erreur API (${response.status}) pour "${topic.title}"`);
  }

  const data: any = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Réponse vide pour "${topic.title}"`);

  return content as string;
}

async function main() {
  console.log(`Génération de ${TOPICS.length} fiches de connaissance (Cybersécurité)...`);

  for (const topic of TOPICS) {
    try {
      const existing = await prisma.knowledgeEntry.findFirst({ where: { title: topic.title } });
      if (existing) {
        console.log(`⏭  déjà présent : ${topic.title}`);
        continue;
      }

      console.log(`⏳ génération : ${topic.title}`);
      const content = await generateOne(topic);

      await addKnowledge({
        title: topic.title,
        content,
        tags: [...topic.tags, "seed"],
        source: "ai-seed",
        language: "security",
      });

      console.log(`✅ enregistré : ${topic.title}`);

      await new Promise((r) => setTimeout(r, 3500));
    } catch (err) {
      console.error(`❌ échec pour "${topic.title}" :`, (err as Error).message);
    }
  }

  console.log("Terminé.");
  await prisma.$disconnect();
}

main();
