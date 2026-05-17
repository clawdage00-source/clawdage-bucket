import { MapPin, Phone } from "lucide-react";

import {
  SITE_CONTACT,
  siteContactMailto,
  siteContactMapsUrl,
  siteContactTel,
} from "@/lib/site-contact";

type SiteContactBlockProps = {
  className?: string;
  align?: "left" | "center" | "right";
  /** full = email + phone + address; links = email + phone; address = address only */
  variant?: "full" | "links" | "address";
};

export function SiteContactBlock({
  className = "",
  align = "left",
  variant = "full",
}: SiteContactBlockProps) {
  const alignClass =
    align === "center" ? "items-center text-center" : align === "right" ? "items-end text-right" : "items-start text-left";

  const title = variant === "address" ? "Address" : "Contact";

  return (
    <address className={`not-italic ${alignClass} ${className}`}>
      <p className="text-sm font-medium text-foreground">{title}</p>

      {variant !== "address" ? (
        <>
          <a
            href={siteContactMailto()}
            className="mt-3 block text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {SITE_CONTACT.email}
          </a>
          <a
            href={siteContactTel()}
            className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {SITE_CONTACT.phoneDisplay}
          </a>
        </>
      ) : null}

      {variant !== "links" ? (
        <a
          href={siteContactMapsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className={`${variant === "address" ? "mt-4" : "mt-4"} inline-flex max-w-xs gap-2 text-sm leading-relaxed text-muted-foreground transition-colors hover:text-foreground`}
        >
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#251EFF]" aria-hidden />
          <span>
            {SITE_CONTACT.addressLines.map((line, i) => (
              <span key={line}>
                {line}
                {i < SITE_CONTACT.addressLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </span>
        </a>
      ) : null}
    </address>
  );
}
