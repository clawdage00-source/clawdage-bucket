import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SiteContactBlock } from "@/components/site-contact-block";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/brand";

const BRAND_ICON_SRC = "/Group 1000001054.png";

type IconProps = { className?: string };

function GithubIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A8.205 8.205 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function TwitterIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.241-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0 1.622c-3.16 0-3.532.012-4.769.068-1.17.053-1.805.249-2.227.413-.56.217-.96.477-1.381.898-.42.42-.68.82-.898 1.381-.164.422-.36 1.057-.413 2.227-.056 1.237-.068 1.609-.068 4.769s.012 3.532.068 4.769c.053 1.17.249 1.805.413 2.227.217.56.477.96.898 1.381.42.42.82.68 1.381.898.422.164 1.057.36 2.227.413 1.237.056 1.609.068 4.769.068s3.532-.012 4.769-.068c1.17-.053 1.805-.249 2.227-.413.56-.217.96-.477 1.381-.898.42-.42.68-.82.898-1.381.164-.422.36-1.057.413-2.227.056-1.237.068-1.609.068-4.769s-.012-3.532-.068-4.769c-.053-1.17-.249-1.805-.413-2.227-.217-.56-.477-.96-.898-1.381-.42-.42-.82-.68-1.381-.898-.164-.422-.36-1.057-.413-2.227-.056-1.237-.068-1.609-.068-4.769zm0 3.351a5.864 5.864 0 1 1 0 11.728 5.864 5.864 0 0 1 0-11.728zm0 1.622a4.242 4.242 0 1 0 0 8.484 4.242 4.242 0 0 0 0-8.484zm6.406-4.845a1.37 1.37 0 1 1-2.74 0 1.37 1.37 0 0 1 2.74 0z" />
    </svg>
  );
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#tools", label: "Tools" },
  { href: "/blog", label: "Guides" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
  { href: "/aadhaar-photo-resize-online", label: "Aadhaar resize" },
] as const;

const SOCIAL: {
  href: string;
  label: string;
  renderIcon: () => React.ReactNode;
}[] = [
  {
    href: "https://github.com",
    label: "GitHub",
    renderIcon: () => <GithubIcon className="h-4 w-4" />,
  },
  {
    href: "https://twitter.com",
    label: "Twitter",
    renderIcon: () => <TwitterIcon className="h-4 w-4" />,
  },
  {
    href: "https://instagram.com",
    label: "Instagram",
    renderIcon: () => <InstagramIcon className="h-4 w-4" />,
  },
  {
    href: "/#tools",
    label: "Search",
    renderIcon: () => <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden />,
  },
];

function FooterLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const isExternal = href.startsWith("http") || href.startsWith("mailto:");
  const base =
    "text-sm leading-loose text-foreground transition-opacity hover:opacity-70 " + className;

  if (isExternal) {
    return (
      <a href={href} className={base}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={base}>
      {children}
    </Link>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-background text-foreground">
      {/* Section 1 — Information columns */}
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-16 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-3 md:gap-10 lg:gap-16">
          <div>
            <p className="text-xl font-bold tracking-tight text-foreground">{SITE_NAME}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{SITE_TAGLINE}</p>
            <nav className="mt-8" aria-label="Footer navigation">
              <ul className="flex flex-col gap-1">
                {NAV_LINKS.map(({ href, label }) => (
                  <li key={label}>
                    <FooterLink href={href}>{label}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex flex-col items-start text-left md:items-center md:text-center">
            <SiteContactBlock variant="links" align="left" className="md:items-center md:text-center" />
            <div className="mt-6 flex flex-wrap items-center justify-start gap-2 md:justify-center">
              {SOCIAL.map(({ href, label, renderIcon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-foreground transition-colors hover:bg-muted/80"
                  {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {renderIcon()}
                </a>
              ))}
            </div>
          </div>

          <SiteContactBlock variant="address" align="right" className="md:ml-auto" />
        </div>
      </div>

      {/* Section 2 — Legal & copyright */}
      <div className="mx-auto max-w-7xl border-t border-border px-6 py-6 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-3 text-xs text-muted-foreground sm:grid-cols-3 sm:items-center sm:gap-4">
          <p className="text-center sm:text-left">
            © {year} {SITE_NAME}. All Rights Reserved.
          </p>
          <p className="text-center">
            <Link
              href="/terms"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms &amp; Conditions
            </Link>
          </p>
          <p className="text-center sm:text-right">
            <Link
              href="/privacy"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      {/* Section 3 — Brand mark (centered) */}
      <div className="flex w-full justify-center bg-background px-4 pb-12 pt-10 sm:px-6 sm:pb-14 sm:pt-12 md:px-8 lg:px-10">
        <Image
          src={BRAND_ICON_SRC}
          alt={SITE_NAME}
          width={400}
          height={400}
          className="h-[clamp(4rem,14vw,7.5rem)] w-auto select-none object-contain"
          priority
        />
      </div>
    </footer>
  );
}
