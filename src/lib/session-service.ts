import { randomUUID } from "node:crypto";

import { adaptPlanFromDailyCheckIns, getAdaptivePlanSummary } from "@/lib/adaptive-plan";
import {
  attachDailyCheckInLinksToPlan,
  buildDailyCheckInDraftDefaults,
  ensurePlanHasDailyCheckInEvents,
  isValidDailyCheckInToken,
  reconcileDailyCheckInsForPlan,
  upsertDailyCheckIn,
} from "@/lib/daily-checkin";
import {
  deleteCalendarProgram,
  sendBetaFeedbackFollowUpEmail,
  sendReportEmail,
  sendResumeReminderEmail,
  syncCalendarEventUpdates,
  syncCalendarProgram,
} from "@/lib/integrations";
import { feedbackFollowUpDelayHours } from "@/lib/brand";
import { hasFeedbackForSession, recordAnalyticsEvent } from "@/lib/launch-data";
import { buildGeneratedPlan, buildSleepProfile } from "@/lib/plan-engine";
import { getQuestionById, normaliseAnswer } from "@/lib/questionnaire";
import { buildGeneratedReport } from "@/lib/report";
import {
  getStoredGoogleAccount,
  getSessionById,
  getSessionByResumeToken,
  linkSessionToUser,
  listSessions,
  saveSession,
  updateStoredGoogleAccountTokens,
} from "@/lib/session-repository";
import type {
  AnswerMap,
  DailySleepCheckIn,
  GoogleAuthContext,
  IntakeSession,
  LaunchAnalyticsEventType,
} from "@/lib/types";

function firstStepId() {
  return "primary_problem";
}

type LaunchAttribution = {
  visitorId?: string;
  route?: string;
  referrer?: string;
};

async function trackLaunchEvent(
  eventType: LaunchAnalyticsEventType,
  {
    sessionId,
    visitorId,
    route,
    referrer,
    metadata,
  }: LaunchAttribution & {
    sessionId?: string;
    metadata?: Record<string, unknown>;
  } = {},
) {
  await recordAnalyticsEvent({
    eventType,
    sessionId,
    visitorId,
    route,
    referrer,
    metadata,
  });
}

async function resolveGoogleAuthContext(
  session: IntakeSession,
  authContext?: GoogleAuthContext,
) {
  const storedAccount =
    !authContext?.accessToken && session.userId
      ? await getStoredGoogleAccount(session.userId)
      : null;

  return authContext || storedAccount
    ? {
        userId: authContext?.userId ?? session.userId,
        email: authContext?.email ?? session.email,
        accessToken: authContext?.accessToken ?? storedAccount?.access_token,
        refreshToken: authContext?.refreshToken ?? storedAccount?.refresh_token,
        expiresAt: authContext?.expiresAt ?? storedAccount?.expires_at,
      }
    : undefined;
}

async function refreshDailyCheckInState(
  session: IntakeSession,
  authContext?: GoogleAuthContext,
  options?: { syncCalendar?: boolean },
) {
  if (!session.generatedPlan) {
    return session;
  }

  const upgradedPlanResult = ensurePlanHasDailyCheckInEvents(session.generatedPlan);
  const linkedPlanResult = attachDailyCheckInLinksToPlan(
    upgradedPlanResult.plan,
    session.id,
    session.resumeToken,
  );
  const reconciledPlanResult = reconcileDailyCheckInsForPlan(
    linkedPlanResult.plan,
    session.dailyCheckIns,
  );
  const adaptedPlanResult = adaptPlanFromDailyCheckIns(
    reconciledPlanResult.plan,
    session.dailyCheckIns,
  );
  const changedEventIds = [
    ...new Set([
      ...upgradedPlanResult.changedEventIds,
      ...linkedPlanResult.changedEventIds,
      ...reconciledPlanResult.changedEventIds,
      ...adaptedPlanResult.changedEventIds,
    ]),
  ];
  const nextPlan = adaptedPlanResult.plan;
  const planChanged =
    changedEventIds.length > 0 ||
    nextPlan !== session.generatedPlan;

  if (!planChanged) {
    return session;
  }

  const updatedSession: IntakeSession = {
    ...session,
    generatedPlan: nextPlan,
    updatedAt: new Date().toISOString(),
  };

  await saveSession(updatedSession);

  if (
    options?.syncCalendar !== false &&
    changedEventIds.length &&
    updatedSession.calendarExternalId
  ) {
    const mergedAuthContext = await resolveGoogleAuthContext(
      updatedSession,
      authContext,
    );
    await syncCalendarEventUpdates(
      updatedSession,
      nextPlan,
      changedEventIds,
      mergedAuthContext,
    );
  }

  return updatedSession;
}

export async function startIntakeSession(
  timezone: string,
  attribution?: LaunchAttribution,
) {
  const now = new Date().toISOString();
  const session: IntakeSession = {
    id: randomUUID(),
    resumeToken: randomUUID(),
    status: "in_progress",
    currentStepId: firstStepId(),
    answers: {},
    timezone,
    startedAt: now,
    updatedAt: now,
    reportDeliveryStatus: "pending",
    calendarSyncStatus: "pending",
  };

  await saveSession(session);
  await trackLaunchEvent("intake_started", {
    sessionId: session.id,
    visitorId: attribution?.visitorId,
    route: attribution?.route,
    referrer: attribution?.referrer,
    metadata: {
      timezone,
    },
  });
  return session;
}

export async function restartIntakeSession(sessionId: string) {
  const currentSession = await getSessionById(sessionId);

  if (!currentSession) {
    throw new Error("Session not found");
  }

  const now = new Date().toISOString();
  const nextSession: IntakeSession = {
    id: randomUUID(),
    userId: currentSession.userId,
    resumeToken: randomUUID(),
    status: "in_progress",
    currentStepId: firstStepId(),
    answers: {},
    email: currentSession.email,
    timezone: currentSession.timezone,
    startedAt: now,
    updatedAt: now,
    reminderQueuedAt: currentSession.email
      ? new Date(Date.now() + 1000 * 60 * 60).toISOString()
      : undefined,
    calendarExternalId: currentSession.calendarExternalId,
    reportDeliveryStatus: "pending",
    calendarSyncStatus: "pending",
    calendarSyncState: undefined,
  };

  await saveSession(nextSession);
  return nextSession;
}

export async function resumeIntakeSession(token: string) {
  return getSessionByResumeToken(token);
}

export async function getSession(sessionId: string) {
  const session = await getSessionById(sessionId);

  if (!session) {
    return null;
  }

  return refreshDailyCheckInState(session);
}

export async function saveAnswer(
  sessionId: string,
  questionId: string,
  value: unknown,
  nextStepId?: string,
) {
  const session = await getSessionById(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  const question = getQuestionById(questionId);

  if (!question) {
    throw new Error("Question not found");
  }

  const answers: AnswerMap = {
    ...session.answers,
    [questionId]: normaliseAnswer(question.inputType, value),
  };
  const updatedSession: IntakeSession = {
    ...session,
    answers,
    currentStepId: nextStepId ?? session.currentStepId,
    updatedAt: new Date().toISOString(),
  };

  await saveSession(updatedSession);
  return updatedSession;
}

export async function captureEmail(
  sessionId: string,
  email: string,
  nextStepId?: string,
) {
  const session = await getSessionById(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  const updatedSession: IntakeSession = {
    ...session,
    email,
    currentStepId: nextStepId ?? session.currentStepId,
    reminderQueuedAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await saveSession(updatedSession);
  await trackLaunchEvent("email_captured", {
    sessionId: updatedSession.id,
    metadata: {
      emailDomain: email.split("@")[1] ?? undefined,
    },
  });
  return updatedSession;
}

export async function finalizeSession(sessionId: string) {
  const session = await getSessionById(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  const profile = buildSleepProfile(session.answers, session.timezone);
  const generatedPlan = attachDailyCheckInLinksToPlan(
    buildGeneratedPlan(profile),
    session.id,
    session.resumeToken,
  ).plan;
  const generatedReport = buildGeneratedReport(profile, generatedPlan);
  const updatedSession: IntakeSession = {
    ...session,
    status: "ready_for_google",
    currentStepId: "connect_google",
    generatedPlan,
    generatedReport,
    calendarSyncState: undefined,
    updatedAt: new Date().toISOString(),
  };

  await saveSession(updatedSession);
  await trackLaunchEvent("report_generated", {
    sessionId: updatedSession.id,
    metadata: {
      timezone: session.timezone,
      primaryProblem: profile.primaryProblem,
      cautionFlagCount: profile.cautionFlags.length,
    },
  });
  return updatedSession;
}

export async function connectGoogleAndDeliver(
  sessionId: string,
  authContext?: GoogleAuthContext,
) {
  const currentSession = await getSessionById(sessionId);

  if (!currentSession || !currentSession.generatedPlan || !currentSession.generatedReport) {
    throw new Error("Session not ready");
  }

  let session = currentSession;

  if (authContext?.userId || authContext?.email) {
    session = await linkSessionToUser(currentSession, authContext);
  }

  if (
    authContext?.userId &&
    (authContext.accessToken || authContext.refreshToken || authContext.expiresAt)
  ) {
    await updateStoredGoogleAccountTokens(authContext.userId, authContext);
  }

  session = await refreshDailyCheckInState(session, authContext);

  if (!session.generatedPlan || !session.generatedReport) {
    throw new Error("Session not ready");
  }

  const generatedPlan = session.generatedPlan;
  const generatedReport = session.generatedReport;
  const mergedAuthContext = await resolveGoogleAuthContext(session, authContext);

  const emailResult =
    session.reportDeliveryStatus === "sent" || session.reportDeliveryStatus === "preview"
      ? { status: session.reportDeliveryStatus }
      : await sendReportEmail(session, generatedReport);
  const calendarResult = await syncCalendarProgram(
    session,
    generatedPlan,
    mergedAuthContext,
  );
  const deliveryFailed = emailResult.status === "failed";
  const deliveryCompleted =
    (calendarResult.status === "synced" || calendarResult.status === "preview") &&
    !deliveryFailed;
  const now = new Date().toISOString();
  const shouldQueueFeedbackFollowUp =
    deliveryCompleted &&
    Boolean(session.email) &&
    !session.feedbackFollowUpQueuedAt;

  const updatedSession: IntakeSession = {
    ...session,
    status: deliveryCompleted ? "completed" : "ready_for_google",
    currentStepId: "connect_google",
    googleConnectedAt: deliveryCompleted
      ? now
      : calendarResult.status === "syncing"
        ? session.googleConnectedAt ?? now
        : deliveryFailed
      ? session.googleConnectedAt ?? now
      : now,
    calendarExternalId: calendarResult.calendarId ?? session.calendarExternalId,
    reportDeliveryStatus: emailResult.status,
    calendarSyncStatus: calendarResult.status,
    calendarSyncState: calendarResult.syncState ?? session.calendarSyncState,
    feedbackFollowUpQueuedAt: shouldQueueFeedbackFollowUp
      ? new Date(
          Date.now() + feedbackFollowUpDelayHours * 60 * 60 * 1000,
        ).toISOString()
      : session.feedbackFollowUpQueuedAt,
    updatedAt: now,
  };

  await saveSession(updatedSession);
  if (!session.googleConnectedAt && updatedSession.googleConnectedAt) {
    await trackLaunchEvent("calendar_connected", {
      sessionId: updatedSession.id,
      metadata: {
        calendarSyncStatus: updatedSession.calendarSyncStatus,
        reportDeliveryStatus: updatedSession.reportDeliveryStatus,
      },
    });
  }

  return {
    session: updatedSession,
    emailResult,
    calendarResult,
  };
}

export async function removeGoogleCalendar(
  sessionId: string,
  authContext?: GoogleAuthContext,
) {
  const currentSession = await getSessionById(sessionId);

  if (!currentSession) {
    throw new Error("Session not found");
  }

  let session = currentSession;

  if (authContext?.userId || authContext?.email) {
    session = await linkSessionToUser(currentSession, authContext);
  }

  if (
    authContext?.userId &&
    (authContext.accessToken || authContext.refreshToken || authContext.expiresAt)
  ) {
    await updateStoredGoogleAccountTokens(authContext.userId, authContext);
  }

  const mergedAuthContext = await resolveGoogleAuthContext(session, authContext);
  const deleteResult = await deleteCalendarProgram(session, mergedAuthContext);

  if (deleteResult.status !== "deleted") {
    return {
      session,
      deleteResult,
    };
  }

  const updatedSession: IntakeSession = {
    ...session,
    status: "ready_for_google",
    currentStepId: "connect_google",
    calendarExternalId: undefined,
    calendarSyncStatus: "pending",
    calendarSyncState: undefined,
    updatedAt: new Date().toISOString(),
  };

  await saveSession(updatedSession);

  return {
    session: updatedSession,
    deleteResult,
  };
}

export async function getDailyCheckIn(
  sessionId: string,
  nightDate: string,
  token: string,
  authContext?: GoogleAuthContext,
) {
  const session = await getSessionById(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  if (!isValidDailyCheckInToken(session.resumeToken, nightDate, token)) {
    throw new Error("Invalid check-in token");
  }

  const refreshedSession = await refreshDailyCheckInState(session, authContext, {
    syncCalendar: false,
  });
  const draftDefaults = buildDailyCheckInDraftDefaults(refreshedSession, nightDate);

  if (!draftDefaults) {
    throw new Error("Night not available");
  }

  if (new Date().getTime() < new Date(draftDefaults.sleepEventEndsAt).getTime()) {
    throw new Error("This night has not ended yet");
  }

  return {
    session: refreshedSession,
    draftDefaults,
  };
}

export async function submitDailyCheckIn(
  sessionId: string,
  nightDate: string,
  token: string,
  entry: Omit<
    DailySleepCheckIn,
    | "nightDate"
    | "sleepEventId"
    | "checkInEventId"
    | "derivedTitleTags"
    | "submittedAt"
    | "updatedAt"
  >,
  authContext?: GoogleAuthContext,
) {
  const session = await getSessionById(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  if (!isValidDailyCheckInToken(session.resumeToken, nightDate, token)) {
    throw new Error("Invalid check-in token");
  }

  const refreshedSession = await refreshDailyCheckInState(session, authContext, {
    syncCalendar: false,
  });
  const draftDefaults = buildDailyCheckInDraftDefaults(refreshedSession, nightDate);

  if (!draftDefaults) {
    throw new Error("Night not available");
  }

  if (new Date().getTime() < new Date(draftDefaults.sleepEventEndsAt).getTime()) {
    throw new Error("This night has not ended yet");
  }

  const previousLogCount = refreshedSession.dailyCheckIns?.length ?? 0;
  const sessionWithLog = upsertDailyCheckIn(refreshedSession, {
    ...entry,
    nightDate,
    sleepEventId: draftDefaults.sleepEventId,
    checkInEventId: draftDefaults.checkInEventId,
  });
  const savedSession = await saveSession(sessionWithLog);
  const nextSession = await refreshDailyCheckInState(savedSession, authContext);
  const nextSleepEvent =
    nextSession.generatedPlan?.events.find(
      (event) => event.id === draftDefaults.sleepEventId,
    ) ?? null;
  const adaptiveSummary = nextSession.generatedPlan
    ? getAdaptivePlanSummary(nextSession.generatedPlan, nextSession.dailyCheckIns)
    : [];
  const nextLogCount = nextSession.dailyCheckIns?.length ?? 0;

  await trackLaunchEvent("checkin_submitted", {
    sessionId: nextSession.id,
    metadata: {
      nightDate,
      sleepEventId: draftDefaults.sleepEventId,
      logCount: nextLogCount,
    },
  });

  if (previousLogCount === 0 && nextLogCount > 0) {
    await trackLaunchEvent("first_checkin_submitted", {
      sessionId: nextSession.id,
      metadata: {
        nightDate,
      },
    });
  }

  return {
    session: nextSession,
    draftDefaults: buildDailyCheckInDraftDefaults(nextSession, nightDate),
    sleepEvent: nextSleepEvent,
    adaptiveSummary,
  };
}

export async function processResumeReminders() {
  const sessions = await listSessions();
  const now = Date.now();
  const due = sessions.filter(
    (session) =>
      session.email &&
      session.status === "in_progress" &&
      session.reminderQueuedAt &&
      !session.reminderSentAt &&
      new Date(session.reminderQueuedAt).getTime() <= now,
  );

  const results = [];

  for (const session of due) {
    await sendResumeReminderEmail(session);
    const updatedSession = {
      ...session,
      reminderSentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await saveSession(updatedSession);
    results.push(updatedSession.id);
  }

  return results;
}

export async function processBetaFeedbackFollowUps() {
  const sessions = await listSessions();
  const now = Date.now();
  const processed: Array<{
    sessionId: string;
    status:
      | "sent"
      | "pending"
      | "preview"
      | "skipped_existing_feedback"
      | "failed";
  }> = [];

  const due = sessions.filter(
    (session) =>
      session.email &&
      session.status === "completed" &&
      session.feedbackFollowUpQueuedAt &&
      !session.feedbackFollowUpSentAt &&
      new Date(session.feedbackFollowUpQueuedAt).getTime() <= now,
  );

  for (const session of due) {
    const alreadySharedFeedback = await hasFeedbackForSession(session.id);

    if (alreadySharedFeedback) {
      await saveSession({
        ...session,
        feedbackFollowUpSentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      processed.push({
        sessionId: session.id,
        status: "skipped_existing_feedback",
      });
      continue;
    }

    const result = await sendBetaFeedbackFollowUpEmail(session);

    if (result.status === "failed") {
      processed.push({
        sessionId: session.id,
        status: "failed",
      });
      continue;
    }

    await saveSession({
      ...session,
      feedbackFollowUpSentAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    processed.push({
      sessionId: session.id,
      status: result.status,
    });
  }

  return processed;
}
