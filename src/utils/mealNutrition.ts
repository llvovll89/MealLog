import type { MealRecord } from '../types';

export const mealCalories = (record: MealRecord): number | null => record.calories ?? null;
export const mealCategory = (record: MealRecord): string => record.category || '기타';

export const summarizeDay = (records: MealRecord[]) => ({
  recorded: records.length > 0,
  complete: records.length > 0 && records.every(record => mealCalories(record) !== null),
  calories: records.reduce((sum, record) => sum + (mealCalories(record) ?? 0), 0),
  unknownCount: records.filter(record => mealCalories(record) === null).length,
});
