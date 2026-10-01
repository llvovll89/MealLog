import type { MealRecord, UserProfile, CustomMenu, WeightRecord } from '../types';
import { menuDatabase } from '../data/menuDatabase';
import { isDateKey } from './dates';
import type { MenuPreference } from '../types';
import { isMenuPreference } from '../data/menuPreferences';
import { isIngredientInfo, isIngredientTag } from '../data/ingredients';
import type { DietaryRestrictions, MenuIngredientInfo } from '../types';

export const STORAGE_KEYS = {
  PROFILE: 'mealog_profile', MEAL_RECORDS: 'mealog_meal_records',
  CUSTOM_MENUS: 'mealog_custom_menus', WEIGHT_RECORDS: 'mealog_weight_records',
  FAVORITES: 'mealog_favorites', NOTIFICATIONS: 'mealog_notifications',
  RESTRICTIONS: 'mealog_dietary_restrictions',
};
const listeners = new Set<() => void>();
let dataOperationLocked = false;
export const assertStorageWritable = () => {
  if (dataOperationLocked) throw new Error('데이터 복원 또는 초기화가 진행 중입니다. 완료 후 다시 저장해주세요.');
};
export const lockStorageWrites = () => {
  assertStorageWritable();
  dataOperationLocked = true;
  return () => { dataOperationLocked = false; };
};
let revision = 0;
export const notifyStorageChanged = () => { revision++; listeners.forEach(listener => listener()); };
export const getStorageRevision = () => revision;
export const subscribeStorage = (listener: () => void) => {
  if (!listeners.size) window.addEventListener('storage', notifyStorageChanged);
  listeners.add(listener);
  return () => { listeners.delete(listener); if (!listeners.size) window.removeEventListener('storage', notifyStorageChanged); };
};
const read = <T>(key: string, fallback: T): T => {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; }
  catch { return fallback; }
};
const readList = <T>(key: string): T[] => {
  const data = read<unknown>(key, []);
  return Array.isArray(data) ? data : [];
};
const write = (key: string, value: unknown) => {
  assertStorageWritable();
  localStorage.setItem(key, JSON.stringify(value));
  notifyStorageChanged();
};
export const storageErrorMessage = (error: unknown): string =>
  error instanceof Error && error.message && !(error instanceof DOMException)
    ? error.message : '저장하지 못했습니다. 기기 저장 공간과 브라우저 설정을 확인해주세요.';

export const getProfile = (): UserProfile | null => {
  const profile = read<UserProfile | null>(STORAGE_KEYS.PROFILE, null);
  return profile && Number.isFinite(profile.height) && Number.isFinite(profile.weight) ? profile : null;
};
export const saveProfile = (profile: UserProfile): void => write(STORAGE_KEYS.PROFILE, profile);
export const getCustomMenus = (): CustomMenu[] => readList<CustomMenu>(STORAGE_KEYS.CUSTOM_MENUS);

export const snapshotMealRecord = (record: MealRecord): MealRecord => {
  const menu = [...getCustomMenus(), ...menuDatabase].find(item => item.name === record.menu);
  return {
    ...record,
    menu: record.menu.trim(),
    calories: Object.hasOwn(record, 'calories') ? record.calories ?? null : menu?.calories ?? null,
    category: record.category ?? menu?.category ?? '기타',
  };
};
export const getMealRecords = (): MealRecord[] => {
  const records = readList<MealRecord>(STORAGE_KEYS.MEAL_RECORDS);
  const normalized = records.map(snapshotMealRecord);
  if (!dataOperationLocked && records.some(record => !Object.hasOwn(record, 'calories') || !record.category)) {
    // Migrate legacy records once, without sending a render-time change notification.
    try { localStorage.setItem(STORAGE_KEYS.MEAL_RECORDS, JSON.stringify(normalized)); } catch { /* Still display the existing records. */ }
  }
  return normalized;
};
let cachedRecords: MealRecord[] = [];
let cachedRecordsRevision = -1;
export const getMealRecordsSnapshot = (): MealRecord[] => {
  if (cachedRecordsRevision !== revision) {
    cachedRecords = getMealRecords();
    cachedRecordsRevision = revision;
  }
  return cachedRecords;
};
export const saveMealRecord = (record: MealRecord): void => {
  if (!record.menu.trim() || !isDateKey(record.date)) throw new Error('메뉴 이름과 날짜를 확인해주세요.');
  const records = getMealRecords();
  if (records.some(item => item.id === record.id)) throw new Error('이미 저장된 기록입니다.');
  write(STORAGE_KEYS.MEAL_RECORDS, [...records, snapshotMealRecord(record)]);
};
export const deleteMealRecord = (id: string): void => write(STORAGE_KEYS.MEAL_RECORDS, getMealRecords().filter(record => record.id !== id));
export const updateMealRecord = (id: string, updatedRecord: Partial<MealRecord>): void => {
  const records = getMealRecords();
  const existing = records.find(record => record.id === id);
  if (!existing) throw new Error('수정할 기록을 찾을 수 없습니다.');
  const updated = { ...existing, ...updatedRecord, id };
  if (!updated.menu.trim() || !isDateKey(updated.date)) throw new Error('메뉴 이름과 날짜를 확인해주세요.');
  if (updated.calories != null && (!Number.isFinite(updated.calories) || updated.calories < 0)) throw new Error('칼로리는 0 이상의 숫자로 입력해주세요.');
  write(STORAGE_KEYS.MEAL_RECORDS, records.map(record => record.id === id ? snapshotMealRecord(updated) : record));
};
export const getMealRecordsByDate = (date: string) => getMealRecords().filter(record => record.date === date);

export const saveCustomMenu = (menu: CustomMenu): void => {
  if (menu.ingredientInfo !== undefined && !isIngredientInfo(menu.ingredientInfo)) throw new Error('메뉴 재료 정보를 확인해주세요.');
  if (menu.preferences !== undefined && (!Array.isArray(menu.preferences) || !menu.preferences.every(isMenuPreference))) throw new Error('메뉴 취향을 확인해주세요.');
  if ([...menuDatabase, ...getCustomMenus()].some(item => item.name === menu.name.trim())) throw new Error('같은 이름의 메뉴가 있습니다. 다른 이름으로 입력해주세요.');
  write(STORAGE_KEYS.CUSTOM_MENUS, [...getCustomMenus(), { ...menu, name: menu.name.trim(), preferences: menu.preferences ? [...new Set(menu.preferences)] : undefined }]);
};
export const deleteCustomMenu = (id: string): void => {
  // Pin legacy nutrition before the catalog entry disappears.
  const records = getMealRecords();
  localStorage.setItem(STORAGE_KEYS.MEAL_RECORDS, JSON.stringify(records));
  write(STORAGE_KEYS.CUSTOM_MENUS, getCustomMenus().filter(menu => menu.id !== id));
};
export const updateCustomMenuPreferences = (id: string, preferences: MenuPreference[]): void => {
  if (!preferences.every(isMenuPreference)) throw new Error('메뉴 취향을 확인해주세요.');
  const menus=getCustomMenus();
  if (!menus.some(menu=>menu.id===id)) throw new Error('메뉴를 찾을 수 없습니다.');
  write(STORAGE_KEYS.CUSTOM_MENUS, menus.map(menu=>menu.id===id?{...menu,preferences:[...new Set(preferences)]}:menu));
};
export const getFavorites = (): string[] => readList<string>(STORAGE_KEYS.FAVORITES);
export const updateCustomMenuIngredients=(id:string,ingredientInfo:MenuIngredientInfo|undefined):void=>{
  if(ingredientInfo!==undefined&&!isIngredientInfo(ingredientInfo))throw new Error('메뉴 재료 정보를 확인해주세요.');
  const menus=getCustomMenus();
  if(!menus.some(menu=>menu.id===id))throw new Error('메뉴를 찾을 수 없습니다.');
  write(STORAGE_KEYS.CUSTOM_MENUS,menus.map(menu=>menu.id===id?{...menu,ingredientInfo}:menu));
};
export const getDietaryRestrictions=():DietaryRestrictions=>{
  try {
    const raw=localStorage.getItem(STORAGE_KEYS.RESTRICTIONS);
    if(raw===null)return {excludedIngredients:[]};
    const data=JSON.parse(raw) as Partial<DietaryRestrictions>|null;
    if(data&&Array.isArray(data.excludedIngredients)&&data.excludedIngredients.every(isIngredientTag))return {excludedIngredients:[...new Set(data.excludedIngredients)]};
  }catch{/* Never silently remove restrictions when their stored data is unreadable. */}
  return {excludedIngredients:[],needsReview:true};
};
export const saveDietaryRestrictions=(restrictions:DietaryRestrictions):void=>{
  if(!Array.isArray(restrictions.excludedIngredients)||!restrictions.excludedIngredients.every(isIngredientTag))throw new Error('제외 재료를 확인해주세요.');
  write(STORAGE_KEYS.RESTRICTIONS,{excludedIngredients:[...new Set(restrictions.excludedIngredients)]});
};
export const toggleFavorite = (name: string): void => {
  const names = getFavorites();
  write(STORAGE_KEYS.FAVORITES, names.includes(name) ? names.filter(item => item !== name) : [...names, name]);
};
export const getWeightRecords = (): WeightRecord[] => readList<WeightRecord>(STORAGE_KEYS.WEIGHT_RECORDS);
export const saveWeightRecord = (record: WeightRecord): void => {
  if (!isDateKey(record.date) || !Number.isFinite(record.weight) || record.weight <= 0) throw new Error('날짜와 체중을 확인해주세요.');
  write(STORAGE_KEYS.WEIGHT_RECORDS, [...getWeightRecords(), record]);
};
export const deleteWeightRecord = (id: string): void => write(STORAGE_KEYS.WEIGHT_RECORDS, getWeightRecords().filter(record => record.id !== id));
export const updateWeightRecord = (id: string, update: Partial<WeightRecord>): void => write(STORAGE_KEYS.WEIGHT_RECORDS, getWeightRecords().map(record => record.id === id ? { ...record, ...update, id } : record));
