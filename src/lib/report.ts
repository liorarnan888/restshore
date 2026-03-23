import { appSupportPromise, brandName } from "@/lib/brand";
import type { GeneratedPlan, GeneratedReport, ReportSection, SleepProfile } from "@/lib/types";
import { titleCase } from "@/lib/utils";

const primaryProblemLabels: Record<string, string> = {
  falling_asleep: "falling asleep",
  night_wakings: "night wakings",
  early_waking: "early waking",
  irregular_schedule: "irregular schedule",
};

const insomniaDurationLabels: Record<string, string> = {
  under_1_month: "less than a month",
  "1_3_months": "about 1 to 3 months",
  "3_12_months": "several months",
  over_1_year: "more than a year",
};

const daytimeImpactLabels: Record<string, string> = {
  mild: "mild",
  moderate: "moderate",
  high: "high",
  severe: "severe",
};

function formatLabel(value: string, labels: Record<string, string>) {
  return labels[value] ?? titleCase(value.replaceAll("_", " ")).toLowerCase();
}

function formatPrimaryProblem(value: string) {
  return formatLabel(value, primaryProblemLabels);
}

function formatInsomniaDuration(value: string) {
  return formatLabel(value, insomniaDurationLabels);
}

function formatDaytimeImpact(value: string) {
  return formatLabel(value, daytimeImpactLabels);
}

function formatList(items: string[]) {
  return items.map((item) => titleCase(item.replaceAll("_", " ")).toLowerCase());
}

function buildKeyInsights(profile: SleepProfile, plan: GeneratedPlan) {
  const insights = [
    `This program anchors around a ${plan.wakeTime} wake time for the next ${plan.durationWeeks} weeks.`,
    `Your starting sleep window is about ${plan.sleepWindow}. With your wake anchor at ${plan.wakeTime}, that gives an initial bedtime target of ${plan.bedtimeTarget}.`,
    `Your evening boundaries begin with a kitchen slowdown by ${plan.mealCutoff}, caffeine cutoff by ${plan.caffeineCutoff}, and screens down by ${plan.screenCutoff}.`,
  ];

  if (profile.insightTags.includes("late_stimulation")) {
    insights.push(
      "Your answers suggest evening activation is a major driver, so the plan puts extra weight on a real wind-down and work shutdown.",
    );
  }

  if (profile.insightTags.includes("bed_association")) {
    insights.push(
      "The bed itself may have become linked with wakefulness or effort, so stimulus-control instructions are built into the bedtime guidance.",
    );
  }

  if (profile.insightTags.includes("late_caffeine")) {
    insights.push(
      "Caffeine looks like a meaningful lever here, so the schedule creates a firmer daytime cutoff instead of asking for perfection.",
    );
  }

  return insights;
}

function buildClinicianSummary(profile: SleepProfile, plan: GeneratedPlan) {
  const impactText = profile.impactAreas.length
    ? formatList(profile.impactAreas.filter((item) => item !== "none")).join(", ")
    : "not clearly specified";

  return [
    `Primary complaint: ${formatPrimaryProblem(profile.primaryProblem)}.`,
    `Duration: ${formatInsomniaDuration(profile.insomniaDuration)}. Daytime impact: ${formatDaytimeImpact(profile.daytimeImpact)}.`,
    `Current usual bedtime: ${profile.usualBedtime}.`,
    `Starting plan: wake anchor ${plan.wakeTime}, initial bedtime target ${plan.bedtimeTarget}, starting sleep window ${plan.sleepWindow}.`,
    `Main behavioral contributors flagged: ${profile.insightTags.length ? formatList(profile.insightTags).join(", ") : "none strongly flagged"}.`,
    `Functional impact areas: ${impactText}.`,
  ];
}

function buildRescueBullets(profile: SleepProfile, plan: GeneratedPlan) {
  const bullets = [
    "If you are clearly awake and getting more activated, use a short low-light reset outside the bed instead of escalating effort inside it.",
    `Keep the next morning anchored at ${plan.wakeTime}, even after a rough night.`,
    "Do not try to repair one bad night with extra time in bed, heavy napping, or panic-driven bedtime changes.",
  ];

  if (profile.sleepThoughts === "clock_watching") {
    bullets.push("Hide the clock or turn it away. Counting the shrinking hours usually increases pressure.");
  }

  if (profile.awakeResponse === "phone" || profile.awakeResponse === "tv_or_media") {
    bullets.push("Do not let the phone become the rescue plan. Choose something dim, boring, and low-stakes instead.");
  }

  return bullets;
}

function buildClinicianDiscussionPrompts(profile: SleepProfile) {
  const prompts = [
    "Share which part of sleep is hardest: falling asleep, staying asleep, early waking, or irregular timing.",
    "Describe how long the issue has been going on and how often it shows up in a typical week.",
    "Bring up whether weekends, naps, caffeine, stress, or bed habits seem to amplify the problem.",
  ];

  if (profile.cautionFlags.length) {
    prompts.push(
      `Mention these caution flags directly: ${formatList(profile.cautionFlags).join(", ")}.`,
    );
  }

  if (profile.sleepMedication !== "none") {
    prompts.push("If sleep aids or medication are part of the picture, review those habits explicitly with your clinician.");
  }

  return prompts;
}

function buildSections(profile: SleepProfile, plan: GeneratedPlan): ReportSection[] {
  const impactAreas = profile.impactAreas.filter((item) => item !== "none");
  const redFlags = profile.cautionFlags;

  return [
    {
      title: "Sleep snapshot",
      body: `Your answers suggest a sleep pattern most shaped by ${formatPrimaryProblem(
        profile.primaryProblem,
      )}. The problem has been present for ${formatInsomniaDuration(
        profile.insomniaDuration,
      )} and is currently causing ${formatDaytimeImpact(
        profile.daytimeImpact,
      )} daytime impairment.`,
      bullets: [
        `Current usual bedtime: ${profile.usualBedtime}`,
        `Wake anchor: ${plan.wakeTime}`,
        `Initial bedtime target: ${plan.bedtimeTarget} from a ${plan.sleepWindow} starting sleep window`,
        `Weekend guardrail: ${plan.weekendGuardrail}`,
      ],
    },
    {
      title: "What appears to be keeping the problem going",
      body: "Insomnia usually survives because the brain starts learning the wrong lessons: bed equals wakefulness, evenings stay too activated, weekends drift, and daytime rescue behaviors quietly weaken night sleep pressure.",
      bullets: [
        profile.insightTags.includes("long_awake")
          ? "Long awake time in bed is likely reinforcing effort and frustration."
          : "Awake time in bed is present, but may not be the dominant maintaining factor.",
        profile.insightTags.includes("late_stimulation")
          ? "Late stimulation and unfinished evening tasks look like a meaningful contributor."
          : "Evening stimulation does not look like the strongest driver, but still matters.",
        profile.insightTags.includes("irregular_schedule")
          ? "Schedule drift is likely undermining sleep pressure and body-clock stability."
          : "Rhythm looks somewhat workable, so the plan focuses more on arousal and association.",
      ],
    },
    {
      title: "Your 6-week CBT-I program",
      body: "This is not a generic sleep tips checklist. It is a structured six-week behavioral experiment designed to stabilize rhythm, rebuild bed-sleep association, and lower bedtime effort.",
      bullets: plan.weekSummaries.map(
        (week) => `Week ${week.weekNumber}: ${week.title} - ${week.focus}`,
      ),
    },
    {
      title: "Daily anchors that matter most",
      body: "The calendar is designed to teach, not just remind. Each event contains a small action and the reason that action matters so the routine feels more practical and less arbitrary.",
      bullets: [
        `Morning light target: around ${plan.lightWindow}`,
        `Wind-down begins: ${plan.windDownStart}`,
        `Movement guidance: ${plan.exerciseWindow}`,
        `Nap guidance: ${plan.napGuidance}`,
      ],
    },
    {
      title: "If tonight goes badly",
      body: "A support plan is only useful if it still gives you a script on rough nights. The goal after a difficult night is not to invent a new system at 2 AM. It is to follow a small, calmer rescue sequence and protect the next morning.",
      bullets: buildRescueBullets(profile, plan),
    },
    {
      title: "If you decide to get outside help",
      body: "If you still need help after following the plan, this summary gives a clearer picture than simply saying 'I do not sleep well.' It captures timing, awake time, behavioral contributors, and safety flags in a format that is easier to share with a sleep-focused clinician.",
      bullets: [
        `Main complaint: ${formatPrimaryProblem(profile.primaryProblem)}`,
        `Sleep window target: ${plan.sleepWindow}`,
        `Behavioral targets: ${profile.insightTags.length ? formatList(profile.insightTags).join(", ") : "general stabilization"}`,
        `Functional impact: ${impactAreas.length ? formatList(impactAreas).join(", ") : "not strongly endorsed"}`,
      ],
    },
    {
      title: "Helpful talking points",
      body: "If you talk to a clinician, these are the kinds of details that usually help them get traction faster.",
      bullets: buildClinicianDiscussionPrompts(profile),
    },
    ...(redFlags.length
      ? [
          {
            title: "Important caution flags",
            body: "Some of your answers point beyond ordinary self-guided insomnia coaching and may deserve direct medical input alongside any behavioral plan.",
            bullets: formatList(redFlags),
          } satisfies ReportSection,
        ]
      : []),
  ];
}

function renderSection(section: ReportSection) {
  return `
    <section style="margin-top:28px;">
      <h2 style="font-size:24px; margin:0 0 10px; color:#1f2340;">${section.title}</h2>
      <p style="line-height:1.75; color:#43455e; margin:0 0 12px;">${section.body}</p>
      ${
        section.bullets?.length
          ? `<ul style="padding-left:20px; margin:0;">${section.bullets
              .map((bullet) => `<li style="margin-bottom:8px; line-height:1.7;">${bullet}</li>`)
              .join("")}</ul>`
          : ""
      }
    </section>
  `;
}

export function buildGeneratedReport(
  profile: SleepProfile,
  plan: GeneratedPlan,
): GeneratedReport {
  const keyInsights = buildKeyInsights(profile, plan);
  const clinicianSummary = buildClinicianSummary(profile, plan);
  const sections = buildSections(profile, plan);
  const safetyNote = profile.cautionFlags.length
    ? "Some of your answers suggest issues that may deserve clinician input as well, so please treat this program as coaching support rather than diagnosis or treatment."
    : undefined;

  const html = `
    <div style="font-family: Arial, sans-serif; background:#f6efe4; padding:32px; color:#1f2340;">
      <div style="max-width:780px; margin:0 auto; background:#fffaf3; border-radius:28px; padding:36px; border:1px solid rgba(31,35,64,.08);">
        <p style="text-transform:uppercase; letter-spacing:.18em; color:#2d8d8f; font-size:12px; margin:0 0 12px;">${brandName}</p>
        <h1 style="font-size:40px; line-height:1.05; margin:0 0 16px;">Your 6-week sleep plan</h1>
        <p style="font-size:18px; line-height:1.75; color:#5f6178; margin:0 0 24px;">
          A calm sleep summary built from your interview, with a week-by-week plan, calendar-guided coaching, and a reusable overview you can share if you need extra support.
        </p>
        <p style="font-size:15px; line-height:1.7; color:#5f6178; margin:0 0 24px;">
          ${appSupportPromise}
        </p>

        <div style="padding:20px; border-radius:22px; background:rgba(45,141,143,.08);">
          <h2 style="font-size:22px; margin:0 0 10px;">Top insights</h2>
          <ul style="padding-left:20px; margin:0;">
            ${keyInsights.map((insight) => `<li style="margin-bottom:8px; line-height:1.7;">${insight}</li>`).join("")}
          </ul>
        </div>

        <div style="margin-top:24px; padding:20px; border-radius:22px; background:rgba(245,127,91,.08);">
          <h2 style="font-size:22px; margin:0 0 10px;">Sleep summary snapshot</h2>
          <ul style="padding-left:20px; margin:0;">
            ${clinicianSummary
              .map((line) => `<li style="margin-bottom:8px; line-height:1.7;">${line}</li>`)
              .join("")}
          </ul>
        </div>

        <div style="margin-top:24px; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px;">
          <div style="padding:16px; border-radius:20px; background:white; border:1px solid rgba(31,35,64,.08);">
            <p style="font-size:12px; text-transform:uppercase; letter-spacing:.14em; color:#6f6c7e; margin:0;">Wake anchor</p>
            <p style="font-size:24px; font-weight:700; margin:8px 0 0;">${plan.wakeTime}</p>
          </div>
          <div style="padding:16px; border-radius:20px; background:white; border:1px solid rgba(31,35,64,.08);">
            <p style="font-size:12px; text-transform:uppercase; letter-spacing:.14em; color:#6f6c7e; margin:0;">Bedtime target</p>
            <p style="font-size:24px; font-weight:700; margin:8px 0 0;">${plan.bedtimeTarget}</p>
          </div>
          <div style="padding:16px; border-radius:20px; background:white; border:1px solid rgba(31,35,64,.08);">
            <p style="font-size:12px; text-transform:uppercase; letter-spacing:.14em; color:#6f6c7e; margin:0;">Sleep window</p>
            <p style="font-size:24px; font-weight:700; margin:8px 0 0;">${plan.sleepWindow}</p>
          </div>
        </div>

        <section style="margin-top:28px;">
          <h2 style="font-size:24px; margin:0 0 12px; color:#1f2340;">Week-by-week roadmap</h2>
          <div style="display:grid; gap:12px;">
            ${plan.weekSummaries
              .map(
                (week) => `
                  <article style="padding:18px; border-radius:22px; background:white; border:1px solid rgba(31,35,64,.08);">
                    <p style="font-size:12px; text-transform:uppercase; letter-spacing:.14em; color:#2d8d8f; margin:0 0 8px;">Week ${week.weekNumber}</p>
                    <h3 style="font-size:20px; margin:0 0 8px;">${week.title}</h3>
                    <p style="line-height:1.7; color:#43455e; margin:0 0 10px;">${week.focus}</p>
                    <ul style="padding-left:20px; margin:0;">
                      ${week.goals.map((goal) => `<li style="margin-bottom:6px; line-height:1.7;">${goal}</li>`).join("")}
                    </ul>
                  </article>
                `,
              )
              .join("")}
          </div>
        </section>

        ${sections.map(renderSection).join("")}

        ${
          safetyNote
            ? `<section style="margin-top:28px; padding:18px; background:rgba(245,127,91,.12); border-radius:20px;">
                <h2 style="font-size:20px; margin:0 0 8px;">A gentle caution</h2>
                <p style="line-height:1.75; margin:0;">${safetyNote}</p>
              </section>`
            : ""
        }
      </div>
    </div>
  `;

  return {
    headline: "Your 6-week sleep plan",
    summary:
      "A calm sleep summary with a six-week behavioral plan, calendar-guided coaching, and a clinician-friendly snapshot that separates your current pattern from the derived starting plan.",
    keyInsights,
    sections,
    safetyNote,
    clinicianSummary,
    html,
  };
}
