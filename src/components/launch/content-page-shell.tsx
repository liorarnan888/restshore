import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { LaunchPageView } from "@/components/launch/launch-page-view";
import {
  appSupportPromise,
  betaLabel,
  brandName,
  supportEmail,
  supportMailto,
} from "@/lib/brand";

export function ContentPageShell({
  eyebrow,
  title,
  lede,
  route,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  route?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      {route ? <LaunchPageView route={route} metadata={{ surface: "content_page" }} /> : null}
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[30px] border border-white/60 bg-white/55 px-4 py-3 text-sm text-[color:var(--muted)] shadow-[0_18px_40px_rgba(31,35,64,0.08)] backdrop-blur md:px-5">
          <div className="flex items-center gap-3">
            <BrandLogo variant="mark" className="h-10 w-10 shrink-0" priority />
            <div>
              <p className="display text-lg text-[color:var(--foreground)]">
                {brandName}
              </p>
              <p className="text-xs">{betaLabel}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
            <Link href="/guides" className="transition hover:text-[color:var(--foreground)]">
              Guides
            </Link>
            <Link href="/support" className="transition hover:text-[color:var(--foreground)]">
              Support
            </Link>
            <Link href="/" className="transition hover:text-[color:var(--foreground)]">
              Home
            </Link>
          </div>
        </header>

        <section className="glass-panel editorial-card rounded-[36px] border border-white/75 p-7 sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
            {eyebrow}
          </p>
          <h1 className="display mt-3 text-4xl leading-tight text-[color:var(--foreground)] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-[color:var(--muted)]">
            {lede}
          </p>
        </section>

        <div className="grid gap-7 text-sm leading-7 text-[color:var(--foreground)]">{children}</div>

        <section className="grid gap-4 pb-8 sm:grid-cols-2">
          <article className="glass-panel editorial-card rounded-[28px] border border-white/75 p-6">
            <h2 className="display text-3xl text-[color:var(--foreground)]">
              Try the beta
            </h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              Start the guided intake and let {brandName} turn it into a six-week plan,
              a calmer calendar structure, and a reusable sleep summary.
            </p>
            <Link
              href="/start"
              className="mt-5 inline-flex rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))] px-5 py-3 font-medium text-white shadow-[0_18px_32px_rgba(235,93,52,.24)] transition hover:-translate-y-0.5"
            >
              Start the questionnaire
            </Link>
          </article>
          <article className="glass-panel editorial-card rounded-[28px] border border-white/75 p-6">
            <h2 className="display text-3xl text-[color:var(--foreground)]">
              Need support?
            </h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              {appSupportPromise} Contact{" "}
              <a
                href={supportMailto("RestShore support request")}
                className="font-medium text-[color:var(--foreground)] underline decoration-[color:var(--line)] underline-offset-4"
              >
                {supportEmail}
              </a>{" "}
              for Google access questions, calendar help, or data deletion requests.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <Link
                href="/support"
                className="rounded-full border border-[color:var(--line)] bg-white/85 px-4 py-2 font-medium text-[color:var(--foreground)]"
              >
                Support
              </Link>
              <Link
                href="/privacy"
                className="rounded-full border border-[color:var(--line)] bg-white/85 px-4 py-2 font-medium text-[color:var(--foreground)]"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="rounded-full border border-[color:var(--line)] bg-white/85 px-4 py-2 font-medium text-[color:var(--foreground)]"
              >
                Terms
              </Link>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
