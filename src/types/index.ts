export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface UserProfile {
  height: number; // cm
  weight: number; // kg
  name?: string;
}

export interface MealRecord {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  menu: string;
  timestamp: number;
}

export interface CustomMenu {
  id: string;
  name: string;
  category: string;
}

export interface MenuItem {
  name: string;
  category: string;
}

export type MenuCategory = '한식' | '중식' | '일식' | '양식' | '분식' | '기타';
