import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInsightMetrics } from '../src/hooks/useInsightMetrics';
import { saveMealRecord, saveProfile } from '../src/utils/storage';

const dateKey = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

describe('useInsightMetrics', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-21T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('최근 주차 지표와 전주 대비를 계산한다', () => {
    saveProfile({
      height: 172,
      weight: 68,
      calorieGoal: 500,
    });

    const now = Date.now();

    saveMealRecord({
      id: 'today',
      date: dateKey(0),
      mealType: 'dinner',
      menu: '김치찌개',
      timestamp: now - 1_000,
    });
    saveMealRecord({
      id: 'yesterday',
      date: dateKey(1),
      mealType: 'lunch',
      menu: '비빔밥',
      timestamp: now - 24 * 60 * 60 * 1000,
    });
    saveMealRecord({
      id: 'twodays',
      date: dateKey(2),
      mealType: 'breakfast',
      menu: '샐러드',
      timestamp: now - 2 * 24 * 60 * 60 * 1000,
    });

    saveMealRecord({
      id: 'prev-week',
      date: dateKey(8),
      mealType: 'dinner',
      menu: '삼겹살',
      timestamp: now - 8 * 24 * 60 * 60 * 1000,
    });

    const { result } = renderHook(() => useInsightMetrics('report'));

    expect(result.current.recentActiveDays).toBe(3);
    expect(result.current.streakDays).toBe(3);
    expect(result.current.activeDaysDelta).toBe(2);

    expect(result.current.weeklyGoalHitRate).toBe(67);
    expect(result.current.weeklyGoalHitDelta).toBe(67);

    expect(result.current.currentWeekDailyCalories.length).toBe(7);
    expect(result.current.currentWeekHitFlags.length).toBe(7);
    expect(result.current.hasGoal).toBe(true);
  });

  it('목표 칼로리가 없으면 달성률과 hit flag를 0으로 처리한다', () => {
    const now = Date.now();

    saveMealRecord({
      id: 'record-a',
      date: dateKey(0),
      mealType: 'lunch',
      menu: '김치찌개',
      timestamp: now - 1_000,
    });

    const { result } = renderHook(() => useInsightMetrics('stats'));

    expect(result.current.hasGoal).toBe(false);
    expect(result.current.weeklyGoalHitRate).toBe(0);
    expect(result.current.currentWeekHitFlags.every((v) => v === 0)).toBe(true);
  });

  it('기록이 없으면 핵심 지표를 0으로 반환한다', () => {
    const { result } = renderHook(() => useInsightMetrics('history'));

    expect(result.current.streakDays).toBe(0);
    expect(result.current.recentActiveDays).toBe(0);
    expect(result.current.weeklyAvgCalories).toBe(0);
    expect(result.current.currentWeekDailyCalories.length).toBe(7);
    expect(result.current.currentWeekDailyCalories.every((v) => v === 0)).toBe(true);
  });
});
