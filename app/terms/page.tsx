import type { Metadata } from "next";

import { LegalPageShell, LegalSection } from "@/components/legal/legal-page-shell";

const LAST_UPDATED = "May 15, 2026";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms of use for EssentialToolbox: Access Passes, free vs Pro tools, refunds, liability, and governing law (India).",
  robots: { index: true, follow: true },
};

const TOC = [
  { id: "acceptance", label: "Acceptance of terms" },
  { id: "service", label: "Description of service" },
  { id: "access-passes", label: "Access passes & payments" },
  { id: "usage-limits", label: "Free vs Pro usage" },
  { id: "refunds", label: "Refund policy" },
  { id: "conduct", label: "Acceptable use" },
  { id: "liability", label: "Disclaimer of liability" },
  { id: "ip", label: "Intellectual property" },
  { id: "termination", label: "Termination" },
  { id: "governing-law", label: "Governing law" },
  { id: "changes", label: "Changes to terms" },
] as const;

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms & Conditions" lastUpdated={LAST_UPDATED} toc={[...TOC]}>
      <LegalSection id="acceptance" title="Acceptance of terms">
        <p>
          These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to and use of
          EssentialToolbox, including all tools, websites, and related services (collectively, the
          &quot;Service&quot;). By creating an account, purchasing an Access Pass, or using any tool,
          you agree to these Terms.
        </p>
        <p>
          If you do not agree, you must not use the Service. We may update these Terms from time to
          time; the date at the top of this page indicates the latest version.
        </p>
      </LegalSection>

      <LegalSection id="service" title="Description of service">
        <p>
          EssentialToolbox provides browser-based utilities for PDF, image, and document tasks
          (for example, merge, compress, resize, OCR, and related tools). Many operations run
          locally in your browser; some Pro features may use third-party APIs as described in each
          tool.
        </p>
        <p>
          We strive for accuracy and reliability but do not guarantee that outputs meet specific
          government, employer, or examination requirements unless explicitly stated for a given
          tool.
        </p>
      </LegalSection>

      <LegalSection id="access-passes" title="Access passes & payments">
        <p>
          Certain features require an <strong className="text-slate-900">Access Pass</strong>. Passes
          are sold as one-time purchases and include:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-slate-900">Daily Pass</strong> — short-term access for a single
            project or day of use.
          </li>
          <li>
            <strong className="text-slate-900">Weekly Pass</strong> — unlimited access for seven (7)
            days from activation.
          </li>
          <li>
            <strong className="text-slate-900">Monthly Pass</strong> — access for thirty (30) days
            from activation.
          </li>
          <li>
            <strong className="text-slate-900">Yearly Pass</strong> — access for twelve (12) months
            from activation.
          </li>
        </ul>
        <p>
          <strong className="text-slate-900">No auto-renewal:</strong> Passes are not subscriptions.
          We do not automatically charge your payment method when a pass expires. To continue after
          expiry, you must purchase a new pass explicitly.
        </p>
        <p>
          Payments are processed by Razorpay. Prices are shown in Indian Rupees (INR) unless stated
          otherwise and may change; the price at checkout applies to your purchase.
        </p>
      </LegalSection>

      <LegalSection id="usage-limits" title="Free vs Pro usage">
        <h3 className="text-base font-semibold text-slate-900">Free access</h3>
        <p>Without a pass, you may use designated free-tier tools subject to limitations such as:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>File size, page count, or batch limits per operation.</li>
          <li>Watermarks or reduced export quality on some tools.</li>
          <li>Restricted access to Pro-only tools (for example, advanced OCR or bulk features).</li>
          <li>Display of advertisements on certain pages.</li>
        </ul>
        <h3 className="text-base font-semibold text-slate-900">Pro access (active pass)</h3>
        <p>While your Access Pass is active, eligible tools generally include:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Higher or unlimited usage within fair-use limits to prevent abuse.</li>
          <li>Access to Pro tools listed on the pricing page.</li>
          <li>Ad-free experience where applicable.</li>
          <li>Priority processing for supported features.</li>
        </ul>
        <p>
          We reserve the right to apply rate limits or suspend accounts that engage in automated
          scraping, reselling, or excessive load on our infrastructure.
        </p>
      </LegalSection>

      <LegalSection id="refunds" title="Refund policy">
        <p>
          Because EssentialToolbox delivers immediate digital access and many tools process files
          locally at the time of use, <strong className="text-slate-900">refunds are generally not
          provided</strong> once an Access Pass has been purchased and activated, except where
          required by applicable law.
        </p>
        <p>We may consider a refund or credit only if:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>You were charged in error (duplicate payment).</li>
          <li>A technical failure on our side prevented any use of the pass, and support cannot resolve it.</li>
          <li>Applicable consumer protection law in your jurisdiction requires a remedy.</li>
        </ul>
        <p>
          Contact{" "}
          <a
            href="mailto:mail@essentialtoolbox.com"
            className="font-medium text-slate-900 underline underline-offset-4"
          >
            mail@essentialtoolbox.com
          </a>{" "}
          within seven (7) days of purchase with your order details. Approved refunds, if any, are
          processed through Razorpay to the original payment method.
        </p>
      </LegalSection>

      <LegalSection id="conduct" title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Use the Service for unlawful, harmful, or fraudulent purposes.</li>
          <li>Upload or process content you do not have the right to use.</li>
          <li>Attempt to reverse engineer, overload, or circumvent access controls.</li>
          <li>Share account credentials or resell pass benefits to third parties.</li>
        </ul>
        <p>We may suspend or terminate access for violations of these Terms.</p>
      </LegalSection>

      <LegalSection id="liability" title="Disclaimer of liability">
        <p>
          THE SERVICE IS PROVIDED <strong className="text-slate-900">&quot;AS IS&quot;</strong> AND
          &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED,
          INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p>
          To the fullest extent permitted by law, EssentialToolbox and its operators are not liable
          for:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Errors, corruption, or loss of data during browser-side conversion or editing (you
            should keep backups of important files).
          </li>
          <li>
            Rejection of documents by third parties (government portals, employers, or exam boards).
          </li>
          <li>Indirect, incidental, or consequential damages arising from use of the Service.</li>
          <li>Interruptions caused by third-party providers (hosting, payment, or APIs).</li>
        </ul>
        <p>
          Our total liability for any claim relating to the Service shall not exceed the amount you
          paid for the Access Pass in the twelve (12) months preceding the claim, or INR 500,
          whichever is greater.
        </p>
      </LegalSection>

      <LegalSection id="ip" title="Intellectual property">
        <p>
          The EssentialToolbox name, logo, website design, and tool software are owned by us or our
          licensors. You receive a limited, non-exclusive, non-transferable license to use the
          Service for personal or internal business purposes in accordance with these Terms.
        </p>
        <p>
          You retain ownership of files you create or upload. We do not claim ownership of your
          content processed in the browser.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="Termination">
        <p>
          You may stop using the Service at any time. We may suspend or terminate your account if
          you breach these Terms or if required for security or legal reasons. Upon termination,
          unused pass time is generally not refundable unless required by law.
        </p>
      </LegalSection>

      <LegalSection id="governing-law" title="Governing law">
        <p>
          These Terms are governed by the laws of <strong className="text-slate-900">India</strong>.
          Any disputes shall be subject to the exclusive jurisdiction of the courts in{" "}
          <strong className="text-slate-900">Chennai, Tamil Nadu</strong>, unless mandatory
          consumer protection rules in your location require otherwise.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to terms">
        <p>
          We may modify these Terms at any time. We will post the updated version on this page and
          update the &quot;Last updated&quot; date. Your continued use after changes constitutes
          acceptance. For material changes affecting active passes, we will make reasonable efforts
          to notify registered users by email or in-product notice.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
