const TESTIMONIALS = [
  {
    quote: "Resized my SSC photo in two minutes on my phone — no cyber café needed.",
    role: "SSC applicant, Kerala",
  },
  {
    quote: "Finally a site that doesn't ask me to upload my Aadhaar to random servers.",
    role: "UPSC aspirant, Delhi",
  },
  {
    quote: "₹19 for one day beat paying ₹999/month for tools I use once per form.",
    role: "Freelancer, Bengaluru",
  },
] as const;

export function PricingTestimonials() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-14" aria-labelledby="testimonials-heading">
      <h2 id="testimonials-heading" className="text-center text-2xl font-bold text-foreground">
        Trusted by students &amp; applicants across India
      </h2>
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <li key={t.role} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</p>
            <p className="mt-4 text-xs font-medium text-muted-foreground">{t.role}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
