import { addMinutes } from "date-fns";

import {
  previewAdaptiveScenario,
  type AdaptivePreviewScenario,
} from "@/lib/adaptive-plan";
import {
  attachDailyCheckInLinksToPlan,
  getCheckInEventForNight,
  getSleepEventForNight,
  reconcileDailyCheckInsForPlan,
  timeValueFromIso,
  upsertDailyCheckIn,
} from "@/lib/daily-checkin";
import { buildGeneratedPlan, buildSleepProfile } from "@/lib/plan-engine";
import type {
  AnswerMap,
  DailySleepCheckIn,
  GeneratedPlan,
  IntakeSession,
  ProgramEvent,
} from "@/lib/types";

export const calendarCopyReferencePath =
  "docs/reference/calendar-event-descriptions.md";

const referenceTimeZone = "Asia/Bangkok";
const referenceNowIso = "2026-03-22T09:00:00.000Z";

const baseAnswers: AnswerMap = {
  primary_problem: "falling_asleep",
  insomnia_duration: "over_1_year",
  daytime_impact: "high",
  desired_wake_time: "09:00",
  usual_bedtime: "01:30",
  weekend_wake_shift: "1_2_hours",
  time_in_bed: "8_9",
  sleep_latency: "30_60",
  wake_after_sleep_onset: "30_60",
  awakenings_count: "2_3",
  early_wake_pattern: "1_2",
  schedule_consistency: "swings",
  bed_use_pattern: "phone_or_tv",
  awake_response: "stay_and_try",
  caffeine_amount: "moderate",
  caffeine_timing: "late_afternoon",
  alcohol_timing: "some_evenings",
  dinner_timing: "under_2_hours",
  screen_habit: "in_bed",
  work_after_dinner: "often",
  naps: "sometimes",
  exercise_timing: "afternoon",
  stress_level: "busy",
  sleep_thoughts: "pressure",
  relaxation_experience: "inconsistent",
  sleep_medication: "none",
  sleep_environment: "noise",
  impact_areas: ["work"],
  red_flags: ["none"],
  motivation: "steady",
};

const baselineCoverageScenarios: Array<{
  label: string;
  overrides: Partial<AnswerMap>;
}> = [
  {
    label: "Core coverage profile",
    overrides: {},
  },
  {
    label: "High caffeine branch",
    overrides: {
      caffeine_amount: "high",
    },
  },
  {
    label: "Close-to-bed alcohol branch",
    overrides: {
      alcohol_timing: "close_to_bed",
    },
  },
  {
    label: "No late work branch",
    overrides: {
      work_after_dinner: "sometimes",
    },
  },
  {
    label: "Clock-watching branch",
    overrides: {
      sleep_thoughts: "clock_watching",
    },
  },
  {
    label: "Catastrophic-thoughts branch",
    overrides: {
      sleep_thoughts: "catastrophic",
    },
  },
  {
    label: "Phone-rescue branch",
    overrides: {
      awake_response: "phone",
    },
  },
  {
    label: "Evening-exercise branch",
    overrides: {
      exercise_timing: "evening",
    },
  },
  {
    label: "Frequent short naps branch",
    overrides: {
      naps: "frequent_short",
    },
  },
  {
    label: "Frequent long naps branch",
    overrides: {
      naps: "frequent_long",
    },
  },
];

const adaptiveScenarioLabels: Record<AdaptivePreviewScenario, string> = {
  single_bad_night: "Single bad night (no future-plan change)",
  double_late_start: "Repeated late starts",
  double_sleep_onset: "Repeated slow sleep onset",
  double_fragmented: "Repeated fragmented nights",
  double_early_wake: "Repeated early wakes",
  double_fatigue: "Repeated heavy mornings",
  double_late_start_sleep_onset: "Late-start plus slow-sleep pattern",
  double_fragmented_fatigue: "Fragmented-sleep plus fatigue pattern",
  double_early_wake_fatigue: "Early-wake plus fatigue pattern",
};

const baselineEventOrder = [
  "Wake-up anchor",
  "Morning light",
  "Meal boundary",
  "Caffeine cutoff",
  "Digital sunset",
  "Wind-down practice",
  "Protected sleep window",
  "In-bed practice",
  "Morning sleep log",
  "Daytime movement",
  "Nap boundary",
  "Coach note",
];

type BaselineVariant = {
  title: string;
  description: string;
  scenarioLabel: string;
  eventType: ProgramEvent["eventType"];
  weekNumber: number;
};

type LoggedExample = {
  label: string;
  resultingTitle: string;
  description: string;
};

function plannedStartIso(event: ProgramEvent) {
  return event.plannedStartsAt ?? event.startsAt;
}

function plannedEndIso(event: ProgramEvent) {
  return event.plannedEndsAt ?? event.endsAt;
}

function dedentAndTrim(value: string) {
  return value.replace(/\s+\n/g, "\n").trim();
}

function withFrozenNow<T>(iso: string, run: () => T) {
  const RealDate = Date;
  const fixedDate = new RealDate(iso);

  class FrozenDate extends RealDate {
    constructor(...args: ConstructorParameters<DateConstructor>) {
      if (!args.length) {
        super(fixedDate.getTime());
        return;
      }

      super(...args);
    }

    static now() {
      return fixedDate.getTime();
    }
  }

  Object.setPrototypeOf(FrozenDate, RealDate);

  try {
    globalThis.Date = FrozenDate as DateConstructor;
    return run();
  } finally {
    globalThis.Date = RealDate;
  }
}

function buildReferencePlan(overrides: Partial<AnswerMap> = {}) {
  const answers: AnswerMap = { ...baseAnswers };

  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      answers[key] = value;
    }
  }

  return withFrozenNow(referenceNowIso, () => {
    const profile = buildSleepProfile(
      answers,
      referenceTimeZone,
    );

    return buildGeneratedPlan(profile);
  });
}

function baselineSortValue(title: string) {
  const fixedIndex = baselineEventOrder.indexOf(title);

  if (fixedIndex >= 0) {
    return fixedIndex;
  }

  if (title.startsWith("Week ")) {
    return 100;
  }

  return 999;
}

function sanitizeCheckInLink(description: string) {
  return description.replace(
    /https?:\/\/\S+/g,
    "https://restshore.example/check-in/[sessionId]/[nightDate]?token=[token]",
  );
}

function baselineVariants() {
  const variants = new Map<string, BaselineVariant>();

  for (const scenario of baselineCoverageScenarios) {
    const plan = buildReferencePlan(scenario.overrides);

    for (const event of plan.events) {
      const title = event.baseTitle ?? event.title;
      const description = dedentAndTrim(event.baseDescription ?? event.description);
      const key = `${title}@@${description}`;

      if (!variants.has(key)) {
        variants.set(key, {
          title,
          description,
          scenarioLabel: scenario.label,
          eventType: event.eventType,
          weekNumber: event.weekNumber,
        });
      }
    }
  }

  return [...variants.values()].sort((left, right) => {
    const leftOrder = baselineSortValue(left.title);
    const rightOrder = baselineSortValue(right.title);

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    if (left.title !== right.title) {
      return left.title.localeCompare(right.title);
    }

    if (left.weekNumber !== right.weekNumber) {
      return left.weekNumber - right.weekNumber;
    }

    return left.scenarioLabel.localeCompare(right.scenarioLabel);
  });
}

function groupedBaselineVariants() {
  const grouped = new Map<string, BaselineVariant[]>();

  for (const variant of baselineVariants()) {
    const current = grouped.get(variant.title) ?? [];
    current.push(variant);
    grouped.set(variant.title, current);
  }

  return [...grouped.entries()].sort((left, right) => {
    const leftOrder = baselineSortValue(left[0]);
    const rightOrder = baselineSortValue(right[0]);

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left[0].localeCompare(right[0]);
  });
}

function buildSession(plan: GeneratedPlan): IntakeSession {
  return {
    id: "reference-session",
    resumeToken: "reference-resume-token",
    status: "completed",
    currentStepId: "report",
    answers: { ...baseAnswers },
    timezone: plan.timezone,
    startedAt: "2026-03-22T00:00:00.000Z",
    updatedAt: "2026-03-22T00:00:00.000Z",
    reportDeliveryStatus: "preview",
    calendarSyncStatus: "preview",
    generatedPlan: plan,
  };
}

function buildLoggedEntry(
  plan: GeneratedPlan,
  nightDate: string,
  overrides: Partial<DailySleepCheckIn>,
): Omit<DailySleepCheckIn, "derivedTitleTags" | "submittedAt" | "updatedAt"> {
  const sleepEvent = getSleepEventForNight(plan, nightDate);
  const checkInEvent = getCheckInEventForNight(plan, nightDate);

  if (!sleepEvent || !checkInEvent) {
    throw new Error(`Reference night ${nightDate} is missing a sleep or check-in event.`);
  }

  return {
    nightDate,
    sleepEventId: sleepEvent.id,
    checkInEventId: checkInEvent.id,
    closenessToPlan: "close_to_plan",
    actualInBedTime: timeValueFromIso(plannedStartIso(sleepEvent), plan.timezone),
    actualOutOfBedTime: timeValueFromIso(plannedEndIso(sleepEvent), plan.timezone),
    nightPattern: "fell_asleep_quickly",
    morningFunction: "good_enough",
    ...overrides,
  };
}

function firstReferenceNight(plan: GeneratedPlan) {
  const sleepEvent = plan.events.find(
    (event) => event.eventRole === "sleep_window" && event.nightDate,
  );

  if (!sleepEvent?.nightDate) {
    throw new Error("Reference plan is missing a sleep-window event.");
  }

  return sleepEvent.nightDate;
}

function buildDailyCheckInExamples() {
  const plan = buildReferencePlan();
  const nightDate = firstReferenceNight(plan);
  const linkedPlan = attachDailyCheckInLinksToPlan(
    plan,
    "reference-session",
    "reference-resume-token",
  ).plan;
  const linkedCheckIn = getCheckInEventForNight(linkedPlan, nightDate);

  if (!linkedCheckIn) {
    throw new Error("Reference plan is missing a linked daily check-in event.");
  }

  const missingPlan = reconcileDailyCheckInsForPlan(
    linkedPlan,
    [],
    addMinutes(new Date(linkedCheckIn.endsAt), 60),
  ).plan;
  const missingSleep = getSleepEventForNight(missingPlan, nightDate);

  if (!missingSleep) {
    throw new Error("Missing-state reconciliation did not return the sleep event.");
  }

  const exampleEntries: Array<{
    label: string;
    overrides: Partial<DailySleepCheckIn>;
  }> = [
    {
      label: "Logged close to plan",
      overrides: {},
    },
    {
      label: "Logged late start",
      overrides: {
        closenessToPlan: "bedtime_later",
        actualInBedTime: "03:15",
      },
    },
    {
      label: "Logged late start plus early wake",
      overrides: {
        closenessToPlan: "both_drifted",
        actualInBedTime: "03:15",
        actualOutOfBedTime: "07:40",
        nightPattern: "early_wake",
        earlyWakeBucket: "60_90",
      },
    },
    {
      label: "Logged repeated awakenings",
      overrides: {
        nightPattern: "several_wakeups",
        awakeningsBucket: "3_4",
      },
    },
    {
      label: "Logged long awake time",
      overrides: {
        nightPattern: "several_wakeups",
        awakeDuringNightBucket: "40_60",
        awakeningsBucket: "2",
      },
    },
  ];

  const loggedExamples: LoggedExample[] = exampleEntries.map((example) => {
    const baseSession = buildSession(linkedPlan);
    const submittedSession = upsertDailyCheckIn(
      baseSession,
      buildLoggedEntry(linkedPlan, nightDate, example.overrides),
    );
    const reconciledPlan = reconcileDailyCheckInsForPlan(
      submittedSession.generatedPlan as GeneratedPlan,
      submittedSession.dailyCheckIns,
      addMinutes(new Date(linkedCheckIn.endsAt), 60),
    ).plan;
    const loggedSleep = getSleepEventForNight(reconciledPlan, nightDate);

    if (!loggedSleep) {
      throw new Error(`Logged-state example "${example.label}" is missing the sleep event.`);
    }

    return {
      label: example.label,
      resultingTitle: loggedSleep.title,
      description: dedentAndTrim(loggedSleep.description),
    };
  });

  return {
    baseCheckInDescription: dedentAndTrim(
      getCheckInEventForNight(plan, nightDate)?.description ?? "",
    ),
    linkedCheckInDescription: dedentAndTrim(
      sanitizeCheckInLink(linkedCheckIn.description),
    ),
    missingSleepTitle: missingSleep.title,
    missingSleepDescription: dedentAndTrim(missingSleep.description),
    loggedExamples,
  };
}

function buildAdaptiveScenarioSection(scenario: AdaptivePreviewScenario) {
  const plan = buildReferencePlan();
  const preview = previewAdaptiveScenario(plan, scenario);

  return {
    label: adaptiveScenarioLabels[scenario],
    shouldAdjustFuturePlan: preview.shouldAdjustFuturePlan,
    simulatedLogs: preview.simulatedLogs.map((item) => ({
      nightLabel: item.nightLabel,
      summary: item.summary,
      responses: item.responses,
    })),
    triggeredRules: preview.triggeredRules,
    changedEvents: preview.changedEvents.map((event) => ({
      titleBefore: event.titleBefore,
      titleAfter: event.titleAfter,
      descriptionAfter: dedentAndTrim(event.descriptionAfter),
    })),
  };
}

function buildAdaptiveSections() {
  const scenarios: AdaptivePreviewScenario[] = [
    "single_bad_night",
    "double_late_start",
    "double_sleep_onset",
    "double_fragmented",
    "double_early_wake",
    "double_fatigue",
    "double_late_start_sleep_onset",
    "double_fragmented_fatigue",
    "double_early_wake_fatigue",
  ];

  return scenarios.map(buildAdaptiveScenarioSection);
}

function codeFence(value: string) {
  return ["```text", value, "```"].join("\n");
}

function listLine(label: string, value: string) {
  return `- ${label}: ${value}`;
}

export function buildCalendarCopyReference() {
  const baseline = groupedBaselineVariants();
  const dailyCheckInExamples = buildDailyCheckInExamples();
  const adaptiveSections = buildAdaptiveSections();
  const baselineIndex = baseline.map(([title]) => `- ${title}`).join("\n");

  const sections: string[] = [
    "# Calendar Event Description Reference",
    "",
    "This file is generated from the live calendar-copy builders in:",
    "- `src/lib/plan-engine.ts`",
    "- `src/lib/daily-checkin.ts`",
    "- `src/lib/adaptive-plan.ts`",
    "",
    `Refresh it with \`npm run calendar-copy:export\`. Tests will fail if this file drifts from the current generators.`,
    "",
    "## What this file covers",
    "- Baseline description variants that the 6-week plan can generate.",
    "- Morning sleep log descriptions, including the linked version used in the calendar.",
    "- Sleep-event rewrite states after a nightly log or after a missed log.",
    "- Adaptive copy that can be appended to future events after repeated patterns in daily check-ins.",
    "",
    "## Baseline event families",
    baselineIndex,
    "",
    "## Baseline generated descriptions",
  ];

  for (const [title, variants] of baseline) {
    sections.push("");
    sections.push(`### ${title}`);

    variants.forEach((variant, index) => {
      sections.push("");
      sections.push(
        listLine(
          `Variant ${index + 1}`,
          `${variant.scenarioLabel} | week ${variant.weekNumber} | ${variant.eventType}`,
        ),
      );
      sections.push(codeFence(variant.description));
    });
  }

  sections.push("");
  sections.push("## Morning sleep log and post-log sleep-event states");
  sections.push("");
  sections.push("### Morning sleep log - base event description");
  sections.push(codeFence(dailyCheckInExamples.baseCheckInDescription));
  sections.push("");
  sections.push("### Morning sleep log - linked calendar description");
  sections.push(codeFence(dailyCheckInExamples.linkedCheckInDescription));
  sections.push("");
  sections.push("### Sleep event after no log was entered");
  sections.push(listLine("Resulting title", dailyCheckInExamples.missingSleepTitle));
  sections.push(codeFence(dailyCheckInExamples.missingSleepDescription));

  for (const example of dailyCheckInExamples.loggedExamples) {
    sections.push("");
    sections.push(`### ${example.label}`);
    sections.push(listLine("Resulting title", example.resultingTitle));
    sections.push(codeFence(example.description));
  }

  sections.push("");
  sections.push("## Adaptive future-plan overlays after repeated patterns");
  sections.push(
    "These sections show what gets appended to future event descriptions after repeated patterns in the last few daily logs. A single rough night should not change future events.",
  );

  for (const adaptive of adaptiveSections) {
    sections.push("");
    sections.push(`### ${adaptive.label}`);
    sections.push(
      listLine(
        "Future-plan change",
        adaptive.shouldAdjustFuturePlan ? "Yes" : "No",
      ),
    );
    sections.push("");
    sections.push("Simulated logs:");
    adaptive.simulatedLogs.forEach((log) => {
      sections.push(listLine(log.nightLabel, log.summary));
      log.responses.forEach((response) => {
        sections.push(`  - ${response.label}: ${response.value}`);
      });
    });

    if (adaptive.triggeredRules.length) {
      sections.push("");
      sections.push("Triggered rules:");
      adaptive.triggeredRules.forEach((rule) => {
        sections.push(listLine(rule.title, rule.detail));
        sections.push(`  - Evidence: ${rule.evidence}`);
        sections.push(`  - Affects: ${rule.affects.join(", ")}`);
      });
    }

    if (adaptive.changedEvents.length) {
      sections.push("");
      sections.push("Representative changed future-event descriptions:");
      adaptive.changedEvents.forEach((event, index) => {
        sections.push("");
        sections.push(
          listLine(
            `Changed event ${index + 1}`,
            `${event.titleBefore} -> ${event.titleAfter}`,
          ),
        );
        sections.push(codeFence(event.descriptionAfter));
      });
    }
  }

  sections.push("");
  sections.push("## Notes");
  sections.push(
    "- Logged sleep descriptions include dynamic user-entered values such as actual in-bed and out-of-bed times. The examples above are representative review fixtures.",
  );
  sections.push(
    "- Adaptive overlays are additive: combined repeated patterns can append more than one `Adaptive focus` block to future events.",
  );

  return `${sections.join("\n")}\n`;
}
