import type { CustomMenu, MealRecord, UserProfile, WeightRecord } from '../types';
import { isDateKey } from './dates';
import { menuDatabase } from '../data/menuDatabase';
import { isMenuPreference } from '../data/menuPreferences';
import { isIngredientInfo, isIngredientTag } from '../data/ingredients';
import { getDietaryRestrictions } from './storage';
import type { DietaryRestrictions } from '../types';
import { getAllImages, replaceImages, type StoredImage } from './imageStorage';
import { getProfile, getMealRecords, getWeightRecords, getCustomMenus, getFavorites, STORAGE_KEYS, notifyStorageChanged, lockStorageWrites } from './storage';
import { getNotificationPrefs, clearScheduledNotifications, scheduleMealNotifications, type NotificationPrefs } from './notificationScheduler';

export interface BackupData {
  version: 2;
  exportedAt: string;
  profile: UserProfile | null;
  mealRecords: MealRecord[];
  weightRecords: WeightRecord[];
  customMenus: CustomMenu[];
  favorites: string[];
  notifications?: NotificationPrefs;
  restrictions?: DietaryRestrictions;
}
export type ImportMode = 'merge' | 'replace';
const fail = (): never => { throw new Error('백업 파일의 형식이나 값이 올바르지 않습니다. MealLog에서 내보낸 파일을 선택해주세요.'); };
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : fail();
const text = (value: unknown, max = 200): string => typeof value === 'string' && value.trim().length > 0 && value.length <= max ? value.trim() : fail();
const number = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fail();
const date = (value: unknown): string => isDateKey(value) ? value : fail();
const optionalNumber = (value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number | undefined => value == null ? undefined : number(value, min, max);
const list = <T>(value: unknown, parse: (item: unknown) => T): T[] => Array.isArray(value) ? value.map(parse) : fail();
const uniqueIds = <T extends {id: string}>(items: T[]): T[] => new Set(items.map(item => item.id)).size === items.length ? items : fail();
const isImage = (url: string) => /^data:image\/(?:png|jpeg|jpg|webp|gif|avif|heic|heif|bmp);base64,[A-Za-z0-9+/]+={0,2}$/.test(url) && url.length <= 8_000_000;

export const validateBackup = (value: unknown): BackupData => {
  const data = object(value);
  if (data.version !== undefined && data.version !== 2) fail();
  // Legacy exports had no version and always contained these collections.
  const customMenus = uniqueIds(list(data.customMenus, value => {
    const menu = object(value);
    const preferences = menu.preferences == null ? undefined : [...new Set(list(menu.preferences, value => isMenuPreference(value) ? value : fail()))];
    const ingredientInfo=menu.ingredientInfo==null?undefined:(()=>{
      const info=menu.ingredientInfo;
      if(!isIngredientInfo(info))return fail();
      return {contains:[...new Set(info.contains)],mayContain:[...new Set(info.mayContain)],complete:info.complete};
    })();
    return { id: text(menu.id), name: text(menu.name), category: text(menu.category), calories: optionalNumber(menu.calories, 0, 100000), preferences, ingredientInfo };
  }));
  if (new Set(customMenus.map(menu => menu.name)).size !== customMenus.length) fail();
  const catalog = [...customMenus, ...menuDatabase];
  const mealRecords = uniqueIds(list(data.mealRecords, value => {
    const record = object(value);
    if (!['breakfast', 'lunch', 'dinner'].includes(String(record.mealType))) fail();
    const menu = text(record.menu);
    const details = catalog.find(item => item.name === menu);
    let imageUrl: string | undefined;
    if (record.imageUrl != null) {
      if (typeof record.imageUrl !== 'string') return fail();
      imageUrl = record.imageUrl;
      if (!isImage(imageUrl) && !/^idb:[^\s]+$/.test(imageUrl)) fail();
    }
    return { id: text(record.id), date: date(record.date), mealType: record.mealType as MealRecord['mealType'], menu,
      timestamp: number(record.timestamp), imageUrl,
      calories: Object.hasOwn(record, 'calories') ? record.calories == null ? null : number(record.calories, 0, 100000) : details?.calories ?? null,
      category: record.category == null ? details?.category ?? '기타' : text(record.category) };
  }));
  const weightRecords = uniqueIds(list(data.weightRecords, value => {
    const record = object(value);
    return { id: text(record.id), date: date(record.date), weight: number(record.weight, .01, 1000), timestamp: number(record.timestamp), note: record.note == null ? undefined : text(record.note, 1000) };
  }));
  let profile: UserProfile | null = null;
  if (data.profile != null) {
    const p = object(data.profile);
    if (p.gender != null && !['male', 'female'].includes(String(p.gender))) fail();
    if (p.activityLevel != null && !['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(String(p.activityLevel))) fail();
    profile = { height: number(p.height, 0, 300), weight: number(p.weight, 0, 1000),
      name: p.name == null ? undefined : text(p.name), calorieGoal: optionalNumber(p.calorieGoal, 1, 100000),
      targetWeight: optionalNumber(p.targetWeight, .01, 1000), age: optionalNumber(p.age, 1, 130),
      gender: p.gender as UserProfile['gender'], activityLevel: p.activityLevel as UserProfile['activityLevel'] };
  }
  let notifications: NotificationPrefs | undefined;
  if (data.notifications != null) {
    const prefs = object(data.notifications);
    if (typeof prefs.enabled !== 'boolean') return fail();
    const time = (value: unknown) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : fail();
    notifications = { enabled: prefs.enabled, breakfast: time(prefs.breakfast), lunch: time(prefs.lunch), dinner: time(prefs.dinner) };
  }
  const restrictions=data.restrictions==null?undefined:(()=>{const value=object(data.restrictions);if(value.needsReview)fail();return {excludedIngredients:[...new Set(list(value.excludedIngredients,tag=>isIngredientTag(tag)?tag:fail()))]};})();
  return { version: 2, exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '', profile, mealRecords, weightRecords, customMenus, restrictions,
    favorites: data.favorites == null ? [] : [...new Set(list(data.favorites, value => text(value)))], notifications };
};

export const exportAllData = async (): Promise<BackupData> => {
  const restrictions=getDietaryRestrictions();
  if(restrictions.needsReview)throw new Error('저장된 제외 재료를 읽지 못했습니다. 추천 화면에서 제외 조건을 다시 확인해주세요.');
  const images = new Map((await getAllImages()).map(image => [image.id, image.dataUrl]));
  const mealRecords = getMealRecords().map(record => {
    if (!record.imageUrl?.startsWith('idb:')) return record;
    const imageUrl = images.get(record.imageUrl.slice(4));
    if (!imageUrl) throw new Error('사진을 찾을 수 없는 기록이 있습니다. 해당 기록의 사진을 확인한 뒤 다시 내보내주세요.');
    return { ...record, imageUrl };
  });
  return { version: 2, exportedAt: new Date().toISOString(), profile: getProfile(), mealRecords, weightRecords: getWeightRecords(), customMenus: getCustomMenus(), favorites: getFavorites(), notifications: getNotificationPrefs(), restrictions };
};

const ownedKeys = () => Array.from({length: localStorage.length}, (_, index) => localStorage.key(index)!).filter(key => key.startsWith('mealog_'));
let busy = false;
const commit = async (values: Map<string, string | null>, images: StoredImage[]): Promise<void> => {
  if (busy) throw new Error('데이터 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.');
  busy = true;
  let release: (() => void) | undefined;
  const before = new Map<string, string | null>();
  let previousImages: StoredImage[] = [];
  let wroteImages = false;
  try {
    release = lockStorageWrites();
    for (const key of values.keys()) before.set(key, localStorage.getItem(key));
    previousImages = await getAllImages();
    await replaceImages(images);
    wroteImages = true;
    for (const [key, value] of values) {
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
    }
  } catch (error) {
    for (const [key, value] of before) {
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
    }
    if (wroteImages) await replaceImages(previousImages);
    throw error;
  } finally { release?.(); busy = false; }
  notifyStorageChanged();
};

export const importAllData = async (input: unknown, mode: ImportMode): Promise<{missingPhotos: number}> => {
  const data = validateBackup(input); // Complete validation before writing anything.
  const previous = await getAllImages();
  const imageMap = new Map(previous.map(image => [image.id, image.dataUrl]));
  let missingPhotos = 0;
  const records = data.mealRecords.map(record => {
    if (!record.imageUrl) return record;
    let url = record.imageUrl;
    if (url.startsWith('idb:')) {
      const existing = imageMap.get(url.slice(4));
      if (!existing) { missingPhotos++; return { ...record, imageUrl: undefined }; }
      url = existing;
    }
    const id = crypto.randomUUID();
    imageMap.set(id, url);
    return { ...record, imageUrl: `idb:${id}` };
  });
  // In merge mode, existing records with the same ID win; they were reviewed on this device.
  const merge = <T extends {id: string}>(existing: T[], incoming: T[]): T[] => [...new Map([...incoming, ...existing].map(item => [item.id, item])).values()];
  const meals = mode === 'merge' ? merge(getMealRecords(), records) : records;
  const weights = mode === 'merge' ? merge(getWeightRecords(), data.weightRecords) : data.weightRecords;
  const existingMenus = getCustomMenus();
  const menus = mode === 'merge' ? [...existingMenus, ...data.customMenus.filter(menu =>
    !existingMenus.some(existing => existing.id === menu.id || existing.name === menu.name))] : data.customMenus;
  const favorites = mode === 'merge' ? [...new Set([...getFavorites(), ...data.favorites])] : data.favorites;
  const profile = mode === 'merge' ? getProfile() ?? data.profile : data.profile;
  const notifications = mode === 'merge' ? getNotificationPrefs() : data.notifications ?? {enabled:false,breakfast:'08:00',lunch:'12:00',dinner:'18:00'};
  const currentRestrictions=getDietaryRestrictions();
  if(currentRestrictions.needsReview&&(mode==='merge'||!data.restrictions))throw new Error('기존 제외 재료를 먼저 확인해주세요. 제외 설정을 읽지 못해 가져오기를 중단했습니다.');
  const restrictions=mode==='merge'?{excludedIngredients:[...new Set([...currentRestrictions.excludedIngredients,...(data.restrictions?.excludedIngredients??[])])]}:data.restrictions??currentRestrictions;
  const needed = new Set(meals.filter(record => record.imageUrl?.startsWith('idb:')).map(record => record.imageUrl!.slice(4)));
  const images = [...imageMap].filter(([id]) => needed.has(id)).map(([id, dataUrl]) => ({id, dataUrl}));
  const values = new Map<string, string | null>([
    [STORAGE_KEYS.PROFILE, profile ? JSON.stringify(profile) : null], [STORAGE_KEYS.MEAL_RECORDS, JSON.stringify(meals)],
    [STORAGE_KEYS.WEIGHT_RECORDS, JSON.stringify(weights)], [STORAGE_KEYS.CUSTOM_MENUS, JSON.stringify(menus)],
    [STORAGE_KEYS.FAVORITES, JSON.stringify(favorites)], [STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications)],
    [STORAGE_KEYS.RESTRICTIONS,JSON.stringify(restrictions)],
  ]);
  await commit(values, images);
  clearScheduledNotifications();
  scheduleMealNotifications(notifications);
  return {missingPhotos};
};

export const clearAllData = async (): Promise<void> => {
  await commit(new Map(ownedKeys().map(key => [key, null])), []);
  clearScheduledNotifications();
};
