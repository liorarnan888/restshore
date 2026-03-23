import type { DailySleepCheckIn, GeneratedPlan, ReportPlanView, WeekSummary } from "@/lib/types";
import { reviewWeeklyStructure } from "@/lib/structural-adaptation";

function buildWeekArc(weekSummaries: WeekSummary[]) {
  return weekSummaries.map(({ weekNumber, title, focus }) => ({
    weekNumber,
    title,
    focus,
  }));
}

export function buildReportPlanView(
  plan: GeneratedPlan,
  dailyCheckIns?: DailySleepCheckIn[],
  now: Date = new Date(),
): ReportPlanView {
  const review = reviewWeeklyStructure(plan, dailyCheckIns, undefined, now);

  return {
    currentPlan: {
      wakeTime: plan.wakeTime,
      bedtimeTarget: plan.bedtimeTarget,
      sleepWindow: plan.sleepWindow,
      weekArc: buildWeekArc(plan.weekSummaries),
    },
    changeSummary:
      review.bucket === "expand" || review.bucket === "shrink"
        ? [
            {
              title: `Sleep window ${
                review.bucket === "expand" ? "expands" : "shrinks"
              } by ${Math.abs(review.proposedSleepWindowDeltaMinutes)} minutes`,
              why: review.reason,
              effectiveDate: review.effectiveDate,
              deltaMinutes: review.proposedSleepWindowDeltaMinutes,
            },
          ]
        : [],
  };
}
