import { createHash } from "node:crypto";

import { addDays, format, set } from "date-fns";

import type {
  DailySleepCheckIn,
  GeneratedPlan,
  IntakeSession,
  ProgramEvent,
} from "@/lib/types";

const missingSleepTitle = "Sleep - not logged";
const protectedSleepWindowTitle = "🛏️ Protected sleep window";
const inBedPracticeTitle = "🛏️ In-bed practice";
const dailyCheckInTitle = "🌅 Morning sleep log";
const dailyCheckInDescription =
  "Take 30 to 60 seconds to log the night that just ended. It keeps your plan tied to what actually happened, not memory alone.";

function appBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function buildFormatter(
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    ...options,
  });
}

function dateKeyFromParts(parts: Intl.DateTimeFormatPart[]) {
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function nightDateFromIso(iso: string, timeZone: string) {
  const formatter = buildFormatter(timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return dateKeyFromParts(formatter.formatToParts(new Date(iso)));
}

export function timeValueFromIso(iso: string, timeZone: string) {
  const formatter = buildFormatter(timeZone, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date(iso));
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

export function nightDateLabel(nightDate: string) {
  const [year, month, day] = nightDate.split("-").map(Number);
  return format(new Date(year, (month ?? 1) - 1, day ?? 1), "EEEE, MMMM d");
}

function timeLabel(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = set(new Date(), {
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0,
    seconds: 0,
    milliseconds: 0,
  });

  return format(date, "h:mm a");
}

function resolveNearestClockTime(value: string, anchorIso: string) {
  const anchor = new Date(anchorIso);
  const [hours, minutes] = value.split(":").map(Number);
  const anchorDate = set(anchor, {
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0,
    seconds: 0,
    milliseconds: 0,
  });
  const candidates = [
    anchorDate,
    addDays(anchorDate, -1),
    addDays(anchorDate, 1),
  ];

  return candidates.reduce((closest, candidate) => {
    const closestDiff = Math.abs(closest.getTime() - anchor.getTime());
    const candidateDiff = Math.abs(candidate.getTime() - anchor.getTime());
    return candidateDiff < closestDiff ? candidate : closest;
  });
}

function differenceInMinutes(value: string, anchorIso: string) {
  const candidate = resolveNearestClockTime(value, anchorIso);
  return Math.round((candidate.getTime() - new Date(anchorIso).getTime()) / 60000);
}

function coachInterpretation(tags: string[]) {
  if (!tags.length) {
    return "This night has been logged. Keep the next morning and evening steady.";
  }

  if (tags.includes("close to plan")) {
    return "This night stayed reasonably close to plan. Consistency is starting to become visible.";
  }

  if (tags.includes("late start") && tags.includes("early wake")) {
    return "This night drifted later and still ended earlier than planned. Keep the wake anchor steady and lower the effort at bedtime tonight.";
  }

  if (tags.includes("late start")) {
    return "This night started later than planned. Tonight's guidance should lean harder on the evening descent and lower-stimulation cues.";
  }

  if (tags.includes("early wake")) {
    return "This night ended earlier than planned. Resist compensating by sleeping in, and keep tomorrow morning boringly consistent.";
  }

  if (tags.includes("long awake time")) {
    return "This night included meaningful wake time. Overnight reset guidance matters more here than trying harder in bed.";
  }

  if (tags.some((tag) => tag.includes("awakenings"))) {
    return "This night was broken by repeated awakenings. Keep the rescue steps clear and low effort.";
  }

  return "This night has been logged. Stay with the plan and let repeated nights tell the real story.";
}

function sleepLatencyLabel(value?: DailySleepCheckIn["sleepLatencyBucket"]) {
  switch (value) {
    case "under_20":
      return "under 20 minutes";
    case "20_40":
      return "20 to 40 minutes";
    case "40_60":
      return "40 to 60 minutes";
    case "over_60":
      return "more than an hour";
    default:
      return "not logged";
  }
}

function awakeDuringNightLabel(value?: DailySleepCheckIn["awakeDuringNightBucket"]) {
  switch (value) {
    case "under_20":
      return "under 20 minutes";
    case "20_40":
      return "20 to 40 minutes";
    case "40_60":
      return "40 to 60 minutes";
    case "over_60":
      return "more than an hour";
    default:
      return "not logged";
  }
}

function awakeningsLabel(value?: DailySleepCheckIn["awakeningsBucket"]) {
  switch (value) {
    case "1":
      return "1";
    case "2":
      return "2";
    case "3_4":
      return "3 to 4";
    case "5_plus":
      return "5 or more";
    default:
      return "not logged";
  }
}

function earlyWakeLabel(value?: DailySleepCheckIn["earlyWakeBucket"]) {
  switch (value) {
    case "under_30":
      return "under 30 minutes";
    case "30_60":
      return "30 to 60 minutes";
    case "60_90":
      return "60 to 90 minutes";
    case "over_90":
      return "more than 90 minutes";
    default:
      return "none reported";
  }
}

function morningFunctionLabel(value: DailySleepCheckIn["morningFunction"]) {
  switch (value) {
    case "good_enough":
      return "good enough";
    case "tired_but_manageable":
      return "tired but manageable";
    case "running_on_fumes":
      return "running on fumes";
  }
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

export type DailyCheckInDraftSnapshot = {
  closenessToPlan: DailySleepCheckIn["closenessToPlan"] | "";
  actualInBedTime: string;
  actualOutOfBedTime: string;
  nightPattern: DailySleepCheckIn["nightPattern"] | "";
  sleepLatencyBucket?: DailySleepCheckIn["sleepLatencyBucket"];
  awakeDuringNightBucket?: DailySleepCheckIn["awakeDuringNightBucket"];
  awakeningsBucket?: DailySleepCheckIn["awakeningsBucket"];
  earlyWakeBucket?: DailySleepCheckIn["earlyWakeBucket"];
  morningFunction: DailySleepCheckIn["morningFunction"] | "";
};

export function normalizeDailyCheckInDraft(
  draft: DailyCheckInDraftSnapshot,
): DailyCheckInDraftSnapshot {
  const nextDraft = { ...draft };

  if (nextDraft.nightPattern !== "slow_sleep" && nextDraft.nightPattern !== "rough_mix") {
    delete nextDraft.sleepLatencyBucket;
  }

  if (
    nextDraft.nightPattern !== "several_wakeups" &&
    nextDraft.nightPattern !== "rough_mix"
  ) {
    delete nextDraft.awakeDuringNightBucket;
    delete nextDraft.awakeningsBucket;
  }

  if (nextDraft.nightPattern !== "early_wake" && nextDraft.nightPattern !== "rough_mix") {
    delete nextDraft.earlyWakeBucket;
  }

  return nextDraft;
}

export function buildDailyCheckInToken(resumeToken: string, nightDate: string) {
  return createHash("sha256")
    .update(`${resumeToken}:${nightDate}:daily-checkin`)
    .digest("hex")
    .slice(0, 24);
}

export function isValidDailyCheckInToken(
  resumeToken: string,
  nightDate: string,
  token: string,
) {
  return buildDailyCheckInToken(resumeToken, nightDate) === token;
}

export function buildDailyCheckInUrl(
  sessionId: string,
  resumeToken: string,
  nightDate: string,
) {
  const token = buildDailyCheckInToken(resumeToken, nightDate);
  return `${appBaseUrl()}/check-in/${sessionId}/${nightDate}?token=${token}`;
}

function buildCheckInDescription(baseDescription: string, url: string) {
  return [
    baseDescription,
    "Open your morning log:",
    url,
  ].join("\n\n");
}

export function getSleepEventForNight(plan: GeneratedPlan, nightDate: string) {
  return (
    plan.events.find(
      (event) => event.eventRole === "sleep_window" && event.nightDate === nightDate,
    ) ?? null
  );
}

export function getCheckInEventForNight(plan: GeneratedPlan, nightDate: string) {
  return (
    plan.events.find(
      (event) => event.eventRole === "daily_checkin" && event.nightDate === nightDate,
    ) ?? null
  );
}

function inferEventRole(event: ProgramEvent) {
  const currentTitle = event.baseTitle ?? event.title;

  if (event.eventRole) {
    return event.eventRole;
  }

  if (
    event.eventType === "checkin" ||
    event.id.includes("checkin-daily-log") ||
    currentTitle === dailyCheckInTitle ||
    currentTitle === "1-minute sleep check-in" ||
    currentTitle === "1-minute sleep log"
  ) {
    return "daily_checkin" as const;
  }

  if (
    event.eventType === "bed" &&
    (event.id.includes("in-bed-practice") || currentTitle === inBedPracticeTitle)
  ) {
    return "in_bed_practice" as const;
  }

  if (
    event.eventType === "bed" &&
    (event.id.includes("sleep-window") ||
      currentTitle === protectedSleepWindowTitle ||
      currentTitle === missingSleepTitle ||
      currentTitle === "Sleep" ||
      currentTitle.startsWith("Sleep - "))
  ) {
    return "sleep_window" as const;
  }

  return event.eventRole;
}

function inferBaseTitle(event: ProgramEvent, eventRole: ProgramEvent["eventRole"]) {
  if (event.baseTitle) {
    return event.baseTitle;
  }

  if (eventRole === "sleep_window") {
    return protectedSleepWindowTitle;
  }

  if (eventRole === "in_bed_practice") {
    return inBedPracticeTitle;
  }

  if (eventRole === "daily_checkin") {
    return dailyCheckInTitle;
  }

  return event.title;
}

function inferBaseDescription(event: ProgramEvent) {
  return event.baseDescription ?? event.description;
}

function inferNightDate(
  event: ProgramEvent,
  eventRole: ProgramEvent["eventRole"],
  timeZone: string,
) {
  if (event.nightDate) {
    return event.nightDate;
  }

  if (
    eventRole === "sleep_window" ||
    eventRole === "in_bed_practice" ||
    eventRole === "daily_checkin"
  ) {
    return nightDateFromIso(event.endsAt, timeZone);
  }

  return undefined;
}

function plannedStartIso(event: ProgramEvent) {
  return event.plannedStartsAt ?? event.startsAt;
}

function plannedEndIso(event: ProgramEvent) {
  return event.plannedEndsAt ?? event.endsAt;
}

export function ensurePlanHasDailyCheckInEvents(plan: GeneratedPlan) {
  const changedEventIds: string[] = [];
  const existingCheckInsByNight = new Set<string>();
  const upgradedEvents = plan.events.map((event) => {
    const inferredRole = inferEventRole(event);
    const shouldNormalizeCopy =
      inferredRole === "sleep_window" ||
      inferredRole === "in_bed_practice" ||
      inferredRole === "daily_checkin";
    const baseTitle = shouldNormalizeCopy
      ? inferBaseTitle(event, inferredRole ?? "standard")
      : event.baseTitle;
    const baseDescription = shouldNormalizeCopy
      ? inferBaseDescription(event)
      : event.baseDescription;
    const nightDate = inferNightDate(
      event,
      inferredRole ?? "standard",
      plan.timezone,
    );

    const changed =
      (inferredRole && event.eventRole !== inferredRole) ||
      event.baseTitle !== baseTitle ||
      event.baseDescription !== baseDescription ||
      (inferredRole === "sleep_window" &&
        (event.plannedStartsAt !== (event.plannedStartsAt ?? event.startsAt) ||
          event.plannedEndsAt !== (event.plannedEndsAt ?? event.endsAt))) ||
      event.nightDate !== nightDate;

    const nextEvent = changed
      ? {
          ...event,
          eventRole: inferredRole ?? event.eventRole,
          baseTitle,
          baseDescription,
          plannedStartsAt:
            (inferredRole ?? event.eventRole) === "sleep_window"
              ? event.plannedStartsAt ?? event.startsAt
              : event.plannedStartsAt,
          plannedEndsAt:
            (inferredRole ?? event.eventRole) === "sleep_window"
              ? event.plannedEndsAt ?? event.endsAt
              : event.plannedEndsAt,
          nightDate,
        }
      : event;

    if (nextEvent.eventRole === "daily_checkin" && nextEvent.nightDate) {
      existingCheckInsByNight.add(nextEvent.nightDate);
    }

    if (changed) {
      changedEventIds.push(event.id);
    }

    return nextEvent;
  });

  const addedEvents: ProgramEvent[] = [];

  for (const sleepEvent of upgradedEvents) {
    if (sleepEvent.eventRole !== "sleep_window" || !sleepEvent.nightDate) {
      continue;
    }

    if (existingCheckInsByNight.has(sleepEvent.nightDate)) {
      continue;
    }

    const checkInStart = addDays(new Date(sleepEvent.endsAt), 0);
    checkInStart.setMinutes(checkInStart.getMinutes() + 25);

    const checkInEvent: ProgramEvent = {
      id: `${sleepEvent.nightDate}-checkin-daily-log`,
      title: dailyCheckInTitle,
      baseTitle: dailyCheckInTitle,
      description: dailyCheckInDescription,
      baseDescription: dailyCheckInDescription,
      startsAt: checkInStart.toISOString(),
      endsAt: new Date(checkInStart.getTime() + 5 * 60 * 1000).toISOString(),
      dayLabel: format(checkInStart, "EEE, MMM d"),
      weekNumber: sleepEvent.weekNumber,
      calendarColorId: "2",
      nightDate: sleepEvent.nightDate,
      eventRole: "daily_checkin",
      eventType: "checkin",
    };

    existingCheckInsByNight.add(sleepEvent.nightDate);
    changedEventIds.push(checkInEvent.id);
    addedEvents.push(checkInEvent);
  }

  if (!changedEventIds.length) {
    return {
      plan,
      changedEventIds,
    };
  }

  return {
    plan: {
      ...plan,
      events: [...upgradedEvents, ...addedEvents].sort((left, right) =>
        left.startsAt.localeCompare(right.startsAt),
      ),
    },
    changedEventIds,
  };
}

export function attachDailyCheckInLinksToPlan(
  plan: GeneratedPlan,
  sessionId: string,
  resumeToken: string,
) {
  const changedEventIds: string[] = [];

  const events = plan.events.map((event) => {
    if (event.eventRole !== "daily_checkin" || !event.nightDate) {
      return event;
    }

    const url = buildDailyCheckInUrl(sessionId, resumeToken, event.nightDate);
    const baseDescription = event.baseDescription ?? event.description;
    const description = buildCheckInDescription(baseDescription, url);

    if (event.description === description && event.actionUrl === url) {
      return event;
    }

    changedEventIds.push(event.id);
    return {
      ...event,
      description,
      baseDescription,
      actionUrl: url,
    };
  });

  return {
    plan: changedEventIds.length ? { ...plan, events } : plan,
    changedEventIds,
  };
}

export function deriveLoggedSleepTags(
  entry: Omit<DailySleepCheckIn, "derivedTitleTags" | "submittedAt" | "updatedAt">,
  sleepEvent: ProgramEvent,
) {
  const tags: string[] = [];
  const bedtimeDriftMinutes = differenceInMinutes(
    entry.actualInBedTime,
    plannedStartIso(sleepEvent),
  );
  const wakeDriftMinutes = differenceInMinutes(
    entry.actualOutOfBedTime,
    plannedEndIso(sleepEvent),
  );
  const bedtimeStayedClose = Math.abs(bedtimeDriftMinutes) <= 30;
  const wakeStayedClose = Math.abs(wakeDriftMinutes) <= 30;

  if (
    entry.nightPattern === "fell_asleep_quickly" &&
    entry.morningFunction !== "running_on_fumes" &&
    bedtimeStayedClose &&
    wakeStayedClose
  ) {
    return ["close to plan"];
  }

  if (bedtimeDriftMinutes > 30) {
    tags.push("late start");
  }

  if (
    entry.nightPattern === "early_wake" ||
    entry.earlyWakeBucket ||
    wakeDriftMinutes < -30
  ) {
    tags.push("early wake");
  } else if (wakeDriftMinutes > 45) {
    tags.push("late rise");
  }

  if (entry.awakeningsBucket === "5_plus") {
    tags.push("many awakenings");
  } else if (entry.awakeningsBucket === "3_4") {
    tags.push("4 awakenings");
  }

  if (
    entry.awakeDuringNightBucket === "40_60" ||
    entry.awakeDuringNightBucket === "over_60"
  ) {
    tags.push("long awake time");
  }

  if (!tags.length && entry.nightPattern === "rough_mix") {
    tags.push("rough night");
  }

  return unique(tags).slice(0, 2);
}

export function buildLoggedSleepTitle(tags: string[]) {
  if (!tags.length) {
    return "Sleep";
  }

  return `Sleep - ${tags.join(" - ")}`;
}

function buildLoggedOutcomeDescription(
  baseDescription: string,
  entry: DailySleepCheckIn,
  sleepEvent: ProgramEvent,
  timeZone: string,
) {
  const plannedBedtime = timeLabel(timeValueFromIso(plannedStartIso(sleepEvent), timeZone));
  const plannedWakeTime = timeLabel(timeValueFromIso(plannedEndIso(sleepEvent), timeZone));
  const tags = entry.derivedTitleTags;

  return [
    baseDescription,
    "Planned window",
    `- Planned bedtime: ${plannedBedtime}`,
    `- Planned wake time: ${plannedWakeTime}`,
    "",
    "Logged outcome",
    `- In bed: ${timeLabel(entry.actualInBedTime)}`,
    `- Out of bed: ${timeLabel(entry.actualOutOfBedTime)}`,
    `- Sleep onset: ${sleepLatencyLabel(entry.sleepLatencyBucket)}`,
    `- Night awakenings: ${awakeningsLabel(entry.awakeningsBucket)}`,
    `- Awake during night: ${awakeDuringNightLabel(entry.awakeDuringNightBucket)}`,
    `- Early wake: ${earlyWakeLabel(entry.earlyWakeBucket)}`,
    `- Morning function: ${morningFunctionLabel(entry.morningFunction)}`,
    "",
    "Coach interpretation",
    `- ${coachInterpretation(tags)}`,
  ].join("\n");
}

function buildMissingDescription(baseDescription: string) {
  return [
    baseDescription,
    "Log status",
    "- No log has been entered for this night yet.",
  ].join("\n\n");
}

function applyLoggedStateToSleepEvent(
  event: ProgramEvent,
  entry: DailySleepCheckIn,
  timeZone: string,
) {
  const baseTitle = event.baseTitle ?? event.title;
  const baseDescription = event.baseDescription ?? event.description;
  const nextStartsAt = resolveNearestClockTime(
    entry.actualInBedTime,
    plannedStartIso(event),
  );
  const nextEndsAt = resolveNearestClockTime(
    entry.actualOutOfBedTime,
    plannedEndIso(event),
  );
  const title = buildLoggedSleepTitle(entry.derivedTitleTags);
  const description = buildLoggedOutcomeDescription(
    baseDescription,
    entry,
    event,
    timeZone,
  );

  return {
    event: {
      ...event,
      title,
      description,
      baseTitle,
      baseDescription,
      startsAt: nextStartsAt.toISOString(),
      endsAt: nextEndsAt.toISOString(),
      plannedStartsAt: plannedStartIso(event),
      plannedEndsAt: plannedEndIso(event),
      dayLabel: format(nextStartsAt, "EEE, MMM d"),
    },
    changed:
      event.title !== title ||
      event.description !== description ||
      event.startsAt !== nextStartsAt.toISOString() ||
      event.endsAt !== nextEndsAt.toISOString() ||
      event.dayLabel !== format(nextStartsAt, "EEE, MMM d"),
  };
}

function applyMissingStateToSleepEvent(event: ProgramEvent) {
  const baseTitle = event.baseTitle ?? event.title;
  const baseDescription = event.baseDescription ?? event.description;
  const description = buildMissingDescription(baseDescription);
  const nextStartsAt = plannedStartIso(event);
  const nextEndsAt = plannedEndIso(event);
  const nextDayLabel = format(new Date(nextStartsAt), "EEE, MMM d");

  return {
    event: {
      ...event,
      title: missingSleepTitle,
      description,
      baseTitle,
      baseDescription,
      startsAt: nextStartsAt,
      endsAt: nextEndsAt,
      plannedStartsAt: nextStartsAt,
      plannedEndsAt: nextEndsAt,
      dayLabel: nextDayLabel,
    },
    changed:
      event.title !== missingSleepTitle ||
      event.description !== description ||
      event.startsAt !== nextStartsAt ||
      event.endsAt !== nextEndsAt ||
      event.dayLabel !== nextDayLabel,
  };
}

function applyPlannedStateToSleepEvent(event: ProgramEvent) {
  const baseTitle = event.baseTitle ?? event.title;
  const baseDescription = event.baseDescription ?? event.description;
  const nextStartsAt = plannedStartIso(event);
  const nextEndsAt = plannedEndIso(event);
  const nextDayLabel = format(new Date(nextStartsAt), "EEE, MMM d");

  return {
    event: {
      ...event,
      title: baseTitle,
      description: baseDescription,
      baseTitle,
      baseDescription,
      startsAt: nextStartsAt,
      endsAt: nextEndsAt,
      plannedStartsAt: nextStartsAt,
      plannedEndsAt: nextEndsAt,
      dayLabel: nextDayLabel,
    },
    changed:
      event.title !== baseTitle ||
      event.description !== baseDescription ||
      event.startsAt !== nextStartsAt ||
      event.endsAt !== nextEndsAt ||
      event.dayLabel !== nextDayLabel,
  };
}

export function reconcileDailyCheckInsForPlan(
  plan: GeneratedPlan,
  dailyCheckIns: DailySleepCheckIn[] | undefined,
  now: Date = new Date(),
) {
  const entriesByNight = new Map(
    (dailyCheckIns ?? []).map((entry) => [entry.nightDate, entry]),
  );
  const checkInEventsByNight = new Map(
    plan.events
      .filter((event) => event.eventRole === "daily_checkin" && event.nightDate)
      .map((event) => [event.nightDate as string, event]),
  );
  const changedEventIds: string[] = [];

  const events = plan.events.map((event) => {
    if (event.eventRole !== "sleep_window" || !event.nightDate) {
      return event;
    }

    const entry = entriesByNight.get(event.nightDate);

    if (entry) {
      const { event: nextEvent, changed } = applyLoggedStateToSleepEvent(
        event,
        entry,
        plan.timezone,
      );

      if (changed) {
        changedEventIds.push(event.id);
      }

      return nextEvent;
    }

    const relatedCheckInEvent = checkInEventsByNight.get(event.nightDate);

    if (relatedCheckInEvent && now.getTime() > new Date(relatedCheckInEvent.endsAt).getTime()) {
      const { event: nextEvent, changed } = applyMissingStateToSleepEvent(event);

      if (changed) {
        changedEventIds.push(event.id);
      }

      return nextEvent;
    }

    const { event: nextEvent, changed } = applyPlannedStateToSleepEvent(event);

    if (changed) {
      changedEventIds.push(event.id);
    }

    return nextEvent;
  });

  return {
    plan:
      changedEventIds.length > 0
        ? {
            ...plan,
            events,
          }
        : plan,
    changedEventIds,
  };
}

export function buildDailyCheckInDraftDefaults(
  session: IntakeSession,
  nightDate: string,
) {
  const plan = session.generatedPlan;

  if (!plan) {
    return null;
  }

  const sleepEvent = getSleepEventForNight(plan, nightDate);
  const checkInEvent = getCheckInEventForNight(plan, nightDate);
  const existingEntry =
    session.dailyCheckIns?.find((entry) => entry.nightDate === nightDate) ?? null;

  if (!sleepEvent || !checkInEvent) {
    return null;
  }

  return {
    nightDate,
    nightLabel: nightDateLabel(nightDate),
    sleepEventId: sleepEvent.id,
    checkInEventId: checkInEvent.id,
    sleepEventStartsAt: plannedStartIso(sleepEvent),
    sleepEventEndsAt: plannedEndIso(sleepEvent),
    plannedBedtime: timeValueFromIso(plannedStartIso(sleepEvent), plan.timezone),
    plannedWakeTime: timeValueFromIso(plannedEndIso(sleepEvent), plan.timezone),
    plannedBedtimeLabel: timeLabel(timeValueFromIso(plannedStartIso(sleepEvent), plan.timezone)),
    plannedWakeTimeLabel: timeLabel(timeValueFromIso(plannedEndIso(sleepEvent), plan.timezone)),
    existingEntry,
  };
}

export function upsertDailyCheckIn(
  session: IntakeSession,
  entry: Omit<DailySleepCheckIn, "derivedTitleTags" | "submittedAt" | "updatedAt">,
) {
  if (!session.generatedPlan) {
    throw new Error("Session is missing a generated plan");
  }

  const normalizedEntry = normalizeDailyCheckInDraft(entry);
  const normalizedEntryForTags = {
    ...normalizedEntry,
    nightDate: entry.nightDate,
    sleepEventId: entry.sleepEventId,
    checkInEventId: entry.checkInEventId,
    morningFunction: normalizedEntry.morningFunction as DailySleepCheckIn["morningFunction"],
  } as Omit<DailySleepCheckIn, "derivedTitleTags" | "submittedAt" | "updatedAt">;
  const sleepEvent = getSleepEventForNight(session.generatedPlan, entry.nightDate);

  if (!sleepEvent) {
    throw new Error("Sleep event not found for this night");
  }

  const now = new Date().toISOString();
  const derivedTitleTags = deriveLoggedSleepTags(
    normalizedEntryForTags,
    sleepEvent,
  );
  const nextEntry: DailySleepCheckIn = {
    nightDate: entry.nightDate,
    sleepEventId: entry.sleepEventId,
    checkInEventId: entry.checkInEventId,
    closenessToPlan: entry.closenessToPlan,
    actualInBedTime: entry.actualInBedTime,
    actualOutOfBedTime: entry.actualOutOfBedTime,
    nightPattern: entry.nightPattern,
    sleepLatencyBucket: normalizedEntry.sleepLatencyBucket,
    awakeDuringNightBucket: normalizedEntry.awakeDuringNightBucket,
    awakeningsBucket: normalizedEntry.awakeningsBucket,
    earlyWakeBucket: normalizedEntry.earlyWakeBucket,
    morningFunction: entry.morningFunction,
    derivedTitleTags,
    submittedAt:
      session.dailyCheckIns?.find((item) => item.nightDate === entry.nightDate)?.submittedAt ??
      now,
    updatedAt: now,
  };
  const existing = session.dailyCheckIns ?? [];
  const withoutCurrentNight = existing.filter((item) => item.nightDate !== entry.nightDate);

  return {
    ...session,
    dailyCheckIns: [...withoutCurrentNight, nextEntry].sort((left, right) =>
      left.nightDate.localeCompare(right.nightDate),
    ),
    updatedAt: now,
  };
}
