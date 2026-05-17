"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AuthSessionSync } from "@/components/account/auth-session-sync";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", label: "Overview" },
  { href: "/profile", label: "Profile" },
  { href: "/subscription", label: "Subscription" },
] as const;

type SettingsShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  contentClassName?: string;
};

export function SettingsShell({
  title,
  description,
  children,
  contentClassName,
}: SettingsShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <AuthSessionSync />

      <div className="border-b border-border bg-background md:hidden">
        <nav
          className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 sm:px-6"
          aria-label="Account"
        >
          {NAV.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10 md:flex-row md:items-start md:gap-10 lg:gap-14 lg:py-12">
        <aside className="hidden shrink-0 md:block md:w-52 lg:w-56">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Account
          </p>
          <nav className="mt-5 flex flex-col gap-1" aria-label="Account settings">
            {NAV.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className={cn("min-w-0 flex-1", contentClassName ?? "max-w-3xl")}>
          <header className="mb-10 border-b border-border pb-8 lg:mb-12 lg:pb-10">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
            {description ? (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
