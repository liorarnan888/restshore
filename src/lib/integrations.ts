import { createHash } from "node:crypto";

import { google } from "googleapis";
import { Resend } from "resend";

import {
  appBaseUrl,
  appSupportPromise,
  betaFeedbackMessage,
  brandDescription,
  brandName,
} from "@/lib/brand";
import type {
  CalendarSyncState,
  DeliveryStatus,
  GoogleAuthContext,
  GeneratedPlan,
  GeneratedReport,
  IntakeSession,
  ProgramEvent,
} from "@/lib/types";

type EmailSendResult = {
  status: DeliveryStatus;
  previewUrl?: string;
};

type CalendarSyncResult = {
  status: "preview" | "syncing" | "synced" | "failed";
  calendarName: string;
  eventCount: number;
  syncedCount: number;
  calendarId?: string;
  syncState?: CalendarSyncState;
};

type CalendarDeleteResult = {
  status: "deleted" | "preview" | "failed";
  calendarId?: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail =
  process.env.RESEND_FROM_EMAIL ?? `${brandName} <onboarding@resend.dev>`;
const SYNC_BATCH_SIZE = 48;
const SYNC_CONCURRENCY = 6;

function buildGoogleEventId(sessionId: string, eventId: string) {
  return createHash("sha256")
    .update(`${sessionId}:${eventId}`)
    .digest("hex")
    .slice(0, 64);
}

async function runInBatches<T>(
  items: T[],
  batchSize: number,
  worker: (item: T) => Promise<void>,
) {
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    await Promise.all(batch.map((item) => worker(item)));
  }
}

function getGoogleErrorStatus(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { status?: number } }).response === "object"
  ) {
    return (error as { response?: { status?: number } }).response?.status;
  }

  return undefined;
}

function isRetryableGoogleError(error: unknown) {
  const status = getGoogleErrorStatus(error);
  return status === 403 || status === 429 || status === 500 || status === 503;
}

async function withGoogleRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 4,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableGoogleError(error) || attempt === maxAttempts) {
        throw error;
      }

      const delayMs = 400 * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

function eventStage(event: ProgramEvent): CalendarSyncState["stage"] {
  switch (event.eventType) {
    case "wake":
    case "light":
    case "meal":
    case "caffeine":
    case "screen":
    case "checkin":
      return "laying_foundation";
    case "winddown":
      return "building_evening_routine";
    case "bed":
      return "building_sleep_window";
    case "mindset":
    case "review":
      return "adding_coach_notes";
    default:
      return "wrapping_up";
  }
}

function stageLabel(stage: CalendarSyncState["stage"]) {
  switch (stage) {
    case "creating_calendar":
      return `Creating your ${brandName} calendar`;
    case "laying_foundation":
      return "Laying down your daily anchors";
    case "building_evening_routine":
      return "Building your wind-down rhythm";
    case "building_sleep_window":
      return "Adding your sleep window and in-bed guidance";
    case "adding_coach_notes":
      return "Dropping in coach notes and weekly reviews";
    case "wrapping_up":
      return "Polishing the rest of your 6-week flow";
    case "complete":
      return "Your 6-week beta calendar is ready";
  }
}

function buildSyncState(
  totalEvents: number,
  syncedEvents: number,
  batchCursor: number,
  stage: CalendarSyncState["stage"],
  recentTitles: string[],
  previous?: CalendarSyncState,
): CalendarSyncState {
  const now = new Date().toISOString();
  return {
    totalEvents,
    syncedEvents,
    batchCursor,
    stage,
    stageLabel: stageLabel(stage),
    recentTitles,
    startedAt: previous?.startedAt ?? now,
    lastUpdatedAt: now,
  };
}

async function buildGoogleCalendarClient(
  session: IntakeSession,
  authContext: GoogleAuthContext | undefined,
) {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  const accessToken = authContext?.accessToken;

  if (!clientId || !clientSecret || !accessToken) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: authContext?.refreshToken ?? undefined,
    expiry_date: authContext?.expiresAt ? authContext.expiresAt * 1000 : undefined,
  });

  if (authContext?.refreshToken) {
    try {
      const refreshed = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials({
        access_token:
          refreshed.credentials.access_token ??
          oauth2Client.credentials.access_token ??
          undefined,
        refresh_token:
          refreshed.credentials.refresh_token ??
          authContext.refreshToken ??
          undefined,
        expiry_date:
          refreshed.credentials.expiry_date ??
          oauth2Client.credentials.expiry_date ??
          undefined,
      });
    } catch (error) {
      console.error("Google token refresh failed", {
        sessionId: session.id,
        message: error instanceof Error ? error.message : String(error),
        details:
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          typeof (error as { response?: { data?: unknown } }).response ===
            "object"
            ? (error as { response?: { data?: unknown } }).response?.data
            : undefined,
      });
    }
  }

  return google.calendar({
    version: "v3",
    auth: oauth2Client,
  });
}

async function clearCalendarEvents(
  calendar: ReturnType<typeof google.calendar>,
  calendarId: string,
) {
  let pageToken: string | undefined;
  const futureEventIds: string[] = [];

  do {
    const response = await calendar.events.list({
      calendarId,
      maxResults: 2500,
      pageToken,
    });

    const items = response.data.items ?? [];

    for (const item of items) {
      if (!item.id) {
        continue;
      }

       const startValue = item.start?.dateTime ?? item.start?.date;
       const startTime = startValue ? new Date(startValue).getTime() : null;

      if (startTime !== null && startTime < Date.now()) {
        continue;
      }

      futureEventIds.push(item.id);
    }

    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  await runInBatches(futureEventIds, 8, async (eventId) => {
    await withGoogleRetry(() =>
      calendar.events.delete({
        calendarId,
        eventId,
      }),
    );
  });
}

export function buildCalendarRequestBody(event: ProgramEvent, timeZone: string) {
  return {
    summary: event.title,
    description: event.description,
    colorId: event.calendarColorId,
    start: {
      dateTime: event.startsAt,
      timeZone,
    },
    end: {
      dateTime: event.endsAt,
      timeZone,
    },
  };
}

export async function sendReportEmail(
  session: IntakeSession,
  report: GeneratedReport,
): Promise<EmailSendResult> {
  if (!session.email) {
    return {
      status: "failed",
    };
  }

  if (!resendApiKey) {
    return {
      status: "preview",
      previewUrl: `/report/${session.id}`,
    };
  }

  const resend = new Resend(resendApiKey);
  await resend.emails.send({
    from: fromEmail,
    to: session.email,
    subject: `Your ${brandName} 6-week sleep plan`,
    html: report.html,
  });

  return {
    status: "sent",
  };
}

export async function sendResumeReminderEmail(session: IntakeSession) {
  if (!session.email || !resendApiKey) {
    return { status: session.email ? "preview" : "failed" } as EmailSendResult;
  }

  const resend = new Resend(resendApiKey);
  await resend.emails.send({
    from: fromEmail,
    to: session.email,
    subject: `Pick up your ${brandName} beta plan where you left off`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 32px;">
        <p style="text-transform: uppercase; letter-spacing: .18em; color: #2d8d8f; font-size: 12px; margin: 0 0 12px;">${brandName}</p>
        <h1 style="font-size: 30px; margin: 0 0 12px;">We saved your place</h1>
        <p style="line-height: 1.7; color: #43455e;">You can continue your guided sleep interview from the exact step where you paused.</p>
        <p style="line-height: 1.7; color: #43455e;">${betaFeedbackMessage}</p>
        <p style="margin-top: 20px;"><a href="${appBaseUrl()}/?resume=${session.resumeToken}">Resume interview</a></p>
      </div>
    `,
  });

  return { status: "sent" };
}

export async function sendBetaFeedbackFollowUpEmail(session: IntakeSession) {
  if (!session.email) {
    return { status: "failed" } as EmailSendResult;
  }

  const reportUrl = `${appBaseUrl()}/report/${session.id}?feedback=followup`;

  if (!resendApiKey) {
    return {
      status: "preview",
      previewUrl: reportUrl,
    } satisfies EmailSendResult;
  }

  const resend = new Resend(resendApiKey);
  await resend.emails.send({
    from: fromEmail,
    to: session.email,
    subject: `How is ${brandName} feeling so far?`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #f6efe4; padding: 32px; color: #1f2340;">
        <div style="max-width: 640px; margin: 0 auto; background: #fffaf3; border-radius: 28px; padding: 32px; border: 1px solid rgba(31,35,64,.08);">
          <p style="text-transform: uppercase; letter-spacing: .18em; color: #2d8d8f; font-size: 12px; margin: 0 0 12px;">${brandName} beta</p>
          <h1 style="font-size: 32px; line-height: 1.1; margin: 0 0 16px;">We would love your honest beta feedback.</h1>
          <p style="line-height: 1.75; color: #43455e; margin: 0 0 14px;">
            ${brandDescription}
          </p>
          <p style="line-height: 1.75; color: #43455e; margin: 0 0 14px;">
            What felt calming or useful? What felt unclear, too much, or missing? We read every thoughtful response and use it to shape the next iteration.
          </p>
          <p style="line-height: 1.75; color: #43455e; margin: 0 0 18px;">
            ${appSupportPromise}
          </p>
          <p style="margin: 0 0 10px;">
            <a href="${reportUrl}" style="display: inline-block; background: linear-gradient(90deg,#d95527,#f57f5b); color: white; text-decoration: none; padding: 14px 20px; border-radius: 999px; font-weight: 600;">Share feedback</a>
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #5f6178; margin: 18px 0 0;">
            If the button does not open, use this link: <a href="${reportUrl}">${reportUrl}</a>
          </p>
        </div>
      </div>
    `,
  });

  return { status: "sent" } satisfies EmailSendResult;
}

export async function syncCalendarProgram(
  session: IntakeSession,
  plan: GeneratedPlan,
  authContext?: GoogleAuthContext,
): Promise<CalendarSyncResult> {
  const calendar = await buildGoogleCalendarClient(session, authContext);

  if (!calendar) {
    return {
      status: "preview",
      calendarName: plan.calendarName,
      eventCount: plan.events.length,
      syncedCount: plan.events.length,
      calendarId: session.calendarExternalId,
      syncState: buildSyncState(
        plan.events.length,
        plan.events.length,
        plan.events.length,
        "complete",
        [],
        session.calendarSyncState,
      ),
    };
  }

  let calendarId = session.calendarExternalId;

  try {
    if (!calendarId) {
      const createdCalendar = await withGoogleRetry(() =>
        calendar.calendars.insert({
          requestBody: {
            summary: plan.calendarName,
            description:
              `${brandDescription} ${appSupportPromise}`,
            timeZone: plan.timezone,
          },
        }),
      );

      calendarId = createdCalendar.data.id ?? undefined;
    } else if (
      session.calendarSyncStatus === "pending" &&
      !session.calendarSyncState
    ) {
      await clearCalendarEvents(calendar, calendarId);
    }

    if (!calendarId) {
      return {
        status: "failed",
        calendarName: plan.calendarName,
        eventCount: 0,
        syncedCount: 0,
      };
    }

    const alreadySynced = Math.min(
      session.calendarSyncState?.batchCursor ?? 0,
      plan.events.length,
    );
    const remainingEvents = plan.events.slice(alreadySynced);

    if (!remainingEvents.length) {
      return {
        status: "synced",
        calendarName: plan.calendarName,
        eventCount: plan.events.length,
        syncedCount: plan.events.length,
        calendarId,
        syncState: buildSyncState(
          plan.events.length,
          plan.events.length,
          plan.events.length,
          "complete",
          session.calendarSyncState?.recentTitles ?? [],
          session.calendarSyncState,
        ),
      };
    }

    const batch = remainingEvents.slice(0, SYNC_BATCH_SIZE);
    const recentTitles: string[] = [];

    await runInBatches(batch, SYNC_CONCURRENCY, async (event) => {
      const eventId = buildGoogleEventId(session.id, event.id);
      const requestBody = buildCalendarRequestBody(event, plan.timezone);

      try {
        await withGoogleRetry(() =>
          calendar.events.insert({
            calendarId,
            requestBody: {
              id: eventId,
              ...requestBody,
            },
          }),
        );
      } catch (error) {
        const status = getGoogleErrorStatus(error);

        if (status !== 409) {
          throw error;
        }

        await withGoogleRetry(() =>
          calendar.events.update({
            calendarId,
            eventId,
            requestBody,
          }),
        );
      }

      recentTitles.push(event.title);
    });

    const syncedCount = alreadySynced + batch.length;
    const nextStage =
      syncedCount >= plan.events.length
        ? "complete"
        : eventStage(remainingEvents[Math.min(batch.length, remainingEvents.length - 1)]);

    return {
      status: syncedCount >= plan.events.length ? "synced" : "syncing",
      calendarName: plan.calendarName,
      eventCount: plan.events.length,
      syncedCount,
      calendarId,
      syncState: buildSyncState(
        plan.events.length,
        syncedCount,
        syncedCount,
        nextStage,
        recentTitles,
        session.calendarSyncState,
      ),
    };
  } catch (error) {
    console.error("Google calendar sync failed", {
      sessionId: session.id,
      email: authContext?.email ?? session.email,
      hasAccessToken: Boolean(authContext?.accessToken),
      hasRefreshToken: Boolean(authContext?.refreshToken),
      message: error instanceof Error ? error.message : String(error),
      details:
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: unknown } }).response === "object"
          ? (error as { response?: { data?: unknown } }).response?.data
          : undefined,
    });

    return {
      status: "failed",
      calendarName: plan.calendarName,
      eventCount: plan.events.length,
      syncedCount: session.calendarSyncState?.syncedEvents ?? 0,
      calendarId,
      syncState: session.calendarSyncState,
    };
  }
}

export async function syncCalendarEventUpdates(
  session: IntakeSession,
  plan: GeneratedPlan,
  eventIds: string[],
  authContext?: GoogleAuthContext,
) {
  if (!eventIds.length || !session.calendarExternalId) {
    return {
      status: session.calendarExternalId ? "synced" : "preview",
      syncedEventIds: [] as string[],
    };
  }

  const calendar = await buildGoogleCalendarClient(session, authContext);

  if (!calendar) {
    return {
      status: "preview" as const,
      syncedEventIds: eventIds,
    };
  }

  try {
    const targetEvents = plan.events.filter((event) => eventIds.includes(event.id));

    await runInBatches(targetEvents, 8, async (event) => {
      const eventId = buildGoogleEventId(session.id, event.id);
      const requestBody = buildCalendarRequestBody(event, plan.timezone);

      try {
        await withGoogleRetry(() =>
          calendar.events.insert({
            calendarId: session.calendarExternalId!,
            requestBody: {
              id: eventId,
              ...requestBody,
            },
          }),
        );
      } catch (error) {
        const status = getGoogleErrorStatus(error);

        if (status !== 409) {
          throw error;
        }

        try {
          await withGoogleRetry(() =>
            calendar.events.update({
              calendarId: session.calendarExternalId!,
              eventId,
              requestBody,
            }),
          );
        } catch (updateError) {
          const updateStatus = getGoogleErrorStatus(updateError);

          if (updateStatus === 404) {
            console.warn("Skipping stale Google event update after conflict", {
              sessionId: session.id,
              calendarId: session.calendarExternalId,
              eventId,
              programEventId: event.id,
            });
            return;
          }

          throw updateError;
        }
      }
    });

    return {
      status: "synced" as const,
      syncedEventIds: targetEvents.map((event) => event.id),
    };
  } catch (error) {
    console.error("Google calendar event update failed", {
      sessionId: session.id,
      calendarId: session.calendarExternalId,
      eventIds,
      email: authContext?.email ?? session.email,
      message: error instanceof Error ? error.message : String(error),
      details:
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: unknown } }).response === "object"
          ? (error as { response?: { data?: unknown } }).response?.data
          : undefined,
    });

    return {
      status: "failed" as const,
      syncedEventIds: [] as string[],
    };
  }
}

export async function deleteCalendarProgram(
  session: IntakeSession,
  authContext?: GoogleAuthContext,
): Promise<CalendarDeleteResult> {
  if (!session.calendarExternalId) {
    return {
      status: "deleted",
    };
  }

  const calendar = await buildGoogleCalendarClient(session, authContext);

  if (!calendar) {
    return {
      status: "preview",
      calendarId: session.calendarExternalId,
    };
  }

  try {
    await withGoogleRetry(() =>
      calendar.calendars.delete({
        calendarId: session.calendarExternalId!,
      }),
    );

    return {
      status: "deleted",
    };
  } catch (error) {
    const status = getGoogleErrorStatus(error);

    if (status === 404 || status === 410) {
      return {
        status: "deleted",
      };
    }

    try {
      await withGoogleRetry(() =>
        calendar.calendarList.delete({
          calendarId: session.calendarExternalId!,
        }),
      );

      return {
        status: "deleted",
      };
    } catch (fallbackError) {
    console.error("Google calendar delete failed", {
      sessionId: session.id,
      calendarId: session.calendarExternalId,
      email: authContext?.email ?? session.email,
      message: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      primaryMessage: error instanceof Error ? error.message : String(error),
      details:
        typeof fallbackError === "object" &&
        fallbackError !== null &&
        "response" in fallbackError &&
        typeof (fallbackError as { response?: { data?: unknown } }).response === "object"
          ? (fallbackError as { response?: { data?: unknown } }).response?.data
          : undefined,
    });

    return {
      status: "failed",
      calendarId: session.calendarExternalId,
    };
    }
  }
}
