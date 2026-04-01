import Link from "next/link";

import { ContentPageShell } from "@/components/launch/content-page-shell";
import { StructuredData } from "@/components/seo/structured-data";
import { getGuideFlow, type GuideContent } from "@/lib/guide-content";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  editorialAuthor,
} from "@/lib/seo";

function renderParagraphs(content: string) {
  return content
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={`${paragraph.slice(0, 24)}-${index}`} className="mt-3 first:mt-0">
        {paragraph}
      </p>
    ));
}

export function GuideArticlePage({ guide }: { guide: GuideContent }) {
  const flow = getGuideFlow(guide.path);
  const breadcrumbs = guide.path.startsWith("/guides/")
    ? [
        { name: "Home", path: "/" },
        { name: "Guides", path: "/guides" },
        { name: guide.title, path: guide.path },
      ]
    : [
        { name: "Home", path: "/" },
        { name: guide.title, path: guide.path },
      ];

  return (
    <>
      <StructuredData
        data={buildArticleJsonLd({
          title: guide.title,
          description: guide.description,
          path: guide.path,
          dateModified: guide.updatedAt,
          keywords: guide.keywords,
        })}
      />
      <StructuredData data={buildBreadcrumbJsonLd(breadcrumbs)} />
      <ContentPageShell
        eyebrow={guide.eyebrow}
        title={guide.title}
        lede={guide.lede}
        route={guide.path}
      >
        <section className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[24px] border border-[rgba(31,35,64,.08)] bg-[rgba(255,248,239,0.76)] px-5 py-5">
              <div className="flex flex-wrap gap-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
                <span>By {editorialAuthor}</span>
                <span>Updated {guide.updatedAt}</span>
                <span>Adults 18+ only</span>
              </div>
              {flow ? (
                <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
                  Knowledge path {flow.position} of {flow.total}
                </p>
              ) : null}
              <p className="mt-4 text-sm leading-6 text-[color:var(--foreground)]">
                Educational behavioral-support content. Not clinician care, diagnosis, or
                emergency help.
              </p>
              {flow?.next ? (
                <div className="mt-5 border-t border-[rgba(31,35,64,.08)] pt-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Next in sequence
                  </p>
                  <Link
                    href={flow.next.href}
                    className="mt-2 block text-sm font-medium leading-6 text-[color:var(--foreground)] underline decoration-[color:var(--line)] underline-offset-4"
                  >
                    {flow.next.label}
                  </Link>
                </div>
              ) : null}
            </div>
          </aside>

          <div className="glass-panel editorial-card rounded-[34px] border border-white/75 px-6 py-7 sm:px-8 sm:py-8">
            {guide.keyTakeaways?.length ? (
              <section className="border-b border-[rgba(31,35,64,.08)] pb-8">
                <h2 className="display text-3xl text-[color:var(--foreground)]">Key takeaways</h2>
                <ol className="mt-5 grid gap-4 md:grid-cols-3">
                  {guide.keyTakeaways.map((point, index) => (
                    <li
                      key={point}
                      className="rounded-[18px] bg-[rgba(255,255,255,0.68)] px-4 py-4 text-sm leading-6 text-[color:var(--foreground)]"
                    >
                      <span className="mb-3 block text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {point}
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <section className="border-b border-[rgba(31,35,64,.08)] py-8 first:pt-0">
              <h2 className="display text-3xl text-[color:var(--foreground)]">The short answer</h2>
              <div className="mt-4 text-base leading-8 text-[color:var(--foreground)]">
                {renderParagraphs(guide.answer)}
              </div>
            </section>

            <section className="border-b border-[rgba(31,35,64,.08)] py-8">
              <h2 className="display text-3xl text-[color:var(--foreground)]">Why this shows up</h2>
              <div className="mt-4 text-base leading-8 text-[color:var(--foreground)]">
                {renderParagraphs(guide.whyThisHappens)}
              </div>
            </section>

            <section className="border-b border-[rgba(31,35,64,.08)] py-8">
              <h2 className="display text-3xl text-[color:var(--foreground)]">
                What people usually try first
              </h2>
              <div className="mt-4 text-base leading-8 text-[color:var(--foreground)]">
                {renderParagraphs(guide.commonTrap)}
              </div>
            </section>

            <section className="border-b border-[rgba(31,35,64,.08)] py-8">
              <h2 className="display text-3xl text-[color:var(--foreground)]">
                A practical next step
              </h2>
              <div className="mt-4 text-base leading-8 text-[color:var(--foreground)]">
                {renderParagraphs(guide.practicalGuidance)}
              </div>
              {guide.practicalSteps?.length ? (
                <ol className="mt-6 grid gap-3">
                  {guide.practicalSteps.map((step, index) => (
                    <li
                      key={step}
                      className="grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-[18px] border border-[rgba(31,35,64,.08)] bg-white/72 px-4 py-4 text-sm leading-6 text-[color:var(--foreground)]"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(45,141,143,.12)] text-xs font-medium uppercase tracking-[0.08em] text-[color:var(--teal)]">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </section>

            {guide.noticePoints?.length ? (
              <section className="border-b border-[rgba(31,35,64,.08)] py-8">
                <h2 className="display text-3xl text-[color:var(--foreground)]">
                  What to notice over the next few days
                </h2>
                <ul className="mt-6 grid gap-3">
                  {guide.noticePoints.map((point) => (
                    <li
                      key={point}
                      className="rounded-[18px] border-l-4 border-[rgba(45,141,143,.35)] bg-[rgba(255,248,239,0.78)] px-4 py-4 text-sm leading-6 text-[color:var(--foreground)]"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="border-b border-[rgba(31,35,64,.08)] py-8">
              <h2 className="display text-3xl text-[color:var(--foreground)]">
                How RestShore fits
              </h2>
              <div className="mt-4 text-base leading-8 text-[color:var(--foreground)]">
                {renderParagraphs(guide.howRestShoreHelps)}
              </div>
            </section>

            <section className="rounded-[24px] border border-[rgba(235,93,52,.14)] bg-[rgba(245,127,91,.08)] px-5 py-5">
              <h2 className="display text-3xl text-[color:var(--foreground)]">
                When to seek clinician support
              </h2>
              <div className="mt-4 text-base leading-8 text-[color:var(--foreground)]">
                {renderParagraphs(guide.whenToSeekSupport)}
              </div>
            </section>
          </div>
        </section>

        {flow ? (
          <section className="rounded-[28px] border border-[rgba(31,35,64,.08)] bg-[rgba(255,255,255,0.76)] px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="display text-3xl text-[color:var(--foreground)]">
                  Continue the learning path
                </h2>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  Move in order if you want the knowledge pages to feel like one guided flow.
                </p>
              </div>
              <Link
                href="/guides"
                className="text-sm font-medium text-[color:var(--foreground)] underline decoration-[color:var(--line)] underline-offset-4"
              >
                Browse all guides
              </Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {flow.previous ? (
                <Link
                  href={flow.previous.href}
                  className="rounded-[22px] border border-[color:var(--line)] bg-white/90 px-4 py-4 text-sm text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                >
                  <span className="block text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
                    Previous
                  </span>
                  <span className="mt-2 block font-medium">{flow.previous.label}</span>
                </Link>
              ) : (
                <div className="rounded-[22px] border border-dashed border-[color:var(--line)] px-4 py-4 text-sm text-[color:var(--muted)]">
                  You are at the start of the learning path.
                </div>
              )}
              {flow.next ? (
                <Link
                  href={flow.next.href}
                  className="rounded-[22px] border border-[rgba(45,141,143,.18)] bg-[rgba(233,247,246,.9)] px-4 py-4 text-sm text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                >
                  <span className="block text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--teal)]">
                    Next
                  </span>
                  <span className="mt-2 block font-medium">{flow.next.label}</span>
                </Link>
              ) : (
                <Link
                  href="/start"
                  className="rounded-[22px] border border-[rgba(235,93,52,.14)] bg-[rgba(255,248,239,0.9)] px-4 py-4 text-sm text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                >
                  <span className="block text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--accent-strong)]">
                    Next step
                  </span>
                  <span className="mt-2 block font-medium">Start the questionnaire</span>
                </Link>
              )}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="display text-3xl text-[color:var(--foreground)]">Related reading</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {guide.relatedLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[22px] border border-[color:var(--line)] bg-white/90 px-4 py-4 text-sm font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="display text-3xl text-[color:var(--foreground)]">Sources</h2>
          <ul className="mt-4 grid gap-3">
            {guide.sources.map((source) => (
              <li
                key={source.href}
                className="rounded-[20px] border border-[color:var(--line)] bg-white/90 px-4 py-4"
              >
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-[color:var(--foreground)] underline decoration-[color:var(--line)] underline-offset-4"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </ContentPageShell>
    </>
  );
}
