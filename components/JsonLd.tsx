import type { BlogPost } from "@/lib/blog/posts";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/brand";
import { SITE_CONTACT } from "@/lib/site-contact";
import type { SeoLandingPage } from "@/lib/seo/landing-pages";
import { getToolSeoEntry } from "@/lib/seo/tool-registry";
import { getToolBySlug } from "@/lib/tools-data";

function JsonLdScript({ id, data }: { id: string; data: object }) {
  return (
    <script
      key={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

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
    description: SITE_TAGLINE,
    email: SITE_CONTACT.email,
    telephone: SITE_CONTACT.phoneE164,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONTACT.addressLines.slice(0, 3).join(", "),
      addressLocality: SITE_CONTACT.locality,
      addressRegion: SITE_CONTACT.region,
      postalCode: SITE_CONTACT.postalCode,
      addressCountry: SITE_CONTACT.country,
    },
    areaServed: { "@type": "Country", name: "India" },
  };

  return <JsonLdScript id="organization" data={json} />;
}

type WebSiteJsonLdProps = {
  siteUrl: string;
};

export function WebSiteJsonLd({ siteUrl }: WebSiteJsonLdProps) {
  const json = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl,
    description: SITE_TAGLINE,
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/#tools`,
      "query-input": "required name=search_term_string",
    },
  };
  return <JsonLdScript id="website" data={json} />;
};

type BreadcrumbJsonLdProps = {
  items: { name: string; path: string }[];
  siteUrl: string;
};

export function BreadcrumbJsonLd({ items, siteUrl }: BreadcrumbJsonLdProps) {
  const json = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
  return <JsonLdScript id="breadcrumb" data={json} />;
}

export function LandingPageJsonLd({ page }: { page: SeoLandingPage }) {
  const tool = getToolBySlug(page.toolSlug);
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  const app = tool
    ? {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: tool.name,
        applicationCategory: "UtilitiesApplication",
        description: page.metaDescription,
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      }
    : null;

  return (
    <>
      <JsonLdScript id={`landing-faq-${page.slug}`} data={faq} />
      {app ? <JsonLdScript id={`landing-app-${page.slug}`} data={app} /> : null}
    </>
  );
}

export function BlogPostJsonLd({ post }: { post: BlogPost }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    articleSection: post.category,
  };
  return <JsonLdScript id={`blog-${post.slug}`} data={json} />;
}
