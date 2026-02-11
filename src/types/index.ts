export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface UserProfile {
  height: number; // cm
  weight: number; // kg
  name?: string;
  calorieGoal?: number; // daily calorie goal in kcal
  targetWeight?: number; // target weight in kg
}

export interface MealRecord {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealType;
  menu: string;
  timestamp: number;
  imageUrl?: string; // Base64 encoded image or IndexedDB reference
}

export interface WeightRecord {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // kg
  timestamp: number;
  note?: string;
}

export interface CustomMenu {
  id: string;
  name: string;
  category: string;
}

export interface MenuItem {
  name: string;
  category: string;
  calories: number; // kcal (approximate average)
}

export type MenuCategory = '한식' | '중식' | '일식' | '양식' | '분식' | '기타';
