import type { MealRecord, UserProfile, CustomMenu } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'mealog_profile',
  MEAL_RECORDS: 'mealog_meal_records',
  CUSTOM_MENUS: 'mealog_custom_menus',
};

// 프로필 관련
export const saveProfile = (profile: UserProfile): void => {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
};

export const getProfile = (): UserProfile | null => {
  const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
  return data ? JSON.parse(data) : null;
};

// 식사 기록 관련
export const saveMealRecord = (record: MealRecord): void => {
  const records = getMealRecords();
  records.push(record);
  localStorage.setItem(STORAGE_KEYS.MEAL_RECORDS, JSON.stringify(records));
};

export const getMealRecords = (): MealRecord[] => {
  const data = localStorage.getItem(STORAGE_KEYS.MEAL_RECORDS);
  return data ? JSON.parse(data) : [];
};

export const deleteMealRecord = (id: string): void => {
  const records = getMealRecords().filter(record => record.id !== id);
  localStorage.setItem(STORAGE_KEYS.MEAL_RECORDS, JSON.stringify(records));
};

export const updateMealRecord = (id: string, updatedRecord: Partial<MealRecord>): void => {
  const records = getMealRecords().map(record =>
    record.id === id ? { ...record, ...updatedRecord } : record
  );
  localStorage.setItem(STORAGE_KEYS.MEAL_RECORDS, JSON.stringify(records));
};

export const getMealRecordsByDate = (date: string): MealRecord[] => {
  return getMealRecords().filter(record => record.date === date);
};

// 커스텀 메뉴 관련
export const saveCustomMenu = (menu: CustomMenu): void => {
  const menus = getCustomMenus();
  menus.push(menu);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_MENUS, JSON.stringify(menus));
};

export const getCustomMenus = (): CustomMenu[] => {
  const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_MENUS);
  return data ? JSON.parse(data) : [];
};

export const deleteCustomMenu = (id: string): void => {
  const menus = getCustomMenus().filter(menu => menu.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_MENUS, JSON.stringify(menus));
};

// 모든 데이터 초기화
export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  localStorage.removeItem(STORAGE_KEYS.MEAL_RECORDS);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_MENUS);
};
