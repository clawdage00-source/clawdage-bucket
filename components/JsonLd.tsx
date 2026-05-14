import { SITE_NAME } from "@/lib/seo/brand";
import { getToolSeoEntry } from "@/lib/seo/tool-registry";
import { getToolBySlug } from "@/lib/tools-data";

type ToolJsonLdProps = {
  slug: string;
};

function softwareApplicationJsonLd(slug: string) {
  const tool = getToolBySlug(slug);
  const seo = getToolSeoEntry(slug);
  if (!tool || !seo) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web (all modern browsers)",
    description: seo.metaDescription,
    offers: [
      {
        "@type": "Offer",
        name: "Free tier",
        price: "0",
        priceCurrency: "INR",
        description: "Core browser workflows with fair daily limits where applicable.",
      },
      {
        "@type": "Offer",
        name: "Daily Pass",
        price: "19",
        priceCurrency: "INR",
        description: "Optional pass for Pro-style limits — see pricing.",
      },
    ],
    featureList: [
      "Privacy-first: many workflows run locally in your browser.",
      "Built for Indian exam and portal document sizes.",
      "No forced subscription — optional passes.",
    ],
  };
}

function faqJsonLd(slug: string) {
  const seo = getToolSeoEntry(slug);
  if (!seo?.faqs.length) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seo.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

/**
 * JSON-LD for tool routes: SoftwareApplication + FAQPage (when FAQs exist).
 * Omit fabricated aggregateRating — only add when you have real review data.
 */
export function ToolJsonLd({ slug }: ToolJsonLdProps) {
  const app = softwareApplicationJsonLd(slug);
  const faq = faqJsonLd(slug);
  if (!app && !faq) {
    return null;
  }

  return (
    <>
      {app ? (
        <script
          key={`${slug}-software`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(app) }}
        />
      ) : null}
      {faq ? (
        <script
          key={`${slug}-faq`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
        />
      ) : null}
    </>
  );
}

type OrganizationJsonLdProps = {
  siteUrl: string;
};

export function OrganizationJsonLd({ siteUrl }: OrganizationJsonLdProps) {
  const json = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl,
    description:
      "Browser-first PDF, image, and AI utilities for India with optional passes for Pro features.",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
