import Link from "next/link";

import { CatMark } from "./cat-mark";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Analytics" },
  { href: "/billing", label: "Pricing" },
  { href: "/onboarding", label: "Onboarding" }
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand-lockup">
        <CatMark />
        <div>
          <span className="eyebrow">Project Blacktube</span>
          <strong>Purrify Music</strong>
        </div>
      </Link>

      <nav className="site-nav" aria-label="Primary">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

