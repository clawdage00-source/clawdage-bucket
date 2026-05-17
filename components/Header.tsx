"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, UserRound, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  MobileServicesTools,
  ServicesMegaPanel,
  ServicesNavTrigger,
} from "@/components/header-services-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/lib/supabase/auth-actions";
import { cn } from "@/lib/utils";
import type { HeaderUser } from "@/types/session";

const nav = [
  { href: "/pricing", label: "Pricing" },
  { href: "/how-it-works", label: "How it Works" },
] as const;

type HeaderProps = {
  user: HeaderUser | null;
};

const SCROLL_THRESHOLD_PX = 12;
const BRAND_ICON_SRC = "/Group 1000001054.png";

export function Header({ user }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const servicesCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const showSolidHeader = scrolled || mobileOpen || menuOpen || servicesOpen;

  const clearServicesCloseTimer = () => {
    if (servicesCloseTimer.current) {
      clearTimeout(servicesCloseTimer.current);
      servicesCloseTimer.current = null;
    }
  };

  const openServices = () => {
    clearServicesCloseTimer();
    setServicesOpen(true);
  };

  const scheduleCloseServices = () => {
    clearServicesCloseTimer();
    servicesCloseTimer.current = setTimeout(() => setServicesOpen(false), 140);
  };

  const mobileMenu = mounted
    ? createPortal(
        <AnimatePresence>
          {mobileOpen ? (
            <div className="fixed inset-0 z-[100] md:hidden" key="mobile-menu">
              <motion.button
                type="button"
                className="absolute inset-0 bg-black/50"
                aria-label="Close menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                role="dialog"
                aria-modal="true"
                aria-label="Navigation menu"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 340, damping: 32 }}
                className="absolute right-0 top-0 flex h-full w-[min(92vw,22rem)] flex-col border-l border-border bg-background shadow-2xl"
              >
                <div className="relative z-10 flex min-h-0 flex-1 flex-col bg-background">
                  <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-5">
                    <span className="text-lg font-bold text-foreground">Menu</span>
                    <button
                      type="button"
                      className="rounded-xl border border-border p-2.5 text-foreground"
                      onClick={() => setMobileOpen(false)}
                      aria-label="Close menu"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {user ? (
                    <div className="shrink-0 border-b border-border px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                          {user.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- remote Google avatars; avoids remotePatterns config
                            <img
                              src={user.avatarUrl}
                              alt=""
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserRound className="h-6 w-6 text-muted-foreground" aria-hidden />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-foreground">
                            {user.displayName}
                          </p>
                          {user.email ? (
                            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <nav
                    className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-4 py-5"
                    aria-label="Mobile"
                  >
                    <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Navigate
                    </p>
                    <MobileServicesTools onNavigate={() => setMobileOpen(false)} />
                    {nav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-xl px-4 py-3.5 text-xl font-semibold text-foreground transition hover:bg-muted active:bg-muted"
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                    {user ? (
                      <Link
                        href="/dashboard"
                        className="rounded-xl px-4 py-3.5 text-xl font-semibold text-foreground transition hover:bg-muted active:bg-muted"
                        onClick={() => setMobileOpen(false)}
                      >
                        Dashboard
                      </Link>
                    ) : null}

                    {user ? (
                      <>
                        <p className="mb-2 mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Account
                        </p>
                        <Link
                          href="/profile"
                          className="rounded-xl px-4 py-3.5 text-xl font-semibold text-foreground transition hover:bg-muted active:bg-muted"
                          onClick={() => setMobileOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          href="/account"
                          className="rounded-xl px-4 py-3.5 text-xl font-semibold text-foreground transition hover:bg-muted active:bg-muted"
                          onClick={() => setMobileOpen(false)}
                        >
                          My Account
                        </Link>
                        <Link
                          href="/subscription"
                          className="rounded-xl px-4 py-3.5 text-xl font-semibold text-foreground transition hover:bg-muted active:bg-muted"
                          onClick={() => setMobileOpen(false)}
                        >
                          Subscription
                        </Link>
                        <form action={signOut} className="mt-1">
                          <button
                            type="submit"
                            className="w-full rounded-xl px-4 py-3.5 text-left text-xl font-semibold text-foreground transition hover:bg-muted active:bg-muted"
                          >
                            Logout
                          </button>
                        </form>
                      </>
                    ) : null}
                  </nav>

                  {!user ? (
                    <div className="shrink-0 border-t border-border px-4 py-5">
                      <div className="flex flex-col gap-3">
                        <Link
                          href="/login"
                          className="rounded-xl border border-border px-4 py-4 text-center text-lg font-semibold text-foreground"
                          onClick={() => setMobileOpen(false)}
                        >
                          Login
                        </Link>
                        <Link
                          href="/login"
                          className="rounded-xl bg-[#251EFF] px-4 py-4 text-center text-lg font-semibold text-white transition hover:bg-[#1e18cc]"
                          onClick={() => setMobileOpen(false)}
                        >
                          Get Started
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.aside>
            </div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )
    : null;

  return (
    <>
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex w-full flex-col border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out",
        mobileOpen || servicesOpen
          ? "border-border bg-background shadow-sm"
          : showSolidHeader
            ? "border-border/90 bg-background/95 shadow-none backdrop-blur-md"
            : "border-transparent bg-transparent shadow-none backdrop-blur-none",
      )}
      onMouseLeave={scheduleCloseServices}
    >
      <div
        className="flex w-full flex-col"
        onMouseEnter={clearServicesCloseTimer}
      >
      <div className="flex w-full items-center justify-between gap-3 px-4 py-2.5 sm:px-5 sm:py-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4 md:px-6 md:py-3 lg:px-8">
        <div className="flex min-w-0 shrink-0 items-center justify-start">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center py-0.5"
            aria-label="Clawdage home"
          >
            <Image
              src={BRAND_ICON_SRC}
              alt="Clawdage"
              width={48}
              height={48}
              className="h-8 w-8 object-contain md:hidden"
              priority
            />
            <Image
              src="/text-logo.png"
              alt="Clawdage"
              width={320}
              height={40}
              className="hidden h-auto w-auto object-contain object-left dark:brightness-0 dark:invert md:block md:max-h-3 lg:max-h-3.5 xl:max-h-4 2xl:max-h-[1.125rem]"
              priority
            />
          </Link>
        </div>

        <nav
          className="hidden items-center justify-center gap-2 text-xs font-medium md:flex md:gap-3 md:text-sm lg:gap-5 xl:gap-6"
          aria-label="Main"
        >
          <div
            className="hidden md:block"
            onMouseEnter={openServices}
          >
            <ServicesNavTrigger open={servicesOpen} />
          </div>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <Link href="/dashboard" className="text-muted-foreground transition hover:text-foreground">
              Dashboard
            </Link>
          ) : null}
        </nav>

        <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 md:gap-3">
          <div className="hidden items-center gap-2 md:flex md:gap-3">
          <ThemeToggle />
          {user ? (
            <>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex max-w-[min(100%,16rem)] items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2 text-foreground transition hover:bg-muted"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
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
                      <UserRound className="h-4 w-4 text-muted-foreground" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 shrink truncate text-left text-sm font-medium text-foreground">
                    {user.displayName}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-popover py-1 shadow-md"
                  >
                    <Link
                      role="menuitem"
                      href="/profile"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      role="menuitem"
                      href="/account"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Account
                    </Link>
                    <Link
                      role="menuitem"
                      href="/subscription"
                      className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => setMenuOpen(false)}
                    >
                      Subscription
                    </Link>
                    <form action={signOut} className="border-t border-border pt-1">
                      <button
                        type="submit"
                        role="menuitem"
                        className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
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
                className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted sm:px-4"
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

          <ThemeToggle className="md:hidden" />
          <button
            type="button"
            className="inline-flex shrink-0 rounded-lg border border-border p-2 text-foreground md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {servicesOpen ? (
          <div className="hidden md:block" onMouseEnter={openServices}>
            <ServicesMegaPanel onNavigate={() => setServicesOpen(false)} />
          </div>
        ) : null}
      </AnimatePresence>
      </div>

    </header>
    {mobileMenu}
    </>
  );
}