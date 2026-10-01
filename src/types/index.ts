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
  calories?: number | null; // null: not entered; zero is a known value
  category?: string; // snapshot of the category when recorded
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
  preferences?: MenuPreference[];
  ingredientInfo?: MenuIngredientInfo;
}

export type MenuPreference = 'spicy' | 'savory' | 'sweet' | 'mild' | 'tangy' | 'rich' | 'meat' | 'seafood' | 'vegetable' | 'beef' | 'pork' | 'chicken' | 'soup' | 'crispy' | 'grilled' | 'stirfried' | 'rice' | 'noodle' | 'bread';
export type IngredientTag = 'milk' | 'egg' | 'wheat' | 'buckwheat' | 'soy' | 'peanut' | 'tree_nut' | 'sesame' | 'fish' | 'shrimp' | 'crab' | 'squid' | 'shellfish' | 'beef' | 'pork' | 'chicken' | 'duck' | 'lamb' | 'peach' | 'tomato' | 'garlic' | 'onion' | 'mushroom' | 'cilantro';
export interface MenuIngredientInfo { contains: IngredientTag[]; mayContain: IngredientTag[]; complete:boolean }
export interface DietaryRestrictions { excludedIngredients: IngredientTag[]; needsReview?: boolean }

export interface MenuItem {
  name: string;
  category: string;
  calories: number | null; // kcal (approximate average), null when unknown
  preferences?: MenuPreference[];
  ingredientInfo?: MenuIngredientInfo;
}

export type MenuCategory = '한식' | '중식' | '일식' | '양식' | '분식' | '기타';
