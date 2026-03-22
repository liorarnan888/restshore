import type { Metadata } from "next";

import { ContentPageShell } from "@/components/launch/content-page-shell";
import {
  brandName,
  policyEffectiveDate,
  supportEmail,
  supportMailto,
} from "@/lib/brand";

export const metadata: Metadata = {
  title: `Privacy | ${brandName}`,
  description: `How ${brandName} handles intake answers, email delivery, calendar integrations, analytics, and beta feedback.`,
};

export default function PrivacyPage() {
  return (
    <ContentPageShell
      eyebrow="Privacy"
      title="Privacy for the free public beta"
      lede={`${brandName} is a consumer beta. This page explains, in plain language, what we collect, why we collect it, how Google data is used, and how to request deletion. Effective ${policyEffectiveDate}.`}
      route="/privacy"
    >
      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">What we collect</h2>
        <p className="mt-3">
          We collect the answers you enter in the intake, the email address you choose to share,
          the plan and report generated from your answers, optional sleep logs, optional feedback,
          and lightweight product analytics such as page views and major funnel steps.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Google data and permissions</h2>
        <p className="mt-3">
          Google sign-in is optional and appears only after the intake. If you choose Google
          Calendar, {brandName} requests the access needed to create and manage the dedicated{" "}
          {brandName} calendar it creates in your account. The product is not designed to read or
          manage your main calendar as part of the beta experience.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Why we collect it</h2>
        <p className="mt-3">
          We use this information to save your progress, generate your plan, deliver your report,
          sync a dedicated calendar when you choose that option, send one gentle resume reminder,
          send one beta feedback follow-up, and improve the product for early users.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Third-party services</h2>
        <p className="mt-3">
          If email delivery is enabled, report and follow-up emails are sent through Resend. If
          Google sign-in or calendar sync is enabled, Google services are used only after you
          grant access. We do not use paid ads for this beta phase.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">How feedback and analytics are used</h2>
        <p className="mt-3">
          Beta feedback and funnel analytics are used to find drop-off points, unclear copy,
          missing guidance, and broken flows. We look for patterns so we can improve the next
          iteration. We do not sell your information.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Retention and deletion</h2>
        <p className="mt-3">
          Beta data is kept so we can deliver your report, support your calendar, troubleshoot
          issues, and learn from real usage. If you want us to review or delete a beta session
          tied to your email, contact{" "}
          <a
            href={supportMailto("RestShore privacy request")}
            className="font-medium text-[color:var(--foreground)] underline decoration-[color:var(--line)] underline-offset-4"
          >
            {supportEmail}
          </a>
          . Ask for session deletion, calendar cleanup, or both.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Security and access control</h2>
        <p className="mt-3">
          We limit data use to the product flows described here, rely on authenticated account
          access for Google-connected features, and use service providers only where they are
          needed to deliver email, account connection, storage, or calendar functionality.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Your choices</h2>
        <p className="mt-3">
          You can stop using the product at any time. You can choose not to connect Google
          Calendar. You can skip optional feedback. You can remove the dedicated calendar inside
          the product and revoke Google access from your Google permissions page.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Google user data policy</h2>
        <p className="mt-3">
          If you grant Google access, {brandName} uses Google user data only to provide or improve
          the user-facing features described in this policy. It does not sell Google user data,
          use it for advertising, or transfer it to data brokers.
        </p>
        <p className="mt-3">
          {brandName}&apos;s use of information received from Google APIs adheres to the Google API
          Services User Data Policy, including the Limited Use requirements.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Contact</h2>
        <p className="mt-3">
          Privacy questions, deletion requests, and Google access questions can be sent to{" "}
          <a
            href={supportMailto("RestShore privacy request")}
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
