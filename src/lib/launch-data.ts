import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  LaunchAnalyticsEvent,
  LaunchAnalyticsEventType,
  LaunchFeedbackEntry,
  LaunchFeedbackSource,
} from "@/lib/types";

type LaunchStoreShape = {
  analytics: LaunchAnalyticsEvent[];
  feedback: LaunchFeedbackEntry[];
};

const launchStorePath = path.join(process.cwd(), "data", "launch.json");

type AnalyticsInput = Omit<LaunchAnalyticsEvent, "id" | "createdAt">;
type FeedbackInput = Omit<LaunchFeedbackEntry, "id" | "createdAt">;

async function ensureLaunchStore() {
  await mkdir(path.dirname(launchStorePath), { recursive: true });

  try {
    await readFile(launchStorePath, "utf8");
  } catch {
    const initial: LaunchStoreShape = {
      analytics: [],
      feedback: [],
    };

    await writeFile(launchStorePath, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readLaunchStore(): Promise<LaunchStoreShape> {
  await ensureLaunchStore();
  const raw = await readFile(launchStorePath, "utf8");
  return JSON.parse(raw) as LaunchStoreShape;
}

async function writeLaunchStore(store: LaunchStoreShape) {
  await writeFile(launchStorePath, JSON.stringify(store, null, 2), "utf8");
}

export async function recordAnalyticsEvent(
  input: AnalyticsInput,
): Promise<LaunchAnalyticsEvent> {
  const event: LaunchAnalyticsEvent = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };

  if (!prisma) {
    const store = await readLaunchStore();
    store.analytics.unshift(event);
    await writeLaunchStore(store);
    return event;
  }

  const analyticsMetadata = input.metadata
    ? (input.metadata as Prisma.InputJsonValue)
    : Prisma.JsonNull;

  const created = await prisma.analyticsEvent.create({
    data: {
      eventType: input.eventType,
      sessionId: input.sessionId ?? null,
      visitorId: input.visitorId ?? null,
      route: input.route ?? null,
      referrer: input.referrer ?? null,
      metadata: analyticsMetadata,
    },
  });

  return {
    id: created.id,
    eventType: created.eventType as LaunchAnalyticsEventType,
    sessionId: created.sessionId ?? undefined,
    visitorId: created.visitorId ?? undefined,
    route: created.route ?? undefined,
    referrer: created.referrer ?? undefined,
    metadata: (created.metadata as Record<string, unknown>) ?? undefined,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function createFeedbackEntry(
  input: FeedbackInput,
): Promise<LaunchFeedbackEntry> {
  const entry: LaunchFeedbackEntry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };

  if (!prisma) {
    const store = await readLaunchStore();
    store.feedback.unshift(entry);
    await writeLaunchStore(store);
    return entry;
  }

  const feedbackMetadata = input.metadata
    ? (input.metadata as Prisma.InputJsonValue)
    : Prisma.JsonNull;

  const created = await prisma.feedbackEntry.create({
    data: {
      source: input.source,
      rating: input.rating,
      message: input.message ?? null,
      sessionId: input.sessionId ?? null,
      email: input.email ?? null,
      metadata: feedbackMetadata,
    },
  });

  return {
    id: created.id,
    source: created.source as LaunchFeedbackSource,
    rating: created.rating,
    message: created.message ?? undefined,
    sessionId: created.sessionId ?? undefined,
    email: created.email ?? undefined,
    metadata: (created.metadata as Record<string, unknown>) ?? undefined,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function hasFeedbackForSession(sessionId: string) {
  if (!prisma) {
    const store = await readLaunchStore();
    return store.feedback.some((entry) => entry.sessionId === sessionId);
  }

  const count = await prisma.feedbackEntry.count({
    where: {
      sessionId,
    },
  });

  return count > 0;
}

export async function listAnalyticsEvents(limit = 200) {
  if (!prisma) {
    const store = await readLaunchStore();
    return store.analytics
      .slice()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  const events = await prisma.analyticsEvent.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return events.map((event) => ({
    id: event.id,
    eventType: event.eventType as LaunchAnalyticsEventType,
    sessionId: event.sessionId ?? undefined,
    visitorId: event.visitorId ?? undefined,
    route: event.route ?? undefined,
    referrer: event.referrer ?? undefined,
    metadata: (event.metadata as Record<string, unknown>) ?? undefined,
    createdAt: event.createdAt.toISOString(),
  }));
}

export async function listFeedbackEntries(limit = 100) {
  if (!prisma) {
    const store = await readLaunchStore();
    return store.feedback
      .slice()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  const entries = await prisma.feedbackEntry.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });

  return entries.map((entry) => ({
    id: entry.id,
    source: entry.source as LaunchFeedbackSource,
    rating: entry.rating,
    message: entry.message ?? undefined,
    sessionId: entry.sessionId ?? undefined,
    email: entry.email ?? undefined,
    metadata: (entry.metadata as Record<string, unknown>) ?? undefined,
    createdAt: entry.createdAt.toISOString(),
  }));
}
