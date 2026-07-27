import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WORM ERROR // 404 — L'IA pensée pour les développeurs",
  description:
    "WORM ERROR // 404 est une intelligence artificielle conçue pour accompagner les développeurs : génération de projets complets, correction de bugs, chat en langage naturel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-surface text-ink antialiased">{children}</body>
    </html>
  );
}
