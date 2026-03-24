import { Prisma } from "@prisma/client";
import type { Account as PrismaAccount, IntakeSessionRecord } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  deleteSessions as deleteStoredSessions,
  getSessionById as getStoredSessionById,
  getSessionByResumeToken as getStoredSessionByResumeToken,
  listSessions as listStoredSessions,
  saveSession as saveStoredSession,
} from "@/lib/store";
import type { GoogleAuthContext, IntakeSession } from "@/lib/types";

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return undefined;
  }

  return typeof value === "string" ? value : value.toISOString();
}

function serialiseSession(record: IntakeSessionRecord): IntakeSession {
  return {
    id: record.id,
    userId: record.userId ?? undefined,
    resumeToken: record.resumeToken,
    status: record.status as IntakeSession["status"],
    currentStepId: record.currentStepId,
    answers: record.answers as IntakeSession["answers"],
    email: record.email ?? undefined,
    timezone: record.timezone,
    startedAt: record.startedAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    reminderQueuedAt: toIsoString(record.reminderQueuedAt),
    reminderSentAt: toIsoString(record.reminderSentAt),
    feedbackFollowUpQueuedAt: toIsoString(record.feedbackFollowUpQueuedAt),
    feedbackFollowUpSentAt: toIsoString(record.feedbackFollowUpSentAt),
    googleConnectedAt: toIsoString(record.googleConnectedAt),
    calendarExternalId: record.calendarExternalId ?? undefined,
    reportDeliveryStatus: record.reportDeliveryStatus as IntakeSession["reportDeliveryStatus"],
    calendarSyncStatus: record.calendarSyncStatus as IntakeSession["calendarSyncStatus"],
    calendarSyncState:
      (record.calendarSyncState as IntakeSession["calendarSyncState"]) ?? undefined,
    generatedPlan: (record.generatedPlan as IntakeSession["generatedPlan"]) ?? undefined,
    generatedReport:
      (record.generatedReport as IntakeSession["generatedReport"]) ?? undefined,
    dailyCheckIns:
      (record.dailyCheckIns as IntakeSession["dailyCheckIns"]) ?? undefined,
  };
}

function toDbPayload(session: IntakeSession) {
  return {
    userId: session.userId ?? null,
    resumeToken: session.resumeToken,
    status: session.status,
    currentStepId: session.currentStepId,
    answers: session.answers,
    email: session.email ?? null,
    timezone: session.timezone,
    startedAt: new Date(session.startedAt),
    updatedAt: new Date(session.updatedAt),
    reminderQueuedAt: session.reminderQueuedAt
      ? new Date(session.reminderQueuedAt)
      : null,
    reminderSentAt: session.reminderSentAt ? new Date(session.reminderSentAt) : null,
    feedbackFollowUpQueuedAt: session.feedbackFollowUpQueuedAt
      ? new Date(session.feedbackFollowUpQueuedAt)
      : null,
    feedbackFollowUpSentAt: session.feedbackFollowUpSentAt
      ? new Date(session.feedbackFollowUpSentAt)
      : null,
    googleConnectedAt: session.googleConnectedAt
      ? new Date(session.googleConnectedAt)
      : null,
    calendarExternalId: session.calendarExternalId ?? null,
    reportDeliveryStatus: session.reportDeliveryStatus,
    calendarSyncStatus: session.calendarSyncStatus,
    calendarSyncState: session.calendarSyncState ?? Prisma.JsonNull,
    generatedPlan: session.generatedPlan ?? Prisma.JsonNull,
    generatedReport: session.generatedReport ?? Prisma.JsonNull,
    dailyCheckIns: session.dailyCheckIns ?? Prisma.JsonNull,
  };
}

export async function saveSession(session: IntakeSession) {
  if (!prisma) {
    return saveStoredSession(session);
  }

  const record = await prisma.intakeSessionRecord.upsert({
    where: { id: session.id },
    create: {
      id: session.id,
      ...toDbPayload(session),
    },
    update: toDbPayload(session),
  });

  return serialiseSession(record);
}

export async function getSessionById(sessionId: string) {
  if (!prisma) {
    return getStoredSessionById(sessionId);
  }

  const record = await prisma.intakeSessionRecord.findUnique({
    where: { id: sessionId },
  });

  return record ? serialiseSession(record) : null;
}

export async function getSessionByResumeToken(token: string) {
  if (!prisma) {
    return getStoredSessionByResumeToken(token);
  }

  const record = await prisma.intakeSessionRecord.findUnique({
    where: { resumeToken: token },
  });

  return record ? serialiseSession(record) : null;
}

export async function listSessions() {
  if (!prisma) {
    return listStoredSessions();
  }

  const records = await prisma.intakeSessionRecord.findMany();
  return records.map(serialiseSession);
}

export async function deleteSessions(sessionIds: string[]) {
  if (!sessionIds.length) {
    return 0;
  }

  if (!prisma) {
    return deleteStoredSessions(sessionIds);
  }

  const result = await prisma.intakeSessionRecord.deleteMany({
    where: {
      id: {
        in: sessionIds,
      },
    },
  });

  return result.count;
}

export async function linkSessionToUser(
  session: IntakeSession,
  authContext: GoogleAuthContext,
) {
  let linkedUserId = session.userId;

  if (prisma && authContext.userId) {
    const existingUser = await prisma.user.findUnique({
      where: { id: authContext.userId },
      select: { id: true },
    });

    linkedUserId = existingUser?.id ?? session.userId;
  } else if (!prisma) {
    linkedUserId = authContext.userId ?? session.userId;
  }

  const updatedSession: IntakeSession = {
    ...session,
    userId: linkedUserId,
    email: session.email ?? authContext.email ?? undefined,
    updatedAt: new Date().toISOString(),
  };

  return saveSession(updatedSession);
}

export async function getStoredGoogleAccount(userId: string) {
  if (!prisma) {
    return null;
  }

  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
  });

  return account as PrismaAccount | null;
}

export async function updateStoredGoogleAccountTokens(
  userId: string,
  authContext: GoogleAuthContext,
) {
  if (!prisma || !userId) {
    return null;
  }

  const existingAccount = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
    select: {
      provider: true,
      providerAccountId: true,
    },
  });

  if (!existingAccount) {
    return null;
  }

  return prisma.account.update({
    where: {
      provider_providerAccountId: {
        provider: existingAccount.provider,
        providerAccountId: existingAccount.providerAccountId,
      },
    },
    data: {
      access_token: authContext.accessToken ?? undefined,
      refresh_token: authContext.refreshToken ?? undefined,
      expires_at: authContext.expiresAt ?? undefined,
    },
  });
}
