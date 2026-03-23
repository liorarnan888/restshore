import type {
  AnswerMap,
  FlowStep,
  MicroLessonCard,
  QuestionDefinition,
} from "@/lib/types";
import { isStringArray, unique } from "@/lib/utils";

const questions: QuestionDefinition[] = [
  {
    id: "primary_problem",
    type: "question",
    section: "Sleep Story",
    eyebrow: "Part 1",
    title: "What feels most frustrating about your sleep right now?",
    helper: "Pick the one that feels most true on your average difficult night.",
    inputType: "single-select",
    required: true,
    options: [
      {
        value: "falling_asleep",
        label: "Falling asleep takes too long",
        description: "The hard part is getting sleep started.",
      },
      {
        value: "night_wakings",
        label: "I wake during the night and stay awake",
        description: "Sleep starts, but staying asleep is the challenge.",
      },
      {
        value: "early_waking",
        label: "I wake too early and cannot get back to sleep",
        description: "The second half of the night feels fragile.",
      },
      {
        value: "irregular_schedule",
        label: "My sleep timing is all over the place",
        description: "Bedtime and wake time drift a lot.",
      },
    ],
  },
  {
    id: "insomnia_duration",
    type: "question",
    section: "Sleep Story",
    eyebrow: "Part 1",
    title: "How long has this been a real problem?",
    helper: "We are looking for the overall pattern, not just your worst week.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "under_1_month", label: "Less than a month" },
      { value: "1_3_months", label: "About 1 to 3 months" },
      { value: "3_12_months", label: "Several months" },
      { value: "over_1_year", label: "More than a year" },
    ],
  },
  {
    id: "daytime_impact",
    type: "question",
    section: "Sleep Story",
    eyebrow: "Part 1",
    title: "How much is sleep affecting daytime life lately?",
    helper: "This helps us estimate the current severity and urgency.",
    inputType: "single-select",
    required: true,
    options: [
      {
        value: "mild",
        label: "Annoying, but I can still function",
        description: "I notice it, but it is not running the day.",
      },
      {
        value: "moderate",
        label: "It affects focus, mood, or patience",
        description: "I get through the day, but it costs me.",
      },
      {
        value: "high",
        label: "It is clearly disrupting work or home life",
        description: "I feel the impact most days.",
      },
      {
        value: "severe",
        label: "It feels hard to function well",
        description: "My days are being shaped by the sleep problem.",
      },
    ],
  },
  {
    id: "desired_wake_time",
    type: "question",
    section: "Rhythm",
    eyebrow: "Part 2",
    title: "If this plan worked well, what would be your ideal regular wake-up time?",
    helper: "This becomes the anchor for the 6-week program.",
    inputType: "time",
    required: true,
  },
  {
    id: "usual_bedtime",
    type: "question",
    section: "Rhythm",
    eyebrow: "Part 2",
    title: "Around what time do you usually get into bed on weeknights?",
    helper: "Use your real current pattern, not your ideal target.",
    inputType: "time",
    required: true,
  },
  {
    id: "weekend_wake_shift",
    type: "question",
    section: "Rhythm",
    eyebrow: "Part 2",
    title: "How much later do you usually wake on weekends or days off?",
    helper: "A drifting wake time can quietly keep insomnia going.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "same", label: "About the same time" },
      { value: "under_1_hour", label: "Up to 1 hour later" },
      { value: "1_2_hours", label: "About 1 to 2 hours later" },
      { value: "over_2_hours", label: "More than 2 hours later" },
    ],
  },
  {
    id: "time_in_bed",
    type: "question",
    section: "Rhythm",
    eyebrow: "Part 2",
    title: "How long are you usually in bed across the whole night?",
    helper: "Count the full time in bed, not just the time you think you are asleep.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "under_6", label: "Under 6 hours" },
      { value: "6_7", label: "About 6 to 7 hours" },
      { value: "7_8", label: "About 7 to 8 hours" },
      { value: "8_9", label: "About 8 to 9 hours" },
      { value: "over_9", label: "More than 9 hours" },
    ],
  },
  {
    id: "sleep_latency",
    type: "question",
    section: "Night Pattern",
    eyebrow: "Part 3",
    title: "How long does it usually take you to fall asleep?",
    helper: "A rough estimate is perfect.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "under_15", label: "Under 15 minutes" },
      { value: "15_30", label: "15 to 30 minutes" },
      { value: "30_60", label: "30 to 60 minutes" },
      { value: "over_60", label: "More than an hour" },
    ],
  },
  {
    id: "wake_after_sleep_onset",
    type: "question",
    section: "Night Pattern",
    eyebrow: "Part 3",
    title: "Altogether, how much time are you awake during the night after first falling asleep?",
    helper: "Think about the total awake time across your average night.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "under_15", label: "Under 15 minutes" },
      { value: "15_30", label: "15 to 30 minutes" },
      { value: "30_60", label: "30 to 60 minutes" },
      { value: "over_60", label: "More than an hour" },
    ],
  },
  {
    id: "awakenings_count",
    type: "question",
    section: "Night Pattern",
    eyebrow: "Part 3",
    title: "On a typical difficult night, how many awakenings do you notice?",
    helper: "Only count awakenings you remember, not every micro-wake.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "0_1", label: "Zero or one" },
      { value: "2_3", label: "Two to three" },
      { value: "4_plus", label: "Four or more" },
    ],
  },
  {
    id: "early_wake_pattern",
    type: "question",
    section: "Night Pattern",
    eyebrow: "Part 3",
    title: "How often do you wake earlier than planned and struggle to return to sleep?",
    helper: "This matters even if your main complaint is something else.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "1_2", label: "1 to 2 times a week" },
      { value: "3_4", label: "3 to 4 times a week" },
      { value: "most_nights", label: "Most nights" },
    ],
  },
  {
    id: "schedule_consistency",
    type: "question",
    section: "Night Pattern",
    eyebrow: "Part 3",
    title: "How consistent are your bedtime and wake time through the week?",
    helper: "CBT-I usually cares more about rhythm than perfection.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "very_consistent", label: "Usually within 30 minutes" },
      { value: "somewhat_consistent", label: "Usually within about 1 hour" },
      { value: "swings", label: "They swing by 1 to 2 hours" },
      { value: "very_irregular", label: "They change a lot" },
    ],
  },
  {
    id: "bed_use_pattern",
    type: "question",
    section: "Habits in Bed",
    eyebrow: "Part 4",
    title: "When you are in bed, what is usually happening besides sleep?",
    helper: "Choose all that fit your real pattern. The goal is an accurate picture, not a perfect one.",
    inputType: "multi-select",
    required: true,
    options: [
      { value: "none", label: "Mostly sleep only" },
      { value: "phone_or_tv", label: "Phone, TV, or scrolling happens there" },
      { value: "worrying", label: "A lot of worrying or planning happens there" },
      { value: "work", label: "I often work, answer messages, or study there" },
    ],
  },
  {
    id: "awake_response",
    type: "question",
    section: "Habits in Bed",
    eyebrow: "Part 4",
    title: "If you are awake in bed for a while, what do you usually do?",
    helper: "This helps us shape the stimulus-control part of the plan.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "stay_and_try", label: "Stay there and keep trying to sleep" },
      { value: "phone", label: "Pick up my phone or start scrolling" },
      { value: "tv_or_media", label: "Turn on TV, videos, or other media" },
      { value: "get_out", label: "Get out of bed for a quiet reset" },
    ],
  },
  {
    id: "caffeine_amount",
    type: "question",
    section: "Inputs and Triggers",
    eyebrow: "Part 5",
    title: "How much caffeine would you say you use most days?",
    helper: "Coffee, tea, cola, pre-workout, and energy drinks all count.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "none", label: "Little to none" },
      { value: "light", label: "About 1 serving" },
      { value: "moderate", label: "About 2 servings" },
      { value: "high", label: "3 or more servings" },
    ],
  },
  {
    id: "caffeine_timing",
    type: "question",
    section: "Inputs and Triggers",
    eyebrow: "Part 5",
    title: "What is your latest usual caffeine timing?",
    helper: "We want the latest common pattern, not the ideal answer.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "none", label: "I rarely use caffeine" },
      { value: "before_noon", label: "Before noon" },
      { value: "early_afternoon", label: "Between noon and 3 PM" },
      { value: "late_afternoon", label: "Between 3 PM and 6 PM" },
      { value: "evening", label: "After 6 PM" },
    ],
  },
  {
    id: "alcohol_timing",
    type: "question",
    section: "Inputs and Triggers",
    eyebrow: "Part 5",
    title: "How often is alcohol part of your evening or close-to-bed routine?",
    helper: "Even moderate amounts can shape second-half sleep.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "rarely", label: "Rarely or never" },
      { value: "some_evenings", label: "Some evenings" },
      { value: "most_evenings", label: "Most evenings" },
      { value: "close_to_bed", label: "Often close to bedtime" },
    ],
  },
  {
    id: "dinner_timing",
    type: "question",
    section: "Inputs and Triggers",
    eyebrow: "Part 5",
    title: "How late is your last full meal most nights?",
    helper: "This helps us decide if a digestion buffer matters in the calendar.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "3_plus_hours", label: "More than 3 hours before bed" },
      { value: "2_3_hours", label: "About 2 to 3 hours before bed" },
      { value: "under_2_hours", label: "Within 2 hours of bed" },
      { value: "very_late", label: "Very late or irregular" },
    ],
  },
  {
    id: "screen_habit",
    type: "question",
    section: "Inputs and Triggers",
    eyebrow: "Part 5",
    title: "What usually happens with screens close to bedtime?",
    helper: "The issue is often stimulation, not just light.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "very_little", label: "Very little screen time" },
      { value: "light_scroll", label: "A little TV or scrolling" },
      { value: "in_bed", label: "I am usually on my phone in bed" },
      { value: "work_late", label: "I often work or message late" },
    ],
  },
  {
    id: "work_after_dinner",
    type: "question",
    section: "Inputs and Triggers",
    eyebrow: "Part 5",
    title: "How often is your brain still in work mode after dinner?",
    helper: "This can quietly wreck the runway into sleep.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
      { value: "almost_always", label: "Almost every night" },
    ],
  },
  {
    id: "naps",
    type: "question",
    section: "Recovery and Daytime",
    eyebrow: "Part 6",
    title: "How often do you nap right now?",
    helper: "Short or long naps both count.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "never", label: "Almost never" },
      { value: "sometimes", label: "A couple of times a week" },
      { value: "frequent_short", label: "Most days, usually short" },
      { value: "frequent_long", label: "Most days, often long" },
    ],
  },
  {
    id: "exercise_timing",
    type: "question",
    section: "Recovery and Daytime",
    eyebrow: "Part 6",
    title: "When does exercise or vigorous activity usually happen for you?",
    helper: "Even walking counts if it is part of a repeatable routine.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "morning", label: "Mostly morning" },
      { value: "afternoon", label: "Mostly afternoon" },
      { value: "evening", label: "Mostly evening" },
      { value: "rarely", label: "I am not exercising much right now" },
    ],
  },
  {
    id: "stress_level",
    type: "question",
    section: "Mind and Body",
    eyebrow: "Part 7",
    title: "How activated does your mind or body feel near bedtime?",
    helper: "We use this to choose how much downshifting support to build in.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "calm", label: "Usually calm enough" },
      { value: "busy", label: "A bit busy" },
      { value: "racing", label: "Pretty activated" },
      { value: "very_racing", label: "Very activated or anxious" },
    ],
  },
  {
    id: "sleep_thoughts",
    type: "question",
    section: "Mind and Body",
    eyebrow: "Part 7",
    title: "Which thought pattern sounds most familiar at night?",
    helper: "Choose all that fit. CBT-I is not just timing. It also cares about what the brain learns in bed.",
    inputType: "multi-select",
    required: true,
    options: [
      { value: "none", label: "I am not too caught in sleep thoughts" },
      { value: "clock_watching", label: "I keep checking the time" },
      { value: "pressure", label: "I feel pressure to make sleep happen" },
      { value: "catastrophic", label: "My mind spirals about tomorrow or my health" },
    ],
  },
  {
    id: "relaxation_experience",
    type: "question",
    section: "Mind and Body",
    eyebrow: "Part 7",
    title: "What has your experience with calming practices been so far?",
    helper: "This lets us vary the bedtime instructions instead of repeating one technique.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "none", label: "I have not really tried them" },
      { value: "some_help", label: "A few things help a bit" },
      { value: "inconsistent", label: "I try things, but not consistently" },
      { value: "many_failed", label: "I have tried a lot and feel skeptical" },
    ],
  },
  {
    id: "sleep_medication",
    type: "question",
    section: "Context and Safety",
    eyebrow: "Part 8",
    title: "How much are sleep medications or sleep aids part of the picture right now?",
    helper: "This is just for context and safety messaging, not judgment.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "none", label: "Not really" },
      { value: "occasional", label: "Occasionally" },
      { value: "regular_otc", label: "Regular over-the-counter support" },
      { value: "regular_prescription", label: "Regular prescription support" },
    ],
  },
  {
    id: "sleep_environment",
    type: "question",
    section: "Context and Safety",
    eyebrow: "Part 8",
    title: "Which sleep environment problem gets in the way most often?",
    helper: "Choose all that apply if more than one is genuinely part of the problem.",
    inputType: "multi-select",
    required: true,
    options: [
      { value: "none", label: "My room is usually okay" },
      { value: "light", label: "Too much light" },
      { value: "noise", label: "Too much noise" },
      { value: "temperature", label: "Too warm or too cold" },
      { value: "partner_or_pets", label: "Partner, kids, or pets disrupt sleep" },
    ],
  },
  {
    id: "impact_areas",
    type: "question",
    section: "Context and Safety",
    eyebrow: "Part 8",
    title: "Where is this sleep problem showing up most in life?",
    helper: "Choose all that fit. This helps shape the report and your shareable sleep summary.",
    inputType: "multi-select",
    required: true,
    options: [
      { value: "mood", label: "Mood or irritability" },
      { value: "focus", label: "Focus or memory" },
      { value: "work", label: "Work or study" },
      { value: "relationships", label: "Relationships or parenting" },
      { value: "exercise", label: "Energy for exercise" },
      { value: "health_anxiety", label: "Health anxiety or worry" },
      { value: "none", label: "None of these in a major way" },
    ],
  },
  {
    id: "red_flags",
    type: "question",
    section: "Context and Safety",
    eyebrow: "Part 8",
    title: "Do any of these apply right now?",
    helper: "This helps us show the right caution notes if self-guided coaching may not be enough on its own.",
    inputType: "multi-select",
    options: [
      { value: "none", label: "None of these" },
      { value: "loud_snoring", label: "Loud snoring or choking/gasping in sleep" },
      { value: "shift_work", label: "Regular overnight or rotating shift work" },
      { value: "restless_legs", label: "Strong leg discomfort or urge to move at night" },
      { value: "sleeping_pills", label: "Frequent prescription sleep medication use" },
      { value: "mental_health", label: "A major mental health flare-up affecting sleep" },
      { value: "pregnancy", label: "Pregnancy or recent postpartum changes" },
    ],
  },
  {
    id: "motivation",
    type: "question",
    section: "Commitment",
    eyebrow: "Part 9",
    title: "How ready are you to follow a structured 6-week sleep experiment?",
    helper: "CBT-I works best when the plan feels challenging but still believable.",
    inputType: "single-select",
    required: true,
    options: [
      { value: "cautious", label: "I want something gentle and realistic" },
      { value: "steady", label: "I am ready for a solid routine" },
      { value: "high", label: "I am ready for a pretty structured reset" },
      { value: "urgent", label: "I am willing to do a lot if it helps" },
    ],
  },
];

const lessons: MicroLessonCard[] = [
  {
    id: "lesson_anchor_wake",
    type: "lesson",
    section: "Sleep Story",
    eyebrow: "Tiny sleep truth",
    title: "A stable wake time is often the strongest first move in CBT-I.",
    body: "The body clock learns from the morning. When wake time steadies, nights usually become less random even before bedtime feels fixed.",
    insight:
      "We will build your whole program from one dependable wake anchor, not from a perfect bedtime promise.",
    accent: "Wake rhythm",
  },
  {
    id: "lesson_sleep_pressure",
    type: "lesson",
    section: "Night Pattern",
    eyebrow: "What this means",
    title: "CBT-I does not just ask when you sleep. It also looks at how much awake time is happening in bed.",
    body: "Long stretches of awake time in bed can teach the brain that the bed is a place for effort, worry, and wakefulness. The plan will try to reverse that association.",
    insight:
      "Your 6-week program will focus on sleep pressure, timing, and behavior, not just generic sleep tips.",
    accent: "Sleep pressure",
    tags: ["long_awake", "severe_insomnia"],
  },
  {
    id: "lesson_stimulus_control",
    type: "lesson",
    section: "Habits in Bed",
    eyebrow: "Core CBT-I principle",
    title: "Beds work best when the brain links them with sleep, not with trying hard.",
    body: "If the bed becomes the place for scrolling, worrying, working, or battling for sleep, the nervous system learns the wrong lesson. Stimulus control is about teaching a cleaner association.",
    insight:
      "That is why your calendar will include specific instructions for what to do if sleep is not happening.",
    accent: "Stimulus control",
    tags: ["bed_association", "late_stimulation"],
  },
  {
    id: "lesson_arousal",
    type: "lesson",
    section: "Mind and Body",
    eyebrow: "Momentum card",
    title: "The real bedtime issue is often activation, not just blue light.",
    body: "For many people, the brain is still solving, planning, replaying, checking, and reacting long after dinner. A good wind-down reduces mental load as much as screen light.",
    insight:
      "We will rotate different downshift practices so the program does not feel repetitive or childish.",
    accent: "Downshift",
    tags: ["high_arousal", "late_stimulation"],
  },
  {
    id: "lesson_consistency",
    type: "lesson",
    section: "Commitment",
    eyebrow: "How this program works",
    title: "The goal is not one perfect night. The goal is six weeks of better signals.",
    body: "Strong sleep plans are built from repeatable cues, clear experiments, and enough structure to learn from setbacks. That is what creates traction.",
    insight:
      "Next, we'll show what seems to be shaping your sleep and the starting structure built from your answers.",
    accent: "Six-week arc",
  },
];

const flowBlueprint: FlowStep[] = [
  questions[0],
  questions[1],
  questions[2],
  lessons[0],
  questions[3],
  questions[4],
  questions[5],
  questions[6],
  questions[7],
  questions[8],
  questions[9],
  questions[10],
  lessons[1],
  questions[11],
  questions[12],
  questions[13],
  lessons[2],
  questions[14],
  questions[15],
  questions[16],
  questions[17],
  questions[18],
  questions[19],
  lessons[3],
  questions[20],
  questions[21],
  questions[22],
  questions[23],
  questions[24],
  questions[25],
  questions[26],
  questions[27],
  lessons[4],
];

export function getQuestionById(questionId: string) {
  return questions.find((question) => question.id === questionId);
}

function answerIncludes(answer: AnswerMap[string], value: string) {
  if (Array.isArray(answer)) {
    return answer.includes(value);
  }

  return answer === value;
}

export function deriveInsightTags(answers: AnswerMap) {
  const tags: string[] = [];

  if (
    answers.sleep_latency === "30_60" ||
    answers.sleep_latency === "over_60" ||
    answers.wake_after_sleep_onset === "30_60" ||
    answers.wake_after_sleep_onset === "over_60"
  ) {
    tags.push("long_awake");
  }

  if (
    answers.schedule_consistency === "swings" ||
    answers.schedule_consistency === "very_irregular" ||
    answers.weekend_wake_shift === "1_2_hours" ||
    answers.weekend_wake_shift === "over_2_hours" ||
    answers.primary_problem === "irregular_schedule"
  ) {
    tags.push("irregular_schedule");
  }

  if (
    answers.screen_habit === "in_bed" ||
    answers.screen_habit === "work_late" ||
    answers.work_after_dinner === "often" ||
    answers.work_after_dinner === "almost_always"
  ) {
    tags.push("late_stimulation");
  }

  if (
    answers.stress_level === "racing" ||
    answers.stress_level === "very_racing" ||
    answerIncludes(answers.sleep_thoughts, "pressure") ||
    answerIncludes(answers.sleep_thoughts, "catastrophic")
  ) {
    tags.push("high_arousal");
  }

  if (
    answerIncludes(answers.bed_use_pattern, "phone_or_tv") ||
    answerIncludes(answers.bed_use_pattern, "worrying") ||
    answerIncludes(answers.bed_use_pattern, "work") ||
    answers.awake_response === "stay_and_try" ||
    answers.awake_response === "phone" ||
    answers.awake_response === "tv_or_media"
  ) {
    tags.push("bed_association");
  }

  if (
    answers.caffeine_timing === "late_afternoon" ||
    answers.caffeine_timing === "evening" ||
    answers.caffeine_amount === "high"
  ) {
    tags.push("late_caffeine");
  }

  if (
    answers.daytime_impact === "high" ||
    answers.daytime_impact === "severe" ||
    (Array.isArray(answers.impact_areas) &&
      answers.impact_areas.some((item) => item !== "none"))
  ) {
    tags.push("daytime_fatigue");
  }

  if (
    answers.sleep_latency === "over_60" ||
    answers.wake_after_sleep_onset === "over_60" ||
    answers.early_wake_pattern === "most_nights" ||
    answers.daytime_impact === "severe"
  ) {
    tags.push("severe_insomnia");
  }

  return unique(tags);
}

function lessonIsVisible(step: MicroLessonCard, answers: AnswerMap) {
  if (!step.tags?.length) {
    return true;
  }

  const insightTags = deriveInsightTags(answers);
  return step.tags.some((tag) => insightTags.includes(tag));
}

export function getVisibleFlowSteps(answers: AnswerMap): FlowStep[] {
  return flowBlueprint.filter((step) => {
    if (step.type !== "lesson") {
      return true;
    }

    return lessonIsVisible(step, answers);
  });
}

export function normaliseAnswer(
  inputType: QuestionDefinition["inputType"],
  value: unknown,
) {
  if (inputType === "multi-select") {
    if (isStringArray(value)) {
      const withoutNone = value.includes("none")
        ? ["none"]
        : value.filter((item) => item !== "none");
      return withoutNone;
    }

    return [];
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}
