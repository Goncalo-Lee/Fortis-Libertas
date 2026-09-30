'use client'

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

interface Link {
  href: string;
  label: string;
}

const links: Link[] = [
  { href: "/docs", label: "DOCS" },
  { href: "/roadmap", label: "ROADMAP" },
  { href: "/recources", label: "RECOURCES" },
];

export function Navbar() {

  const [open, setOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <header>
      <div>

        <Link href="/">
          Fortis Libertas
        </Link>

        <div>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Change Theme"
          >
            {/* Sol: visible in the dark mode */}

            {/* Lua: visible in the white mode */}
          </button>

          <button
            onClick={() => setOpen((open) => !open)}
            aria-label={open ? "Close Menu" : "Open Menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
          </button>
        </div>
      </div>

        {open && (
          <nav>
            <ul>
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
    </header>
  )
}
