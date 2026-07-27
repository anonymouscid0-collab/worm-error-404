import Link from "next/link";

const links = [
  { href: "/premium", label: "Premium" },
  { href: "/about", label: "À propos" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-bold text-white">
            W
          </span>
          WORM ERROR // 404
        </Link>
        <div className="hidden gap-8 text-sm text-muted md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-ink">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-muted transition hover:text-ink">
            Connexion
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-brand px-4 py-2 font-medium text-white transition hover:bg-brand-dark"
          >
            S'inscrire
          </Link>
        </div>
      </nav>
    </header>
  );
}
