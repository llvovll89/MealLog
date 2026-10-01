import type { MealType, MenuItem, MenuPreference } from '../types';
import { isMenuPreference, preferenceLabel } from '../data/menuPreferences';
import type { DietaryRestrictions } from '../types';
import { matchesDietaryRestrictions } from './dietaryFilter';
import { isIngredientTag } from '../data/ingredients';
import { getDietaryRestrictions } from './storage';
import { menuDatabase } from '../data/menuDatabase';
import { getMealRecords, getCustomMenus, getProfile } from './storage';
import { formatDate, dateKeyAgo } from './dates';
export { formatDate, formatDateDisplay } from './dates';

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
    calories: m.calories ?? null,
    preferences: Array.isArray(m.preferences) ? m.preferences.filter(isMenuPreference) : [],
    ingredientInfo: m.ingredientInfo,
  }));
  return [...new Map([...menuDatabase, ...customItems].map(item => [item.name, item])).values()];
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

export const getRecentMeals = (currentMealType: MealType): string[] => {
  const records = getMealRecords();
  const today = formatDate(new Date());
  const yesterday = dateKeyAgo(1);

  const recentMenus: string[] = [];

  if (currentMealType === 'breakfast') {
    // 아침: 어제 저녁 메뉴 제외
    const yesterdayDinner = records.filter(
      r => r.date === yesterday && r.mealType === 'dinner'
    );
    if (yesterdayDinner) {
      recentMenus.push(...yesterdayDinner.map(record => record.menu));
    }
  } else if (currentMealType === 'lunch') {
    // 점심: 오늘 아침 메뉴 제외
    const todayBreakfast = records.filter(
      r => r.date === today && r.mealType === 'breakfast'
    );
    if (todayBreakfast) {
      recentMenus.push(...todayBreakfast.map(record => record.menu));
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
  category?: string,
  preferences: MenuPreference[] = [],
  restrictions: DietaryRestrictions = getDietaryRestrictions()
): RecommendationMeta[] => {
  const recentMenus = getRecentMeals(currentMealType);
  const allMenus = getAllMenuItems();
  const records = getMealRecords();
  const profile = getProfile();
  const targetPerMeal = profile?.calorieGoal ? profile.calorieGoal / 3 : null;

  const today = formatDate(new Date());
  const records14d = records.filter(r => r.date >= dateKeyAgo(13) && r.date <= today);
  const records30d = records.filter(r => r.date >= dateKeyAgo(29) && r.date <= today);

  const menuCount14d = new Map<string, number>();
  const categoryCount30d = new Map<string, number>();

  for (const r of records14d) {
    menuCount14d.set(r.menu, (menuCount14d.get(r.menu) || 0) + 1);
  }

  for (const r of records30d) {
    const menu = allMenus.find((m) => m.name === r.menu);
    const menuCategory = r.category || menu?.category || '기타';
    categoryCount30d.set(menuCategory, (categoryCount30d.get(menuCategory) || 0) + 1);
  }

  // 카테고리 필터 적용
  const filteredMenus = (category && category !== '전체')
    ? allMenus.filter(item => item.category === category)
    : allMenus;

  const maxCategoryCount = Math.max(...categoryCount30d.values(), 1);

  const scored = filteredMenus
    .filter(item=>matchesDietaryRestrictions(item,restrictions))
    .filter((item) => !recentMenus.includes(item.name))
    .filter((item) => preferences.every(preference => item.preferences?.includes(preference)))
    .map((item) => {
      const menuFrequencyPenalty = Math.min((menuCount14d.get(item.name) || 0) * 0.35, 1);
      const categoryFrequency = categoryCount30d.get(item.category) || 0;
      const preferenceScore = 1 - Math.min(categoryFrequency / maxCategoryCount, 1);

      let calorieFitScore = 0.5;
      if (targetPerMeal && item.calories !== null) {
        const diff = Math.abs(item.calories - targetPerMeal);
        calorieFitScore = Math.max(0, 1 - diff / 500);
      }

      const diversityScore = 1 - menuFrequencyPenalty;

      const timeFitScore = currentMealType === 'breakfast'
        ? (item.calories !== null && item.calories <= 550 ? 1 : 0.65)
        : currentMealType === 'lunch'
          ? (item.calories !== null && item.calories >= 450 && item.calories <= 850 ? 1 : 0.75)
          : (item.calories !== null && item.calories <= 800 ? 1 : 0.7);

      const totalScore =
        preferenceScore * 0.35 +
        calorieFitScore * 0.3 +
        diversityScore * 0.25 +
        timeFitScore * 0.1;

      const reasons: string[] = [];

      if (preferences.length) reasons.push(`${preferences.map(preferenceLabel).join(' + ')} 취향 반영`);
      if (restrictions.excludedIngredients.length) reasons.push('선택한 제외 재료 정보 대조');

      if (category && category !== '전체') {
        reasons.push(`${category} 카테고리 반영`);
      }
      if (preferenceScore >= 0.65) {
        reasons.push('최근 덜 먹은 카테고리');
      }
      if (targetPerMeal && item.calories !== null && calorieFitScore >= 0.7) {
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

export interface RecommendationOptions { excludeNames?: string[]; random?: () => number; preferences?: MenuPreference[]; restrictions?: DietaryRestrictions }
export const getRecommendedMenusWithMeta = (
  currentMealType: MealType, count = 5, category?: string, options: RecommendationOptions = {}
): RecommendationMeta[] => {
  if (count <= 0) return [];
  if(options.restrictions&&(!Array.isArray(options.restrictions.excludedIngredients)||!options.restrictions.excludedIngredients.every(isIngredientTag)))return [];
  const storedRestrictions=getDietaryRestrictions();
  const restrictions={excludedIngredients:[...new Set([...storedRestrictions.excludedIngredients,...(options.restrictions?.excludedIngredients??[])])],needsReview:storedRestrictions.needsReview||options.restrictions?.needsReview};
  const scored = buildRecommendationMeta(currentMealType, Number.MAX_SAFE_INTEGER, category, [...new Set(options.preferences ?? [])], restrictions);
  const excluded = new Set(options.excludeNames ?? []);
  const available = scored.filter(item => !excluded.has(item.name));
  const pool = available.slice(0, Math.max(count * 3, 10));
  const chosen: RecommendationMeta[] = [];
  const random = options.random ?? Math.random;
  while (pool.length && chosen.length < count) {
    const weights = pool.map(item => Math.exp(item.score * 5));
    let cursor = Math.max(0, Math.min(random(), 0.999999)) * weights.reduce((sum, weight) => sum + weight, 0);
    let index = 0;
    while (index < pool.length - 1 && (cursor -= weights[index]) >= 0) index++;
    chosen.push(pool.splice(index, 1)[0]);
  }
  return chosen;
};
export const getRecommendedMenus = (currentMealType: MealType, count = 5, category?: string): string[] =>
  getRecommendedMenusWithMeta(currentMealType, count, category).map(item => item.name);
