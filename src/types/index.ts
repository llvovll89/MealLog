export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  height: number; // cm
  weight: number; // kg
  name?: string;
  calorieGoal?: number; // daily calorie goal in kcal
  targetWeight?: number; // target weight in kg
  gender?: Gender;
  age?: number;
  activityLevel?: ActivityLevel;
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
  calories?: number;
}

export interface MenuItem {
  name: string;
  category: string;
  calories: number; // kcal (approximate average)
}

export type MenuCategory = '한식' | '중식' | '일식' | '양식' | '분식' | '기타';
