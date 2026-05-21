import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getRecentMeals,
  getRecommendedMenusWithMeta,
  getMealTypeLabel,
} from '../src/utils/recommendationEngine';
import { saveMealRecord, saveProfile } from '../src/utils/storage';

const dateKey = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

describe('recommendationEngine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-21T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('아침 추천에서 어제 저녁 메뉴를 제외한다', () => {
    saveMealRecord({
      id: 'record-1',
      date: dateKey(1),
      mealType: 'dinner',
      menu: '김치찌개',
      timestamp: Date.now() - 24 * 60 * 60 * 1000,
    });

    const recent = getRecentMeals('breakfast');
    expect(recent).toContain('김치찌개');

    const rec = getRecommendedMenusWithMeta('breakfast', 8);
    expect(rec.map((item) => item.name)).not.toContain('김치찌개');
  });

  it('메타 추천은 세부 점수와 이유를 포함한다', () => {
    saveProfile({
      height: 175,
      weight: 70,
      calorieGoal: 2100,
    });

    saveMealRecord({
      id: 'record-2',
      date: dateKey(0),
      mealType: 'breakfast',
      menu: '비빔밥',
      timestamp: Date.now() - 2_000,
    });

    const rec = getRecommendedMenusWithMeta('lunch', 5, '양식');
    expect(rec.length).toBeGreaterThan(0);

    const first = rec[0];
    expect(first.reasons.length).toBeGreaterThan(0);
    expect(first.reasons.some((r) => r.includes('카테고리'))).toBe(true);

    expect(first.preferenceScore).toBeGreaterThanOrEqual(0);
    expect(first.preferenceScore).toBeLessThanOrEqual(1);
    expect(first.calorieFitScore).toBeGreaterThanOrEqual(0);
    expect(first.calorieFitScore).toBeLessThanOrEqual(1);
    expect(first.diversityScore).toBeGreaterThanOrEqual(0);
    expect(first.diversityScore).toBeLessThanOrEqual(1);
    expect(first.timeFitScore).toBeGreaterThanOrEqual(0);
    expect(first.timeFitScore).toBeLessThanOrEqual(1);
  });

  it('식사 타입 라벨을 올바르게 반환한다', () => {
    expect(getMealTypeLabel('breakfast')).toBe('아침');
    expect(getMealTypeLabel('lunch')).toBe('점심');
    expect(getMealTypeLabel('dinner')).toBe('저녁');
  });
});
