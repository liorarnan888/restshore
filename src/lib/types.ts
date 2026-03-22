export type QuestionInputType =
  | "single-select"
  | "multi-select"
  | "time"
  | "text";

export type AnswerValue = string | string[];

export type AnswerMap = Record<string, AnswerValue>;

export type QuestionOption = {
  value: string;
  label: string;
  description?: string;
};

type BaseFlowStep = {
  id: string;
  title: string;
  eyebrow?: string;
  helper?: string;
  section?: string;
};

export type QuestionDefinition = BaseFlowStep & {
  type: "question";
  inputType: QuestionInputType;
  options?: QuestionOption[];
  placeholder?: string;
  required?: boolean;
};

export type EmailCaptureStep = BaseFlowStep & {
  type: "email";
  body: string;
  ctaLabel: string;
};

export type MicroLessonCard = BaseFlowStep & {
  type: "lesson";
  body: string;
  accent: string;
  insight: string;
  tags?: string[];
};

export type FlowStep = QuestionDefinition | EmailCaptureStep | MicroLessonCard;

export type SessionStatus =
  | "in_progress"
  | "ready_for_google"
  | "completed";

export type DeliveryStatus = "pending" | "preview" | "sent" | "failed";

export type LaunchAnalyticsEventType =
  | "page_view"
  | "intake_started"
  | "email_captured"
  | "report_generated"
  | "calendar_connected"
  | "checkin_submitted"
  | "first_checkin_submitted"
  | "feedback_submitted";

export type LaunchFeedbackSource =
  | "report"
  | "checkin"
  | "homepage"
  | "followup_email";

export type LaunchAnalyticsEvent = {
  id: string;
  eventType: LaunchAnalyticsEventType;
  sessionId?: string;
  visitorId?: string;
  route?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type LaunchFeedbackEntry = {
  id: string;
  source: LaunchFeedbackSource;
  rating: number;
  message?: string;
  sessionId?: string;
  email?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type CalendarSyncStatus =
  | "pending"
  | "preview"
  | "syncing"
  | "synced"
  | "failed";

export type CalendarSyncStage =
  | "creating_calendar"
  | "laying_foundation"
  | "building_evening_routine"
  | "building_sleep_window"
  | "adding_coach_notes"
  | "wrapping_up"
  | "complete";

export type CalendarSyncState = {
  totalEvents: number;
  syncedEvents: number;
  batchCursor: number;
  stage: CalendarSyncStage;
  stageLabel: string;
  recentTitles: string[];
  startedAt: string;
  lastUpdatedAt: string;
};

export type DailyCheckInCloseness =
  | "close_to_plan"
  | "bedtime_later"
  | "wake_drifted"
  | "both_drifted"
  | "hard_to_say";

export type DailyCheckInNightPattern =
  | "fell_asleep_quickly"
  | "slow_sleep"
  | "several_wakeups"
  | "early_wake"
  | "rough_mix";

export type DailyCheckInLatencyBucket =
  | "under_20"
  | "20_40"
  | "40_60"
  | "over_60";

export type DailyCheckInAwakeBucket =
  | "under_20"
  | "20_40"
  | "40_60"
  | "over_60";

export type DailyCheckInAwakeningsBucket =
  | "1"
  | "2"
  | "3_4"
  | "5_plus";

export type DailyCheckInEarlyWakeBucket =
  | "under_30"
  | "30_60"
  | "60_90"
  | "over_90";

export type DailyCheckInMorningFunction =
  | "good_enough"
  | "tired_but_manageable"
  | "running_on_fumes";

export type DailySleepCheckIn = {
  nightDate: string;
  sleepEventId: string;
  checkInEventId: string;
  closenessToPlan: DailyCheckInCloseness;
  actualInBedTime: string;
  actualOutOfBedTime: string;
  nightPattern: DailyCheckInNightPattern;
  sleepLatencyBucket?: DailyCheckInLatencyBucket;
  awakeDuringNightBucket?: DailyCheckInAwakeBucket;
  awakeningsBucket?: DailyCheckInAwakeningsBucket;
  earlyWakeBucket?: DailyCheckInEarlyWakeBucket;
  morningFunction: DailyCheckInMorningFunction;
  derivedTitleTags: string[];
  submittedAt: string;
  updatedAt: string;
};

export type AdaptivePlanSummaryItem = {
  id: string;
  title: string;
  detail: string;
};

export type ProgramEvent = {
  id: string;
  title: string;
  baseTitle?: string;
  description: string;
  baseDescription?: string;
  startsAt: string;
  endsAt: string;
  plannedStartsAt?: string;
  plannedEndsAt?: string;
  dayLabel: string;
  weekNumber: number;
  calendarColorId?: string;
  nightDate?: string;
  actionUrl?: string;
  eventRole?: "standard" | "sleep_window" | "in_bed_practice" | "daily_checkin";
  eventType:
    | "wake"
    | "light"
    | "caffeine"
    | "screen"
    | "winddown"
    | "bed"
    | "exercise"
    | "nap"
    | "meal"
    | "review"
    | "mindset"
    | "checkin";
};

export type WeekSummary = {
  weekNumber: number;
  title: string;
  focus: string;
  goals: string[];
};

export type GeneratedPlan = {
  timezone: string;
  durationWeeks: number;
  wakeTime: string;
  bedtimeTarget: string;
  screenCutoff: string;
  caffeineCutoff: string;
  windDownStart: string;
  mealCutoff: string;
  lightWindow: string;
  exerciseWindow: string;
  napGuidance: string;
  sleepWindow: string;
  weekendGuardrail: string;
  calendarName: string;
  weekSummaries: WeekSummary[];
  events: ProgramEvent[];
  insightTags: string[];
};

export type SleepProfile = {
  primaryProblem: string;
  insomniaDuration: string;
  daytimeImpact: string;
  desiredWakeTime: string;
  usualBedtime: string;
  weekendWakeShift: string;
  timeInBed: string;
  sleepLatency: string;
  wakeAfterSleepOnset: string;
  awakeningsCount: string;
  earlyWakePattern: string;
  nightWakings: string;
  scheduleConsistency: string;
  bedUsePattern: string;
  awakeResponse: string;
  caffeineAmount: string;
  caffeineTiming: string;
  alcoholTiming: string;
  dinnerTiming: string;
  screenHabit: string;
  workAfterDinner: string;
  naps: string;
  exerciseTiming: string;
  stressLevel: string;
  sleepThoughts: string;
  relaxationExperience: string;
  sleepMedication: string;
  sleepEnvironment: string;
  impactAreas: string[];
  motivation: string;
  redFlags: string[];
  timezone: string;
  insightTags: string[];
  cautionFlags: string[];
};

export type ReportSection = {
  title: string;
  body: string;
  bullets?: string[];
};

export type GeneratedReport = {
  headline: string;
  summary: string;
  keyInsights: string[];
  sections: ReportSection[];
  safetyNote?: string;
  clinicianSummary: string[];
  html: string;
};

export type ResumeToken = string;

export type IntakeSession = {
  id: string;
  userId?: string;
  resumeToken: ResumeToken;
  status: SessionStatus;
  currentStepId: string;
  answers: AnswerMap;
  email?: string;
  timezone: string;
  startedAt: string;
  updatedAt: string;
  reminderQueuedAt?: string;
  reminderSentAt?: string;
  feedbackFollowUpQueuedAt?: string;
  feedbackFollowUpSentAt?: string;
  googleConnectedAt?: string;
  calendarExternalId?: string;
  reportDeliveryStatus: DeliveryStatus;
  calendarSyncStatus: CalendarSyncStatus;
  calendarSyncState?: CalendarSyncState;
  generatedPlan?: GeneratedPlan;
  generatedReport?: GeneratedReport;
  dailyCheckIns?: DailySleepCheckIn[];
};

export type GoogleAuthContext = {
  userId?: string;
  email?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
};

export type IntakeResponse = {
  session: IntakeSession;
};
