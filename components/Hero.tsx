import Link from "next/link";

export function Hero() {
  return (
    <section className="border-b border-slate-100 bg-white px-6 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-black sm:text-4xl lg:text-5xl">
          <span className="block sm:inline">Professional Tools for the </span>
          <span className="mt-1 block bg-gradient-to-r from-zinc-900 via-black to-zinc-700 bg-clip-text text-transparent sm:mt-0 sm:inline">
            Price of a Chai.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
          Merge PDFs, Remove Backgrounds, and Resize Documents for Indian Exam Portals. No
          Subscriptions. Just Daily &amp; Weekly Passes starting at ₹19.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="#tools"
            className="inline-flex min-h-[48px] w-full max-w-xs items-center justify-center rounded-xl bg-black px-8 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:w-auto"
          >
            Explore All Tools
          </Link>
        </div>
        <p className="mt-6 max-w-xl text-pretty text-xs leading-relaxed text-slate-500 sm:text-sm">
          🔒 All processing happens in your browser. Your files never leave your device.
        </p>
      </div>
    </section>
  );
}
