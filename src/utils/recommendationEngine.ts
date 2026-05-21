import type { MealType, MenuItem } from '../types';
import { menuDatabase } from '../data/menuDatabase';
import { getMealRecords, getCustomMenus, getProfile } from './storage';

export interface RecommendationMeta {
  name: string;
  score: number;
  reasons: string[];
  preferenceScore: number;
  calorieFitScore: number;
  diversityScore: number;
  timeFitScore: number;
  menuFrequency14d: number;
  categoryFrequency30d: number;
}

export const getAllMenuItems = (): MenuItem[] => {
  const customItems = getCustomMenus().map((m) => ({
    name: m.name,
    category: m.category,
    calories: m.calories ?? 0,
  }));
  return [...menuDatabase, ...customItems];
};

export const getCurrentMealType = (): MealType => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) {
    return 'breakfast';
  } else if (hour >= 11 && hour < 16) {
    return 'lunch';
  } else {
    return 'dinner';
  }
};

export const getMealTypeLabel = (mealType: MealType): string => {
  const labels: Record<MealType, string> = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
  };
  return labels[mealType];
};

const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

const getYesterday = (): string => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

export const getRecentMeals = (currentMealType: MealType): string[] => {
  const records = getMealRecords();
  const today = getToday();
  const yesterday = getYesterday();

  const recentMenus: string[] = [];

  if (currentMealType === 'breakfast') {
    // 아침: 어제 저녁 메뉴 제외
    const yesterdayDinner = records.find(
      r => r.date === yesterday && r.mealType === 'dinner'
    );
    if (yesterdayDinner) {
      recentMenus.push(yesterdayDinner.menu);
    }
  } else if (currentMealType === 'lunch') {
    // 점심: 오늘 아침 메뉴 제외
    const todayBreakfast = records.find(
      r => r.date === today && r.mealType === 'breakfast'
    );
    if (todayBreakfast) {
      recentMenus.push(todayBreakfast.menu);
    }
  } else if (currentMealType === 'dinner') {
    // 저녁: 오늘 아침 + 점심 메뉴 제외
    const todayMeals = records.filter(
      r => r.date === today && (r.mealType === 'breakfast' || r.mealType === 'lunch')
    );
    recentMenus.push(...todayMeals.map(m => m.menu));
  }

  return recentMenus;
};

const buildRecommendationMeta = (
  currentMealType: MealType,
  count: number = 5,
  category?: string
): RecommendationMeta[] => {
  const recentMenus = getRecentMeals(currentMealType);
  const allMenus = getAllMenuItems();
  const records = getMealRecords();
  const profile = getProfile();
  const targetPerMeal = profile?.calorieGoal ? profile.calorieGoal / 3 : null;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const records14d = records.filter((r) => now - r.timestamp <= 14 * dayMs);
  const records30d = records.filter((r) => now - r.timestamp <= 30 * dayMs);

  const menuCount14d = new Map<string, number>();
  const categoryCount30d = new Map<string, number>();

  for (const r of records14d) {
    menuCount14d.set(r.menu, (menuCount14d.get(r.menu) || 0) + 1);
  }

  for (const r of records30d) {
    const menu = allMenus.find((m) => m.name === r.menu);
    const menuCategory = menu?.category || '기타';
    categoryCount30d.set(menuCategory, (categoryCount30d.get(menuCategory) || 0) + 1);
  }

  // 카테고리 필터 적용
  const filteredMenus = (category && category !== '전체')
    ? allMenus.filter(item => item.category === category)
    : allMenus;

  const maxCategoryCount = Math.max(...categoryCount30d.values(), 1);

  const scored = filteredMenus
    .filter((item) => !recentMenus.includes(item.name))
    .map((item) => {
      const menuFrequencyPenalty = Math.min((menuCount14d.get(item.name) || 0) * 0.35, 1);
      const categoryFrequency = categoryCount30d.get(item.category) || 0;
      const preferenceScore = 1 - Math.min(categoryFrequency / maxCategoryCount, 1);

      let calorieFitScore = 0.5;
      if (targetPerMeal) {
        const diff = Math.abs(item.calories - targetPerMeal);
        calorieFitScore = Math.max(0, 1 - diff / 500);
      }

      const diversityScore = 1 - menuFrequencyPenalty;

      const timeFitScore = currentMealType === 'breakfast'
        ? (item.calories <= 550 ? 1 : 0.65)
        : currentMealType === 'lunch'
          ? (item.calories >= 450 && item.calories <= 850 ? 1 : 0.75)
          : (item.calories <= 800 ? 1 : 0.7);

      const totalScore =
        preferenceScore * 0.35 +
        calorieFitScore * 0.3 +
        diversityScore * 0.25 +
        timeFitScore * 0.1;

      const reasons: string[] = [];

      if (category && category !== '전체') {
        reasons.push(`${category} 카테고리 반영`);
      }
      if (preferenceScore >= 0.65) {
        reasons.push('최근 덜 먹은 카테고리');
      }
      if (targetPerMeal && calorieFitScore >= 0.7) {
        reasons.push('목표 칼로리 근접');
      }
      if (diversityScore >= 0.7) {
        reasons.push('최근 중복 낮음');
      }
      if (timeFitScore >= 1) {
        reasons.push(`${getMealTypeLabel(currentMealType)} 시간대 적합`);
      }
      if (reasons.length === 0) {
        reasons.push('내 식사 패턴 기반 추천');
      }

      return {
        name: item.name,
        score: totalScore,
        reasons: reasons.slice(0, 2),
        preferenceScore,
        calorieFitScore,
        diversityScore,
        timeFitScore,
        menuFrequency14d: menuCount14d.get(item.name) || 0,
        categoryFrequency30d: categoryCount30d.get(item.category) || 0,
      };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, count);
};

export const getRecommendedMenusWithMeta = (
  currentMealType: MealType,
  count: number = 5,
  category?: string
): RecommendationMeta[] => {
  return buildRecommendationMeta(currentMealType, count, category);
};

export const getRecommendedMenus = (
  currentMealType: MealType,
  count: number = 5,
  category?: string
): string[] => {
  return buildRecommendationMeta(currentMealType, count, category).map((item) => item.name);
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatDateDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}년 ${month}월 ${day}일`;
};
