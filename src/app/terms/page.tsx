import type { Metadata } from "next";

import { ContentPageShell } from "@/components/launch/content-page-shell";
import {
  appSupportPromise,
  brandName,
  policyEffectiveDate,
  supportEmail,
  supportMailto,
} from "@/lib/brand";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: `Terms | ${brandName}`,
  description: `Plain-language terms for using the ${brandName} free public beta.`,
  path: "/terms",
  index: false,
});

export default function TermsPage() {
  return (
    <ContentPageShell
      eyebrow="Terms"
      title="Plain-language beta terms"
      lede={`These terms apply to the ${brandName} free public beta as of ${policyEffectiveDate}. They are written to be understandable, but they do not replace product judgment or common sense.`}
      route="/terms"
    >
      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Beta status</h2>
        <p className="mt-3">
          This is an early public beta. Parts of the experience may change, break, be revised, or
          disappear while we learn from real usage. There is no billing in this version.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Product framing</h2>
        <p className="mt-3">{appSupportPromise}</p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Your responsibilities</h2>
        <p className="mt-3">
          Use the product honestly and do not rely on it for emergency, crisis, or urgent medical
          decisions. Keep account access links private. If a recommendation feels wrong for your
          situation, pause and use judgment instead of forcing the product to be right.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Google and third-party services</h2>
        <p className="mt-3">
          Some product features depend on third-party services such as Google and Resend. Google
          access is optional and used only if you choose to connect your account and add the
          dedicated RestShore calendar. If those services change, pause, or reject access, parts
          of the experience may stop working.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Feedback you share</h2>
        <p className="mt-3">
          If you send feedback, you allow us to use it to improve the beta. We may summarize or
          quote anonymous feedback internally, in launch notes, or in future product planning.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Availability and limits</h2>
        <p className="mt-3">
          We may limit access, pause the beta, or remove features without notice. We do not promise
          uninterrupted availability, perfect data retention, or any guaranteed sleep outcome.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Contact</h2>
        <p className="mt-3">
          For support, privacy questions, or data requests, contact{" "}
          <a
            href={supportMailto("RestShore terms or support question")}
            className="font-medium text-[color:var(--foreground)] underline decoration-[color:var(--line)] underline-offset-4"
          >
            {supportEmail}
          </a>
          .
        </p>
      </section>
    </ContentPageShell>
  );
}
