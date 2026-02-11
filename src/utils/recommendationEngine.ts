import type { MealType } from '../types';
import { menuDatabase } from '../data/menuDatabase';
import { getMealRecords } from './storage';

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

export const getRecommendedMenus = (
  currentMealType: MealType,
  count: number = 5,
  category?: string
): string[] => {
  const recentMenus = getRecentMeals(currentMealType);

  // 카테고리 필터 적용
  let filteredMenus = menuDatabase;
  if (category && category !== '전체') {
    filteredMenus = menuDatabase.filter(item => item.category === category);
  }

  // 최근 메뉴 제외
  const availableMenus = filteredMenus
    .map(item => item.name)
    .filter(name => !recentMenus.includes(name));

  // 랜덤 섞기
  const shuffled = [...availableMenus].sort(() => Math.random() - 0.5);

  // 요청한 개수만큼 반환
  return shuffled.slice(0, count);
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
