"use client";

import { ChevronDown, Menu, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { signOut } from "@/lib/supabase/auth-actions";
import { cn } from "@/lib/utils";
import type { HeaderUser } from "@/types/session";

const nav = [
  { href: "/", label: "All Tools" },
  { href: "/pricing", label: "Pricing" },
  { href: "/how-it-works", label: "How it Works" },
] as const;

type HeaderProps = {
  user: HeaderUser | null;
};

const SCROLL_THRESHOLD_PX = 12;

export function Header({ user }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const showSolidHeader = scrolled || mobileOpen || menuOpen;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out",
        showSolidHeader
          ? "border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md"
          : "border-transparent bg-transparent shadow-none backdrop-blur-none",
      )}
    >
      <div className="flex w-full items-center justify-between gap-3 px-4 py-2.5 sm:px-5 sm:py-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4 md:px-6 md:py-3 lg:px-8">
        <div className="flex min-w-0 shrink-0 items-center justify-start">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center py-0.5"
            aria-label="Clawdage home"
          >
            <Image
              src="/text-logo.png"
              alt="Clawdage"
              width={320}
              height={40}
              className="h-auto w-auto max-h-2.5 object-contain object-left sm:max-h-3 md:max-h-3 lg:max-h-3.5 xl:max-h-4 2xl:max-h-[1.125rem]"
              priority
            />
          </Link>
        </div>

        <nav
          className="hidden items-center justify-center gap-2 text-xs font-medium md:flex md:gap-3 md:text-sm lg:gap-5 xl:gap-6"
          aria-label="Main"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-slate-700 transition hover:text-black"
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <Link href="/dashboard" className="text-slate-700 transition hover:text-black">
              Dashboard
            </Link>
          ) : null}
        </nav>

        <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 md:gap-3">
          <div className="hidden items-center gap-2 md:flex md:gap-3">
          {user ? (
            <>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex max-w-[min(100%,16rem)] items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-2 text-black transition hover:bg-slate-50"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote Google avatars; avoids remotePatterns config
                      <img
                        src={user.avatarUrl}
                        alt=""
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-4 w-4 text-slate-600" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 shrink truncate text-left text-sm font-medium text-slate-800">
                    {user.displayName}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                </button>
                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-md"
                  >
                    <Link
                      role="menuitem"
                      href="/profile"
                      className="block px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      role="menuitem"
                      href="/account"
                      className="block px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      role="menuitem"
                      href="/subscription"
                      className="block px-4 py-2 text-sm text-slate-800 hover:bg-slate-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Subscription
                    </Link>
                    <form action={signOut} className="border-t border-slate-100 pt-1">
                      <button
                        type="submit"
                        role="menuitem"
                        className="w-full px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
                      >
                        Logout
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-black transition hover:bg-slate-50 sm:px-4"
              >
                Login
              </Link>
              <Link
                href="/login"
                className="rounded-xl bg-[#251EFF] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#1e18cc] sm:px-4"
              >
                Get Started
              </Link>
            </>
          )}
          </div>

          <button
            type="button"
            className="inline-flex shrink-0 rounded-lg border border-slate-200 p-2 text-black md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <span className="text-sm font-bold text-black">Menu</span>
              <button
                type="button"
                className="rounded-lg p-2 text-black"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 px-4 py-4" aria-label="Mobile">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {user ? (
                <Link
                  href="/dashboard"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
              ) : null}
            </nav>
            <div className="border-t border-slate-200 px-4 py-4">
              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="mb-1 flex items-center gap-3 border-b border-slate-100 px-3 pb-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- remote Google avatars; avoids remotePatterns config
                        <img
                          src={user.avatarUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-5 w-5 text-slate-600" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-black">{user.displayName}</p>
                      {user.email ? (
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      ) : null}
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/account"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    My Account
                  </Link>
                  <Link
                    href="/subscription"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    Subscription
                  </Link>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                    >
                      Logout
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-black"
                    onClick={() => setMobileOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-xl bg-[#251EFF] px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-[#1e18cc]"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
