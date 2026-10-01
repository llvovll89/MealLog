import type { MealRecord } from '../types';
import { getMealRecords, getProfile } from '../utils/storage';
import { dateKeyAgo } from '../utils/dates';
import { summarizeDay } from '../utils/mealNutrition';
import { useStorageRevision } from './useStorageRevision';

export interface InsightMetrics {
  weeklyAvgCalories: number; weeklyGoalHitRate: number; streakDays: number; recentActiveDays: number;
  activeDaysDelta: number; weeklyAvgDelta: number; weeklyGoalHitDelta: number; goalDistanceDelta: number;
  hasGoal: boolean; currentWeekDailyCalories: number[]; currentWeekHitFlags: number[];
  weeklyKnownDays: number; weeklyUnknownMeals: number;
}
export const calculateInsightMetrics = (records: MealRecord[], goal: number | null): InsightMetrics => {
  const hasGoal = goal !== null && goal > 0;
  const recordDates = new Set(records.map(record => record.date));
  const calcWindow = (start: number, end: number) => {
    const days = Array.from({length:start - end + 1}, (_, index) => summarizeDay(records.filter(record => record.date === dateKeyAgo(start - index))));
    const complete = days.filter(day => day.complete);
    const avgCalories = complete.length ? Math.round(complete.reduce((sum, day) => sum + day.calories, 0) / complete.length) : 0;
    const hitFlags = days.map(day => hasGoal && day.complete && Math.abs(day.calories - goal!) <= goal! * .2 ? 1 : 0);
    return { activeDays: days.filter(day => day.recorded).length, knownDays:complete.length, unknownMeals:days.reduce((sum, day) => sum + day.unknownCount, 0),
      avgCalories, hitRate:hasGoal && complete.length ? Math.round(hitFlags.reduce<number>((a,b)=>a+b,0) / complete.length * 100) : 0,
      dailyCalories:days.map(day => day.calories), hitFlags };
  };
  const current = calcWindow(6,0), previous = calcWindow(13,7);
  let streak = 0;
  while (streak < 365 && recordDates.has(dateKeyAgo(streak))) streak++;
  return { weeklyAvgCalories:current.avgCalories, weeklyGoalHitRate:current.hitRate, streakDays:streak,
    recentActiveDays:current.activeDays, activeDaysDelta:current.activeDays - previous.activeDays,
    weeklyAvgDelta:current.avgCalories - previous.avgCalories, weeklyGoalHitDelta:current.hitRate - previous.hitRate,
    goalDistanceDelta:hasGoal && current.knownDays && previous.knownDays ? Math.abs(current.avgCalories - goal!) - Math.abs(previous.avgCalories - goal!) : 0,
    hasGoal, currentWeekDailyCalories:current.dailyCalories, currentWeekHitFlags:current.hitFlags,
    weeklyKnownDays:current.knownDays, weeklyUnknownMeals:current.unknownMeals };
};
export const useInsightMetrics = (): InsightMetrics => {
  useStorageRevision();
  return calculateInsightMetrics(getMealRecords(), getProfile()?.calorieGoal ?? null);
};
