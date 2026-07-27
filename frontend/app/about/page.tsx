import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const paragraphs = [
  "Je suis CID, un jeune développeur passionné par l'informatique, le développement logiciel et la cybersécurité. Je suis actuellement en pleine phase d'apprentissage et je cherche chaque jour à améliorer mes compétences en créant de nouveaux projets et en relevant de nouveaux défis.",
  "Je m'intéresse principalement au développement web, aux applications, à l'intelligence artificielle et à la sécurité informatique. J'aime comprendre le fonctionnement des technologies, résoudre des problèmes et apprendre de nouvelles méthodes de développement.",
  "À travers mes projets, je développe progressivement mon expérience tout en construisant des solutions utiles et modernes. Mon objectif est de devenir un développeur expérimenté et de me spécialiser davantage dans la cybersécurité et les technologies innovantes.",
  "Pour moi, chaque ligne de code est une occasion d'apprendre, de progresser et de créer quelque chose de meilleur qu'hier.",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">
          À propos
        </h2>
        <h1 className="mb-8 text-3xl font-bold text-ink sm:text-4xl">CID</h1>
        <div className="space-y-5">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-body">
              {p}
            </p>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
