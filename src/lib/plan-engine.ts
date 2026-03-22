import { addDays, addMinutes, format, set } from "date-fns";

import { brandName } from "@/lib/brand";
import { deriveInsightTags } from "@/lib/questionnaire";
import type {
  AnswerMap,
  GeneratedPlan,
  ProgramEvent,
  SleepProfile,
  WeekSummary,
} from "@/lib/types";

function pickPrimaryAnswer(value: AnswerMap[string], fallback: string) {
  if (Array.isArray(value)) {
    const picked = value.find((item) => item !== "none");
    return picked ?? fallback;
  }

  return typeof value === "string" && value ? value : fallback;
}

function parseTimeToParts(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return {
    hours: Number.isFinite(hours) ? hours : 22,
    minutes: Number.isFinite(minutes) ? minutes : 30,
  };
}

function timeLabel(value: string) {
  const { hours, minutes } = parseTimeToParts(value);
  const date = set(new Date(), {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0,
  });

  return format(date, "h:mm a");
}

function minutesFromCategory(value: string, fallback: number) {
  switch (value) {
    case "under_15":
      return 10;
    case "15_30":
      return 22;
    case "30_60":
      return 45;
    case "over_60":
      return 75;
    default:
      return fallback;
  }
}

function hoursFromTimeInBed(value: string) {
  switch (value) {
    case "under_6":
      return 5.75;
    case "6_7":
      return 6.5;
    case "7_8":
      return 7.5;
    case "8_9":
      return 8.5;
    case "over_9":
      return 9.25;
    default:
      return 7.5;
  }
}

function subtractMinutes(time: string, minutes: number) {
  const parts = parseTimeToParts(time);
  const date = set(new Date(), {
    hours: parts.hours,
    minutes: parts.minutes,
    seconds: 0,
    milliseconds: 0,
  });
  return format(addMinutes(date, -minutes), "HH:mm");
}

function addMinutesToTime(time: string, minutes: number) {
  const parts = parseTimeToParts(time);
  const date = set(new Date(), {
    hours: parts.hours,
    minutes: parts.minutes,
    seconds: 0,
    milliseconds: 0,
  });
  return format(addMinutes(date, minutes), "HH:mm");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function weekNumberForOffset(dayOffset: number) {
  return Math.floor(dayOffset / 7) + 1;
}

function dateKeyInTimeZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

const generatedCopyFixes = [
  ["â° ", ""],
  ["â˜€ï¸ ", ""],
  ["â˜• ", ""],
  ["ðŸ“µ ", ""],
  ["ðŸŒ™ ", ""],
  ["ðŸ›ï¸ ", ""],
  ["ðŸƒ ", ""],
  ["ðŸ˜´ ", ""],
  ["ðŸ¥£ ", ""],
  ["ðŸ—“ï¸ ", ""],
  ["ðŸ§  ", ""],
  ["ðŸŒ… ", ""],
  ["ðŸŽ¯ ", ""],
  ["âœ… ", ""],
  ["ðŸ“ ", ""],
  ["ðŸ‘€ ", ""],
  ["ðŸ§­ ", ""],
  ["ðŸ—’ï¸ ", ""],
] as const;

function cleanGeneratedCopy(value: string) {
  let normalized = value;

  for (const [from, to] of generatedCopyFixes) {
    normalized = normalized.replaceAll(from, to);
  }

  normalized = normalized.replace(/[^\x00-\x7F]+/g, "");
  normalized = normalized.replace(/ +\n/g, "\n");
  normalized = normalized.replace(/\n +/g, "\n");

  return normalized.trimStart();
}

const eventPresentation: Record<
  ProgramEvent["eventType"],
  { emoji: string; colorId: string }
> = {
  wake: { emoji: "⏰", colorId: "10" },
  light: { emoji: "☀️", colorId: "5" },
  caffeine: { emoji: "☕", colorId: "6" },
  screen: { emoji: "📵", colorId: "11" },
  winddown: { emoji: "🌙", colorId: "2" },
  bed: { emoji: "🛏️", colorId: "1" },
  exercise: { emoji: "🏃", colorId: "4" },
  nap: { emoji: "😴", colorId: "8" },
  meal: { emoji: "🥣", colorId: "7" },
  review: { emoji: "🗓️", colorId: "3" },
  mindset: { emoji: "🧠", colorId: "9" },
  checkin: { emoji: "🌅", colorId: "2" },
};

function descriptionWithWhy(action: string, why: string, extra?: string) {
  return [
    `🎯 What to do\n${action}`,
    `🧠 Why this works\n${why}`,
    extra ? `📝 Coach note\n${extra}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function descriptionWithPractice(
  practiceName: string,
  action: string,
  why: string,
  extra?: string,
) {
  return [
    `🎯 Tonight's practice\n${practiceName}`,
    `✅ What to do\n${action}`,
    `🧠 Why this works\n${why}`,
    extra ? `📝 Coach note\n${extra}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function awarenessDescription(
  focus: string,
  why: string,
  extra?: string,
) {
  return [
    "👀 Awareness only\nNo task to complete right now. Just notice this and keep following the main plan.",
    `🧭 What to notice\n${focus}`,
    `🧠 Why this matters\n${why}`,
    extra ? `📝 If helpful\n${extra}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function optionalReviewDescription(
  action: string,
  why: string,
  extra?: string,
) {
  return [
    "🗒️ Optional review\nIf you have 3 to 5 minutes, use this to notice patterns. If not, just keep the plan steady.",
    `✅ What to review\n${action}`,
    `🧠 Why this matters\n${why}`,
    extra ? `📝 Coach note\n${extra}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildEvent(
  day: Date,
  weekNumber: number,
  type: ProgramEvent["eventType"],
  title: string,
  description: string,
  startTime: string,
  durationMinutes: number,
  idSuffix?: string,
  metadata?: Partial<Pick<ProgramEvent, "eventRole" | "nightDate" | "actionUrl">>,
): ProgramEvent {
  const { hours, minutes } = parseTimeToParts(startTime);
  const startsAt = set(day, {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0,
  });
  const endsAt = addMinutes(startsAt, durationMinutes);
  const presentation = eventPresentation[type];

  return {
    id: `${format(day, "yyyy-MM-dd")}-${type}${idSuffix ? `-${idSuffix}` : ""}`,
    title: cleanGeneratedCopy(`${presentation.emoji} ${title}`),
    baseTitle: cleanGeneratedCopy(`${presentation.emoji} ${title}`),
    description: cleanGeneratedCopy(description),
    baseDescription: cleanGeneratedCopy(description),
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    dayLabel: format(day, "EEE, MMM d"),
    weekNumber,
    calendarColorId: presentation.colorId,
    eventType: type,
    ...metadata,
  };
}

function buildAbsoluteEvent(
  startsAt: Date,
  weekNumber: number,
  type: ProgramEvent["eventType"],
  title: string,
  description: string,
  durationMinutes: number,
  id: string,
  metadata?: Partial<Pick<ProgramEvent, "eventRole" | "nightDate" | "actionUrl">>,
): ProgramEvent {
  const presentation = eventPresentation[type];
  const endsAt = addMinutes(startsAt, durationMinutes);

  return {
    id,
    title: cleanGeneratedCopy(`${presentation.emoji} ${title}`),
    baseTitle: cleanGeneratedCopy(`${presentation.emoji} ${title}`),
    description: cleanGeneratedCopy(description),
    baseDescription: cleanGeneratedCopy(description),
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    dayLabel: format(startsAt, "EEE, MMM d"),
    weekNumber,
    calendarColorId: presentation.colorId,
    eventType: type,
    ...metadata,
  };
}

function deriveSleepWindowHours(profile: SleepProfile) {
  const timeInBedHours = hoursFromTimeInBed(profile.timeInBed);
  const latencyMinutes = minutesFromCategory(profile.sleepLatency, 30);
  const wakeMinutes = minutesFromCategory(profile.wakeAfterSleepOnset, 20);
  const penaltyHours = (latencyMinutes + wakeMinutes) / 120;

  let target = timeInBedHours - penaltyHours;

  if (profile.daytimeImpact === "severe") {
    target -= 0.25;
  }

  if (profile.motivation === "cautious") {
    target += 0.25;
  }

  return clamp(Math.round(target * 4) / 4, 6, 8.5);
}

function deriveCaffeineCutoff(bedtimeTarget: string, amount: string) {
  const hoursBeforeBed = amount === "high" ? 11 : 10;
  return subtractMinutes(bedtimeTarget, hoursBeforeBed * 60);
}

function deriveMealCutoff(bedtimeTarget: string) {
  return subtractMinutes(bedtimeTarget, 180);
}

function buildWeekSummaries(profile: SleepProfile, plan: Omit<GeneratedPlan, "weekSummaries" | "events">): WeekSummary[] {
  return [
    {
      weekNumber: 1,
      title: "Stabilize the runway",
      focus: "Protect the wake anchor, reduce drift, and stop adding stimulation to the last hour of the day.",
      goals: [
        `Wake at ${plan.wakeTime} every day.`,
        `Treat ${plan.screenCutoff} as the point where the day starts getting smaller.`,
        "Notice patterns before trying to optimize everything at once.",
      ],
    },
    {
      weekNumber: 2,
      title: "Rebuild bed-sleep association",
      focus: "Use stimulus control more clearly so the bed becomes less associated with effort and wakefulness.",
      goals: [
        "If you are clearly awake for a while, use a short quiet reset outside bed.",
        "Keep the bed for sleep and intimacy, not planning, work, or doom-scrolling.",
        "Lower the pressure to force sleep on command.",
      ],
    },
    {
      weekNumber: 3,
      title: "Sharpen sleep pressure",
      focus: "Protect daytime sleep drive by tightening naps, guarding weekends, and keeping the rhythm repetitive.",
      goals: [
        plan.napGuidance,
        plan.weekendGuardrail,
        "Let consistency do the heavy lifting rather than chasing an earlier bedtime.",
      ],
    },
    {
      weekNumber: 4,
      title: "Reduce evening activation",
      focus: "Make the evening feel less like a second workday and more like a descent into sleep.",
      goals: [
        `Use the wind-down beginning at ${plan.windDownStart}.`,
        "Separate admin, decision-making, and hard conversations from the pre-bed hour.",
        "Rotate calming practices instead of repeating one technique that goes stale.",
      ],
    },
    {
      weekNumber: 5,
      title: "Handle setbacks without panic",
      focus: "Treat rough nights as data and keep the next morning stable.",
      goals: [
        "After a bad night, do not compensate with sleeping in.",
        "Use the rescue prompts in the bedtime and wind-down events instead of improvising under stress.",
        "Keep the next day boringly consistent.",
      ],
    },
    {
      weekNumber: 6,
      title: "Consolidate and prepare for maintenance",
      focus: "Decide which anchors are non-negotiable, which are flexible, and what should trigger medical escalation.",
      goals: [
        "Choose the 3 habits you would keep even during travel or busy weeks.",
        "Review red flags and bring the report to a clinician if they still fit.",
        "Finish with a calmer, clearer repeatable system rather than a one-night fix.",
      ],
    },
  ];
}

const weeklyCoachNotes = {
  1: [
    "This week is about collecting clean signals, not judging every night.",
    "If the plan feels boring, that is usually a good sign. Boring routines often work better than heroic resets.",
  ],
  2: [
    "Watch for the moment when trying harder starts making sleep less likely.",
    "The goal is not to force sleep. The goal is to stop rehearsing wakefulness in bed.",
  ],
  3: [
    "This is where weekends, naps, and late caffeine usually try to negotiate.",
    "Protecting sleep pressure during the day often matters more than finding a perfect bedtime ritual.",
  ],
  4: [
    "Evening activation can come from thoughts, messaging, unfinished tasks, or emotional carryover, not just screens.",
    "Aim to make the last hour feel smaller, dimmer, and less urgent than the rest of the day.",
  ],
  5: [
    "Setbacks are part of treatment, not evidence that treatment is failing.",
    "The morning after a rough night is where trust in the plan usually gets tested.",
  ],
  6: [
    "This week is about deciding what is sustainable enough to keep.",
    "A realistic maintenance plan beats an extreme plan you cannot repeat.",
  ],
} as const;

const rescuePrompts = [
  "If you are clearly awake and getting more frustrated, take a short quiet reset outside the bed: dim light, low interest, no phone rabbit holes.",
  "Try a 3-minute breath ladder: inhale 4, exhale 6, then return to natural breathing. The goal is softer effort, not instant sleep.",
  "If the mind is spiraling, write one sentence: 'I can still get through tomorrow even if tonight is imperfect.' Then stop negotiating with the night.",
  "Choose one boring anchor if sleep is not happening: sit somewhere dim, read two pages of something neutral, and return only when sleepiness rises again.",
];

const weekendPrompts = [
  "Weekends do not need to be joyless, but they do need a wake-time ceiling if you want Monday night to cooperate.",
  "Protect tomorrow morning from turning into revenge sleep. Sleeping in is tempting, but it usually steals from the next night.",
  "Keep tonight socially flexible if you want, but defend the wake anchor in the morning as much as possible.",
];

function weekFocusExtra(weekNumber: number) {
  return weeklyCoachNotes[weekNumber as keyof typeof weeklyCoachNotes][
    weekNumber % 2
  ];
}

const wakePrompts = [
  "Get up on time, open the curtains, and put both feet on the floor before your brain starts bargaining.",
  "Stand up, hydrate, and resist checking sleep data before you begin the day.",
  "Wake at the target time even if last night felt messy. The morning still teaches the clock.",
  "Treat wake time as the keystone habit: boring, firm, and surprisingly powerful.",
];

const lightPrompts = [
  "Get outdoor light or bright daylight as soon as practical after waking.",
  "Step outside for 10 to 20 minutes if you can, even if the morning feels rough.",
  "Use light to tell your brain the day has started. This matters more than people think.",
  "Pair light with a short walk if available. Motion plus daylight is a strong body-clock cue.",
];

const windDownPractices = [
  {
    name: "Diaphragmatic breathing",
    action:
      "Breathe into the belly for about 3 minutes, with a slightly longer exhale than inhale. Keep the room dim and your pace slow.",
  },
  {
    name: "Body scan",
    action:
      "Do a slow body scan from jaw to toes. You are not trying to sleep yet, only reducing extra tension.",
  },
  {
    name: "Constructive worry",
    action:
      "Write tomorrow's tasks, worries, and one next step for each on paper. Let the page hold the problem-solving, not the bed.",
  },
  {
    name: "Guided imagery",
    action:
      "Picture a calm, familiar place in gentle detail for a few minutes. Stay with sensory details rather than planning or analysis.",
  },
  {
    name: "Progressive muscle relaxation",
    action:
      "Tense and release one muscle group at a time from shoulders down to feet. Keep the effort mild, not intense.",
  },
  {
    name: "No-performance evening",
    action:
      "Choose one low-stakes activity such as paper reading, folding laundry, or a warm shower. Tonight is about deceleration, not productivity.",
  },
];

const bedtimePractices = [
  {
    name: "Soft belly breathing",
    action:
      "Once in bed, let the exhale run a little longer than the inhale for 10 breaths. No forcing. No checking whether it is working.",
  },
  {
    name: "Imagery drift",
    action:
      "Let your mind rest on neutral, low-stakes images or scenes. The goal is less analysis and more mental drifting.",
  },
  {
    name: "Paradoxical intention",
    action:
      "Instead of trying to knock yourself out, give yourself permission just to rest quietly. Lowering effort often lowers arousal.",
  },
  {
    name: "Progressive release",
    action:
      "Unclench the jaw, drop the shoulders, loosen the hands, and let the bed carry some of the work.",
  },
  {
    name: "Stimulus-control reset reminder",
    action:
      "If you feel clearly awake for a while, take a brief quiet reset outside the bed and return only when sleepiness builds again.",
  },
  {
    name: "Release the scoreboard",
    action:
      "Do not calculate how many hours are left. Tonight's job is simply to lie down at the planned time and let the body learn the pattern.",
  },
];

const screenPrompts = [
  "Phone down, notifications quiet, and no more open loops tonight.",
  "Treat this as the line where the day stops demanding responses from you.",
  "Swap bright, fast, and emotional inputs for slower ones.",
  "If you keep a screen, make it passive, dim, and not in bed.",
];

const mealPrompts = [
  "Try to make this the last full meal so digestion is not still busy at bedtime.",
  "If hunger shows up later, keep it light and boring rather than turning tonight into a second dinner.",
  "A calmer stomach often helps with calmer second-half sleep.",
];

const reviewPrompts = [
  "Review what felt easiest to follow, what felt unrealistic, and where bedtime still turns into effort.",
  "Notice whether weekends, late work, or caffeine are still punching holes in the plan.",
  "Choose one friction point to simplify next week instead of adding five new rules.",
];

const STANDARD_TITLES = {
  wake: "Wake-up anchor",
  light: "Morning light",
  meal: "Meal boundary",
  caffeine: "Caffeine cutoff",
  screen: "Digital sunset",
  winddown: "Wind-down practice",
  sleepWindow: "Protected sleep window",
  bed: "In-bed practice",
  exercise: "Daytime movement",
  nap: "Nap boundary",
  mindset: "Coach note",
  checkin: "Morning sleep log",
} as const;

function bedtimeExtraByProfile(profile: SleepProfile) {
  if (profile.sleepThoughts === "clock_watching") {
    return "If you notice clock-checking, turn the clock away or cover it. Time-tracking tends to raise the stakes.";
  }

  if (profile.sleepThoughts === "catastrophic") {
    return "If your mind predicts disaster, answer it with one line: a rough night is hard, but not dangerous.";
  }

  if (profile.awakeResponse === "phone" || profile.awakeResponse === "tv_or_media") {
    return "If sleep is not happening, do not recruit your phone to rescue the moment. Choose a dim, low-interest reset instead.";
  }

  return "If sleep is not happening, respond with less effort and less stimulation, not more.";
}

function buildSleepWindowLabel(hours: number) {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (!minutes) {
    return `${wholeHours} hours`;
  }

  return `${wholeHours}h ${minutes}m`;
}

export function buildSleepProfile(
  answers: AnswerMap,
  timezone: string,
): SleepProfile {
  const redFlags = Array.isArray(answers.red_flags) ? answers.red_flags : [];
  const impactAreas = Array.isArray(answers.impact_areas) ? answers.impact_areas : [];
  const insightTags = deriveInsightTags(answers);
  const cautionFlags = redFlags.filter((item) => item !== "none");

  return {
    primaryProblem: String(answers.primary_problem ?? "falling_asleep"),
    insomniaDuration: String(answers.insomnia_duration ?? "3_12_months"),
    daytimeImpact: String(answers.daytime_impact ?? "moderate"),
    desiredWakeTime: String(answers.desired_wake_time ?? "07:00"),
    usualBedtime: String(answers.usual_bedtime ?? "23:00"),
    weekendWakeShift: String(answers.weekend_wake_shift ?? "1_2_hours"),
    timeInBed: String(answers.time_in_bed ?? "8_9"),
    sleepLatency: String(answers.sleep_latency ?? "30_60"),
    wakeAfterSleepOnset: String(answers.wake_after_sleep_onset ?? "30_60"),
    awakeningsCount: String(answers.awakenings_count ?? "2_3"),
    earlyWakePattern: String(answers.early_wake_pattern ?? "1_2"),
    nightWakings: String(answers.awakenings_count ?? "2_3"),
    scheduleConsistency: String(answers.schedule_consistency ?? "swings"),
    bedUsePattern: pickPrimaryAnswer(answers.bed_use_pattern, "none"),
    awakeResponse: String(answers.awake_response ?? "stay_and_try"),
    caffeineAmount: String(answers.caffeine_amount ?? "moderate"),
    caffeineTiming: String(answers.caffeine_timing ?? "late_afternoon"),
    alcoholTiming: String(answers.alcohol_timing ?? "some_evenings"),
    dinnerTiming: String(answers.dinner_timing ?? "2_3_hours"),
    screenHabit: String(answers.screen_habit ?? "light_scroll"),
    workAfterDinner: String(answers.work_after_dinner ?? "sometimes"),
    naps: String(answers.naps ?? "sometimes"),
    exerciseTiming: String(answers.exercise_timing ?? "afternoon"),
    stressLevel: String(answers.stress_level ?? "busy"),
    sleepThoughts: pickPrimaryAnswer(answers.sleep_thoughts, "none"),
    relaxationExperience: String(answers.relaxation_experience ?? "inconsistent"),
    sleepMedication: String(answers.sleep_medication ?? "none"),
    sleepEnvironment: pickPrimaryAnswer(answers.sleep_environment, "none"),
    impactAreas,
    motivation: String(answers.motivation ?? "steady"),
    redFlags,
    timezone,
    insightTags,
    cautionFlags,
  };
}

export function buildGeneratedPlan(profile: SleepProfile): GeneratedPlan {
  const sleepWindowHours = deriveSleepWindowHours(profile);
  const bedtimeTarget = subtractMinutes(
    profile.desiredWakeTime,
    Math.round(sleepWindowHours * 60),
  );
  const windDownMinutes =
    profile.stressLevel === "very_racing" || profile.stressLevel === "racing"
      ? 60
      : 45;
  const windDownStart = subtractMinutes(bedtimeTarget, windDownMinutes);
  const screenCutoff =
    profile.screenHabit === "work_late" || profile.workAfterDinner === "almost_always"
      ? subtractMinutes(windDownStart, 15)
      : windDownStart;
  const caffeineCutoff = deriveCaffeineCutoff(
    bedtimeTarget,
    profile.caffeineAmount,
  );
  const mealCutoff = deriveMealCutoff(bedtimeTarget);
  const morningLight = addMinutes(
    set(new Date(), {
      ...parseTimeToParts(profile.desiredWakeTime),
      seconds: 0,
      milliseconds: 0,
    }),
    20,
  );
  const lightWindow = format(morningLight, "h:mm a");
  const exerciseWindow =
    profile.exerciseTiming === "evening"
      ? "Aim for movement before 6:00 PM if possible."
      : profile.exerciseTiming === "rarely"
        ? "Add a light walk between 10:00 AM and 4:00 PM on most days."
        : "Keep movement in your usual earlier part of the day.";
  const napGuidance =
    profile.naps === "frequent_long"
      ? "Avoid naps when you can during the 6-week reset."
      : profile.naps === "frequent_short"
        ? "If you nap, keep it under 20 minutes and before 2:00 PM."
        : profile.naps === "sometimes"
          ? "Use naps sparingly and only as a strategic short reset."
          : "Keep daytime sleep to a minimum so night sleep drive stays strong.";
  const weekendGuardrail =
    profile.weekendWakeShift === "same"
      ? "Keep the same wake time on weekends."
      : profile.weekendWakeShift === "under_1_hour"
        ? "Do not let weekends drift more than about 1 hour."
        : "Cap weekend sleeping-in and protect the wake anchor as much as possible.";

  const calendarName = `${brandName} 6-Week Beta Program`;
  const planBase = {
    timezone: profile.timezone,
    durationWeeks: 6,
    wakeTime: timeLabel(profile.desiredWakeTime),
    bedtimeTarget: timeLabel(bedtimeTarget),
    screenCutoff: timeLabel(screenCutoff),
    caffeineCutoff: timeLabel(caffeineCutoff),
    windDownStart: timeLabel(windDownStart),
    mealCutoff: timeLabel(mealCutoff),
    lightWindow,
    exerciseWindow,
    napGuidance,
    sleepWindow: buildSleepWindowLabel(sleepWindowHours),
    weekendGuardrail,
    calendarName,
    insightTags: profile.insightTags,
  };

  const events: ProgramEvent[] = [];

  for (let dayOffset = 0; dayOffset < 42; dayOffset += 1) {
    const day = addDays(new Date(), dayOffset);
    const weekNumber = weekNumberForOffset(dayOffset);
    const wakePrompt = wakePrompts[dayOffset % wakePrompts.length];
    const lightPrompt = lightPrompts[dayOffset % lightPrompts.length];
    const screenPrompt = screenPrompts[dayOffset % screenPrompts.length];
    const mealPrompt = mealPrompts[dayOffset % mealPrompts.length];
    const windPractice = windDownPractices[dayOffset % windDownPractices.length];
    const bedtimePractice = bedtimePractices[dayOffset % bedtimePractices.length];
    const rescuePrompt = rescuePrompts[dayOffset % rescuePrompts.length];
    const isWeekendSetupDay = day.getDay() === 5 || day.getDay() === 6;
    const needsMindsetEvent =
      day.getDay() === 1 || day.getDay() === 3 || isWeekendSetupDay;

    const sleepWindowEvent = buildEvent(
      day,
      weekNumber,
      "bed",
      STANDARD_TITLES.sleepWindow,
      descriptionWithWhy(
        "This is your bedtime target. Start your sleep window now. If you feel sleepy enough, get into bed. If you are not sleepy yet, stay in dim light and keep things quiet and low-stimulation until sleepiness rises.",
        "A stable bedtime window is one of the core timing anchors in CBT-I. The goal is consistency, not trying to force sleep on command.",
        "If you do not fall asleep or if you wake in the night and stay awake uncomfortably long, leave the bed for a short quiet reset in dim light. Return only when sleepiness comes back.",
      ),
      bedtimeTarget,
      Math.round(sleepWindowHours * 60),
      "sleep-window",
      {
        eventRole: "sleep_window",
      },
    );
    sleepWindowEvent.plannedStartsAt = sleepWindowEvent.startsAt;
    sleepWindowEvent.plannedEndsAt = sleepWindowEvent.endsAt;
    const nightDate = dateKeyInTimeZone(
      new Date(sleepWindowEvent.endsAt),
      profile.timezone,
    );
    const inBedPracticeEvent = buildEvent(
      day,
      weekNumber,
      "bed",
      STANDARD_TITLES.bed,
      descriptionWithPractice(
        bedtimePractice.name,
        bedtimePractice.action,
        "A stable sleep window plus lower effort helps rebuild the bed-sleep association that CBT-I depends on.",
        `If sleep does not come or if you wake during the night and feel fully awake, do not stay in bed battling it. Use a short dim-light reset and come back when sleepy. ${bedtimeExtraByProfile(profile)} ${
          weekNumber === 2
            ? "Week 2 is where stimulus control usually matters most."
            : weekNumber === 5
              ? "If tonight goes badly, the rescue is tomorrow's consistency, not extra time in bed."
              : ""
        }`.trim(),
      ),
      addMinutesToTime(bedtimeTarget, 10),
      25,
      "in-bed-practice",
      {
        eventRole: "in_bed_practice",
        nightDate,
      },
    );
    const checkInStart = addMinutes(new Date(sleepWindowEvent.endsAt), 25);
    const checkInEvent = buildAbsoluteEvent(
      checkInStart,
      weekNumber,
      "checkin",
      STANDARD_TITLES.checkin,
      "Take 30 to 60 seconds to log the night that just ended. It keeps your plan tied to what actually happened, not memory alone.",
      5,
      `${nightDate}-checkin-daily-log`,
      {
        eventRole: "daily_checkin",
        nightDate,
      },
    );

    events.push(
      buildEvent(
        day,
        weekNumber,
        "wake",
        STANDARD_TITLES.wake,
        descriptionWithWhy(
          wakePrompt,
          "A stable rise time is one of the strongest signals for circadian timing and helps preserve sleep pressure for the next night.",
          weekNumber >= 5
            ? "After a rough night, keep this time anyway. Morning consistency is part of the treatment."
            : weekFocusExtra(weekNumber),
        ),
        profile.desiredWakeTime,
        15,
      ),
      buildEvent(
        day,
        weekNumber,
        "light",
        STANDARD_TITLES.light,
        descriptionWithWhy(
          lightPrompt,
          "Morning light is a strong cue for the body clock and helps anchor the day-night rhythm.",
          weekNumber <= 2
            ? "Try to pair this with standing up promptly instead of lingering in bed."
            : undefined,
        ),
        format(morningLight, "HH:mm"),
        20,
      ),
      buildEvent(
        day,
        weekNumber,
        "meal",
        STANDARD_TITLES.meal,
        descriptionWithWhy(
          mealPrompt,
          "A digestion buffer can lower bedtime discomfort and reduce one more source of late-evening activation.",
          profile.alcoholTiming === "close_to_bed"
            ? "If alcohol is happening tonight, keep it earlier and lighter than usual."
            : undefined,
        ),
        mealCutoff,
        15,
      ),
      buildEvent(
        day,
        weekNumber,
        "caffeine",
        STANDARD_TITLES.caffeine,
        descriptionWithWhy(
          "This is the latest point for coffee, tea, cola, energy drinks, or pre-workout today.",
          "Caffeine blocks part of the sleep-pressure signal, so the effect can outlast the obvious buzz.",
          profile.caffeineAmount === "high"
            ? "Because your intake is on the higher side, this cutoff is intentionally earlier."
            : weekNumber === 3
              ? "Week 3 usually tells the truth about whether caffeine is still sneaking into the problem."
              : undefined,
        ),
        caffeineCutoff,
        15,
      ),
      buildEvent(
        day,
        weekNumber,
        "screen",
        STANDARD_TITLES.screen,
        descriptionWithWhy(
          screenPrompt,
          "The goal is not perfection. It is lowering light, cognitive load, urgency, and emotional activation before bed.",
          profile.workAfterDinner === "often" || profile.workAfterDinner === "almost_always"
            ? "If work still feels unfinished, park it on paper and let tonight be incomplete."
            : weekNumber >= 4
              ? "This is also the moment to stop emotional conversations and problem-solving if you can."
              : undefined,
        ),
        screenCutoff,
        20,
      ),
      buildEvent(
        day,
        weekNumber,
        "winddown",
        STANDARD_TITLES.winddown,
        descriptionWithPractice(
          windPractice.name,
          windPractice.action,
          "A repeatable downshift routine lowers cognitive and physical arousal so bedtime does not have to do all the work at once.",
          weekNumber >= 4
            ? "Tonight's rule is simple: fewer inputs, slower pace, and no emotional admin."
            : weekFocusExtra(weekNumber),
        ),
        windDownStart,
        windDownMinutes,
      ),
      {
        ...sleepWindowEvent,
        nightDate,
      },
      inBedPracticeEvent,
      checkInEvent,
    );

    if (profile.exerciseTiming !== "rarely") {
      events.push(
        buildEvent(
          day,
          weekNumber,
          "exercise",
          STANDARD_TITLES.exercise,
          descriptionWithWhy(
            "Aim for steady movement today, even if it is simple.",
            "Regular daytime movement can support sleep drive and often helps with mood and stress regulation.",
            profile.exerciseTiming === "evening"
              ? "Try to finish vigorous activity earlier than your current habit if you can."
              : undefined,
          ),
          profile.exerciseTiming === "morning"
            ? "09:00"
            : profile.exerciseTiming === "afternoon"
              ? "15:00"
              : "17:30",
          30,
        ),
      );
    }

    if (profile.naps !== "never") {
      events.push(
        buildEvent(
          day,
          weekNumber,
          "nap",
          STANDARD_TITLES.nap,
          descriptionWithWhy(
            "If you truly need a nap, keep it intentional, short, and early.",
            "Long or late naps can discharge the sleep pressure that tonight needs.",
            napGuidance,
          ),
          "13:30",
          20,
        ),
      );
    }

    if (needsMindsetEvent) {
      events.push(
        buildEvent(
          day,
          weekNumber,
          "mindset",
          STANDARD_TITLES.mindset,
          awarenessDescription(
            isWeekendSetupDay
              ? weekendPrompts[dayOffset % weekendPrompts.length]
              : weeklyCoachNotes[weekNumber as keyof typeof weeklyCoachNotes][
                  dayOffset % weeklyCoachNotes[weekNumber as keyof typeof weeklyCoachNotes].length
                ],
            isWeekendSetupDay
              ? "Weekend drift can quietly undo progress if the wake anchor disappears."
              : "Short coaching reminders help you interpret rough nights without panic or overcorrection.",
            rescuePrompt,
          ),
          isWeekendSetupDay ? "18:30" : "12:30",
          15,
        ),
      );
    }

    if ((dayOffset + 1) % 7 === 0) {
      events.push(
        buildEvent(
          day,
          weekNumber,
          "review",
          `Week ${weekNumber} review`,
          optionalReviewDescription(
            reviewPrompts[(weekNumber - 1) % reviewPrompts.length],
            "Reviewing patterns weekly makes it easier to improve the system instead of blaming yourself for one rough night.",
            "You are looking for patterns, not grading yourself.",
          ),
          "17:00",
          20,
        ),
      );
    }
  }

  return {
    ...planBase,
    weekSummaries: buildWeekSummaries(profile, planBase),
    events,
  };
}
