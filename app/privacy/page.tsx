import type { Metadata } from "next";

import { LegalPageShell, LegalSection } from "@/components/legal/legal-page-shell";
import { PrivacyTrustBanner } from "@/components/legal/trust-banner";
import { SITE_CONTACT } from "@/lib/site-contact";

const LAST_UPDATED = "May 15, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How EssentialToolbox handles your data: browser-local file processing, account and payment information, cookies, and third-party services.",
  robots: { index: true, follow: true },
};

const TOC = [
  { id: "introduction", label: "Introduction" },
  { id: "no-file-storage", label: "No-file-storage guarantee" },
  { id: "data-we-collect", label: "Data we collect" },
  { id: "how-we-use-data", label: "How we use your information" },
  { id: "cookies", label: "Cookies & sessions" },
  { id: "third-parties", label: "Third-party services" },
  { id: "retention-security", label: "Retention & security" },
  { id: "your-rights", label: "Your rights" },
  { id: "children", label: "Children's privacy" },
  { id: "changes", label: "Changes to this policy" },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      toc={[...TOC]}
      trustBanner={<PrivacyTrustBanner />}
    >
      <LegalSection id="introduction" title="Introduction">
        <p>
          EssentialToolbox (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the
          EssentialToolbox website and related online tools. This Privacy Policy explains what
          information we collect, how we use it, and the choices you have.
        </p>
        <p>
          By using our services, you agree to the practices described here. If you do not agree,
          please discontinue use of the site.
        </p>
      </LegalSection>

      <LegalSection id="no-file-storage" title="No-file-storage guarantee">
        <p>
          <strong className="text-slate-900">
            Your files stay on your device for supported tools.
          </strong>{" "}
          For our core PDF, image, and document utilities, processing happens locally in your web
          browser using client-side technology. We do not upload, store, or retain the contents of
          those files on our servers as part of normal tool operation.
        </p>
        <p>This means:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>We do not keep copies of your PDFs, images, or scans after you close the tab.</li>
          <li>We cannot access or review your documents unless you explicitly share them with us.</li>
          <li>
            You are responsible for saving outputs (downloads) before leaving the page or clearing
            browser data.
          </li>
        </ul>
        <p>
          Some Pro features (for example, cloud-assisted OCR or AI APIs) may send only the minimum
          data required to complete a specific request. Where that applies, we describe it in the
          tool interface and limit transmission to what is necessary for that feature.
        </p>
      </LegalSection>

      <LegalSection id="data-we-collect" title="Data we collect">
        <h3 className="text-base font-semibold text-slate-900">Account information</h3>
        <p>
          When you sign in (for example via email magic link or Google), we receive basic account
          details through our authentication provider, including your email address and a unique
          user identifier. This is stored in our database (Supabase) to manage your profile and
          access passes.
        </p>
        <h3 className="text-base font-semibold text-slate-900">Payment information</h3>
        <p>
          Purchases are processed by Razorpay. We do not store full card numbers or UPI credentials
          on our servers. We may retain transaction references (order ID, payment status, amount,
          and plan purchased) for billing records and support.
        </p>
        <h3 className="text-base font-semibold text-slate-900">Usage & analytics</h3>
        <p>We collect limited technical and usage data, such as:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Pages visited and tools used (event analytics).</li>
          <li>Browser type, device category, and general location (country/region level).</li>
          <li>Timestamps related to sign-in, pass activation, and support requests.</li>
        </ul>
        <p>
          We use this information to improve reliability, understand which tools are popular, and
          prevent abuse.
        </p>
      </LegalSection>

      <LegalSection id="how-we-use-data" title="How we use your information">
        <p>We use collected information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide, maintain, and secure your account.</li>
          <li>Activate and validate Access Passes (Daily, Weekly, Monthly, Yearly).</li>
          <li>Process payments and respond to billing inquiries.</li>
          <li>Send essential service messages (for example, login links or payment receipts).</li>
          <li>Monitor performance, fix bugs, and protect against fraud or misuse.</li>
        </ul>
        <p>
          We do not sell your personal information. We do not use your email for unrelated
          marketing without your consent.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies & sessions">
        <p>
          We use cookies and similar technologies that are necessary for the site to function,
          including:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-slate-900">Authentication cookies</strong> — to keep you signed
            in securely (Supabase session).
          </li>
          <li>
            <strong className="text-slate-900">Admin & security cookies</strong> — where applicable,
            for protected areas.
          </li>
          <li>
            <strong className="text-slate-900">Preference cookies</strong> — to remember settings
            during your visit.
          </li>
        </ul>
        <p>
          You can control cookies through your browser settings. Disabling essential cookies may
          prevent sign-in or pass activation from working correctly.
        </p>
      </LegalSection>

      <LegalSection id="third-parties" title="Third-party services">
        <p>We rely on trusted providers to operate EssentialToolbox:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-slate-900">Supabase</strong> — authentication, database, and
            server-side functions for accounts and entitlements.
          </li>
          <li>
            <strong className="text-slate-900">Razorpay</strong> — payment processing and fraud
            prevention for Access Pass purchases.
          </li>
          <li>
            <strong className="text-slate-900">Hosting & analytics</strong> — infrastructure and
            aggregated usage metrics (for example, Vercel Analytics where enabled).
          </li>
          <li>
            <strong className="text-slate-900">Google AdSense</strong> — if advertising is displayed
            on free-tier pages, Google may use cookies per its own policies. You can manage ad
            preferences through Google&apos;s settings and your browser.
          </li>
        </ul>
        <p>
          These providers process data under their own terms and privacy policies. We encourage you
          to review them when you interact with payments or sign-in flows.
        </p>
      </LegalSection>

      <LegalSection id="retention-security" title="Retention & security">
        <p>
          We retain account and transaction records for as long as your account is active or as
          needed for legal, tax, and support obligations. Analytics events are retained in
          aggregated form for operational reporting.
        </p>
        <p>
          We apply reasonable technical and organizational measures (encryption in transit, access
          controls, and secure hosting). No method of transmission over the Internet is 100%
          secure; we cannot guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="Your rights">
        <p>Depending on applicable law (including Indian data protection norms), you may:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Request access to personal data we hold about you.</li>
          <li>Request correction of inaccurate account information.</li>
          <li>Request deletion of your account, subject to legal retention requirements.</li>
          <li>Withdraw consent where processing is consent-based.</li>
        </ul>
        <p>
          To exercise these rights, email{" "}
          <a
            href={`mailto:${SITE_CONTACT.email}`}
            className="font-medium text-slate-900 underline underline-offset-4"
          >
            {SITE_CONTACT.email}
          </a>
          . We will respond within a reasonable timeframe.
        </p>
      </LegalSection>

      <LegalSection id="children" title="Children's privacy">
        <p>
          EssentialToolbox is not directed at children under 13 (or the minimum age required in
          your jurisdiction). We do not knowingly collect personal information from children. If
          you believe a child has provided us data, contact us and we will delete it promptly.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at
          the top reflects the latest revision. Material changes will be posted on this page;
          continued use after changes constitutes acceptance.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
