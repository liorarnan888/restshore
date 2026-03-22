import type { Metadata } from "next";

import { ContentPageShell } from "@/components/launch/content-page-shell";
import {
  appSupportPromise,
  brandName,
  policyEffectiveDate,
  supportEmail,
  supportMailto,
} from "@/lib/brand";

export const metadata: Metadata = {
  title: `Support | ${brandName}`,
  description:
    `How to contact ${brandName}, remove Google Calendar access, request data deletion, and get help with your sleep plan.`,
};

export default function SupportPage() {
  return (
    <ContentPageShell
      eyebrow="Support"
      title="Support, Google access, and data requests"
      lede={`This page explains how to contact ${brandName}, what Google access is used for, and how to remove calendar access or request data deletion. Effective ${policyEffectiveDate}.`}
      route="/support"
    >
      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">How to reach us</h2>
        <p className="mt-3">
          Email{" "}
          <a
            href={supportMailto("RestShore support request")}
            className="font-medium text-[color:var(--foreground)] underline decoration-[color:var(--line)] underline-offset-4"
          >
            {supportEmail}
          </a>{" "}
          for account help, Google Calendar issues, privacy questions, or data deletion requests.
          When possible, include the email tied to your plan and a short description of the issue.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">
          What Google access is used for
        </h2>
        <p className="mt-3">
          Google sign-in is optional and appears only after you finish the intake. If you approve
          calendar access, {brandName} uses it to create, update, and remove the dedicated{" "}
          {brandName} calendar in your Google account. The product is not designed to manage your
          primary calendar.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">
          Remove calendar access
        </h2>
        <p className="mt-3">
          You can remove the dedicated {brandName} calendar from inside the product. You can also
          revoke Google access from your Google account permissions page at{" "}
          <a
            href="https://myaccount.google.com/permissions"
            className="font-medium text-[color:var(--foreground)] underline decoration-[color:var(--line)] underline-offset-4"
          >
            myaccount.google.com/permissions
          </a>
          . Revoking access stops future calendar syncs.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">
          Data deletion and privacy requests
        </h2>
        <p className="mt-3">
          To request deletion of a beta session, email {supportEmail} from the email tied to your
          plan or mention that email in your message. Ask for session deletion, calendar cleanup,
          or both. We use this route for access, deletion, and correction requests.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">
          Google API data handling
        </h2>
        <p className="mt-3">
          If you grant Google access, {brandName} uses Google user data only for the user-facing
          features described here. It does not sell Google user data, use it for advertising, or
          transfer it to data brokers. Google data is used only to power sign-in and the dedicated
          calendar experience you requested.
        </p>
        <p className="mt-3">
          {brandName}&apos;s use of information received from Google APIs adheres to the Google API
          Services User Data Policy, including the Limited Use requirements.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">
          Safety and scope
        </h2>
        <p className="mt-3">{appSupportPromise} Do not use {brandName} support for urgent or emergency care.</p>
      </section>
    </ContentPageShell>
  );
}
