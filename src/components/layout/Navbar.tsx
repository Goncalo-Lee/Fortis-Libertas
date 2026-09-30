'use client'

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { SunIcon } from "../icons/sun-icon";
import { MoonIcon } from "../icons/moon-icon";
import { Button } from "../ui/button"
import { HamburgerIcon } from "../icons/hamburger-icon";
import { CloseIcon } from "../icons/close-icon";

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
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="flex h-14 items-center justify-between px-4">

        <Link href="/" className="font-semibold tracking-tight">
          Fortis Libertas
        </Link>

        <div className="flex items-center gap-1">
          <Button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Change Theme"
          >
            {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
          </Button>

          <Button
            onClick={() => setOpen((open) => !open)}
            aria-label={open ? "Close Menu" : "Open Menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <CloseIcon />: <HamburgerIcon />}
            </svg>
          </Button>
        </div>
      </div>

        {open && (
          <nav id="mobile-menu" className="border-t border-neutral-200 md:hidden dark:border-neutral-800">
            <ul className="flex flex-col gap-1 p-4">
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
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
