"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Desk" },
  { href: "/evals", label: "Evals" },
  { href: "/how", label: "How it works" },
];

export function TopBar() {
  const path = usePathname();
  return (
    <header className="bar">
      <Link href="/" className="bar__brand">
        <span className="bar__name">
          Claim Desk <span>/ device protection triage</span>
        </span>
        <span className="bar__tag">An agent built on Likewize&apos;s public plan terms, by Jaswanth Karjala Eshwar</span>
      </Link>
      <nav className="bar__nav">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
        <a href="https://github.com/jaswanthkarjalaeshwar/likewize-claim-triage">Code</a>
      </nav>
    </header>
  );
}
