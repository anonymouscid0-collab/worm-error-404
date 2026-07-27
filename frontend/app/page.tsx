import { Code2, Bug, MessageSquare, History, Paperclip, Download } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DescriptionCta, { ActionButtons } from "@/components/DescriptionCta";

const presentation = [
  "WORM ERROR // 404 est une intelligence artificielle conçue pour accompagner les développeurs et automatiser la création de solutions logicielles. Véritable développeur Full Stack Senior, elle est capable de concevoir des projets complets à partir d'une simple description, en générant le frontend, le backend, les bases de données et tous les fichiers nécessaires.",
  "Elle peut analyser, détecter et corriger les bugs de votre code, puis vous renvoyer les fichiers corrigés. Elle répond à vos questions avec précision, comprend le langage naturel et vous permet d'échanger avec elle comme avec un développeur expérimenté.",
  "Grâce à ses capacités de recherche en temps réel, WORM ERROR // 404 fournit des réponses rapides, pertinentes et à jour. Que ce soit pour le développement web, les applications mobiles, les API, l'automatisation ou d'autres domaines de l'informatique, elle vous accompagne de l'idée jusqu'au projet final.",
  "Son objectif est simple : transformer vos idées en solutions fonctionnelles, rapidement et efficacement.",
];

const aboutCid = [
  "Je suis CID, un jeune développeur passionné par l'informatique, le développement logiciel et la cybersécurité. Je suis actuellement en pleine phase d'apprentissage et je cherche chaque jour à améliorer mes compétences en créant de nouveaux projets et en relevant de nouveaux défis.",
  "Je m'intéresse principalement au développement web, aux applications, à l'intelligence artificielle et à la sécurité informatique. J'aime comprendre le fonctionnement des technologies, résoudre des problèmes et apprendre de nouvelles méthodes de développement.",
  "À travers mes projets, je développe progressivement mon expérience tout en construisant des solutions utiles et modernes. Mon objectif est de devenir un développeur expérimenté et de me spécialiser davantage dans la cybersécurité et les technologies innovantes.",
  "Pour moi, chaque ligne de code est une occasion d'apprendre, de progresser et de créer quelque chose de meilleur qu'hier.",
];

const capabilities = [
  "Python", "JavaScript", "TypeScript", "Node.js", "PHP", "Java",
  "C", "C++", "C#", "Go", "HTML", "CSS", "SQL", "API",
  "DevOps", "Cybersécurité", "Développement Web", "Applications mobiles", "Automatisation",
];

const chatFeatures = [
  [Code2, "Génération de code", "Projets complets : frontend, backend, base de données, fichiers de config."],
  [Bug, "Correction de bugs", "Analyse ton code, détecte l'erreur, renvoie les fichiers corrigés."],
  [MessageSquare, "Conversation naturelle", "Échange en langage naturel, comme avec un développeur expérimenté."],
  [History, "Historique des discussions", "Reprends chaque conversation exactement où tu l'as laissée."],
  [Paperclip, "Analyse de fichiers", "Images, captures d'écran et archives ZIP directement dans le chat."],
  [Download, "Téléchargement des réponses", "Récupère le résultat sous forme de fichiers prêts à l'emploi."],
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <section className="bg-hero-gradient px-6 py-20 text-center sm:py-28">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            WORM ERROR // 404
          </h1>
          <p className="mt-4 text-base text-white/80 sm:text-lg">
            L'intelligence artificielle pensée pour les développeurs.
          </p>
          <div className="mt-9 flex justify-center">
            <ActionButtons />
          </div>
        </div>
      </section>

      <section className="bg-card py-16">
        <div className="mx-auto max-w-3xl space-y-12 px-6">
          {presentation.map((p, i) => (
            <DescriptionCta key={i} text={p} />
          ))}
        </div>
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
            À propos
          </h2>
          <h3 className="mb-8 text-2xl font-bold text-brand-dark sm:text-3xl">CID</h3>
          <div className="space-y-12">
            {aboutCid.map((p, i) => (
              <DescriptionCta key={i} text={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
          Interface
        </h2>
        <h3 className="mb-8 text-2xl font-bold text-brand-dark sm:text-3xl">
          Une interface de chat pensée pour coder
        </h3>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {chatFeatures.map(([Icon, title, desc]) => (
            <div
              key={title}
              className="rounded-xl border border-line bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand">
                <Icon size={20} />
              </div>
              <p className="mb-1.5 text-sm font-semibold text-brand-dark">{title}</p>
              <p className="text-sm leading-relaxed text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
            Capacités
          </h2>
          <h3 className="mb-8 text-2xl font-bold text-white sm:text-3xl">
            Un stack technique complet
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {capabilities.map((cap) => (
              <span
                key={cap}
                className="rounded-full border border-brand/30 bg-white/5 px-4 py-1.5 text-xs text-brand"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl border border-line bg-brand-light p-8 text-center md:p-12">
          <h3 className="mb-3 text-2xl font-bold text-brand-dark">
            15 messages gratuits, sans carte requise
          </h3>
          <p className="mx-auto mb-6 max-w-xl text-sm leading-relaxed text-brand-dark">
            Chaque nouveau compte dispose de 15 messages gratuits pour tester WORM ERROR // 404.
            Une fois la limite atteinte, passe au plan Pro grâce à une clé d'activation Premium.
          </p>
          <p className="mb-6 text-3xl font-bold text-brand">
            10 $ <span className="text-base font-normal text-brand-dark">/ plan Pro</span>
          </p>
          <div className="flex justify-center">
            <ActionButtons />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
