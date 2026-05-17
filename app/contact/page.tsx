import type { Metadata } from "next";

import { SiteContactBlock } from "@/components/site-contact-block";
import { TrustSection } from "@/components/TrustSection";
import { SITE_NAME } from "@/lib/seo/brand";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Contact ${SITE_NAME} — phone, email, and Bengaluru office address for support and inquiries.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-muted/40 px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Contact {SITE_NAME}</h1>
          <p className="mt-4 text-muted-foreground">
            Questions about tools, passes, or privacy? Reach us by phone or email — we&apos;re based in Bengaluru.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-6 py-12 sm:py-16">
        <SiteContactBlock variant="full" align="center" className="items-center text-center" />
      </div>

      <TrustSection variant="compact" />
    </div>
  );
}
