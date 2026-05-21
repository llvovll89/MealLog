import { useMemo } from 'react';
import { getMealRecords, getProfile } from '../utils/storage';
import { getAllMenuItems } from '../utils/recommendationEngine';

export interface InsightMetrics {
  weeklyAvgCalories: number;
  weeklyGoalHitRate: number;
  streakDays: number;
  recentActiveDays: number;
  activeDaysDelta: number;
  weeklyAvgDelta: number;
  weeklyGoalHitDelta: number;
  goalDistanceDelta: number;
  hasGoal: boolean;
  currentWeekDailyCalories: number[];
  currentWeekHitFlags: number[];
}

const toDateKey = (offsetFromToday: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - offsetFromToday);
  return d.toISOString().split('T')[0];
};

export const useInsightMetrics = (refreshKey?: string): InsightMetrics => {
  return useMemo(() => {
    const records = getMealRecords();
    const allMenus = getAllMenuItems();
    const goal = getProfile()?.calorieGoal ?? null;
    const menuCalories = new Map(allMenus.map((m) => [m.name, m.calories]));
    const recordDates = new Set(records.map((r) => r.date));

    const calcWindow = (startOffset: number, endOffset: number) => {
      const dateList: string[] = [];
      for (let i = startOffset; i >= endOffset; i--) {
        dateList.push(toDateKey(i));
      }

      const dailyCalories = dateList.map((date) => {
        const dayRecords = records.filter((r) => r.date === date);
        return dayRecords.reduce((sum, r) => sum + (menuCalories.get(r.menu) ?? 0), 0);
      });

      const activeDays = dailyCalories.filter((v) => v > 0).length;
      const totalCalories = dailyCalories.reduce((a, b) => a + b, 0);
      const avgCalories = activeDays > 0 ? Math.round(totalCalories / activeDays) : 0;
      const hitDays = goal
        ? dailyCalories.filter((cal) => cal > 0 && Math.abs(cal - goal) <= goal * 0.2).length
        : 0;
      const hitRate = goal && activeDays > 0 ? Math.round((hitDays / activeDays) * 100) : 0;
      const hitFlags = dailyCalories.map((cal) => {
        if (!goal || cal <= 0) return 0;
        return Math.abs(cal - goal) <= goal * 0.2 ? 1 : 0;
      });

      return {
        activeDays,
        avgCalories,
        hitRate,
        dailyCalories,
        hitFlags,
      };
    };

    const currentWeek = calcWindow(6, 0);
    const previousWeek = calcWindow(13, 7);

    const currentGoalDistance = goal ? Math.abs(currentWeek.avgCalories - goal) : null;
    const previousGoalDistance = goal ? Math.abs(previousWeek.avgCalories - goal) : null;

    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const key = toDateKey(i);
      if (recordDates.has(key)) {
        streak += 1;
      } else {
        break;
      }
    }

    return {
      weeklyAvgCalories: currentWeek.avgCalories,
      weeklyGoalHitRate: currentWeek.hitRate,
      streakDays: streak,
      recentActiveDays: currentWeek.activeDays,
      activeDaysDelta: currentWeek.activeDays - previousWeek.activeDays,
      weeklyAvgDelta: currentWeek.avgCalories - previousWeek.avgCalories,
      weeklyGoalHitDelta: currentWeek.hitRate - previousWeek.hitRate,
      goalDistanceDelta:
        currentGoalDistance != null && previousGoalDistance != null
          ? currentGoalDistance - previousGoalDistance
          : 0,
      hasGoal: goal != null,
      currentWeekDailyCalories: currentWeek.dailyCalories,
      currentWeekHitFlags: currentWeek.hitFlags,
    };
  }, [refreshKey]);
};
