export interface NotificationPrefs {
  enabled: boolean;
  breakfast: string; // "HH:MM"
  lunch: string;
  dinner: string;
}

const STORAGE_KEY = 'mealog_notifications';

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  breakfast: '08:00',
  lunch: '12:00',
  dinner: '18:00',
};

export const getNotificationPrefs = (): NotificationPrefs => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? { ...DEFAULT_PREFS, ...JSON.parse(data) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
};

export const saveNotificationPrefs = (prefs: NotificationPrefs): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
};

export type PermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export const getPermissionStatus = (): PermissionStatus => {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
};

export const requestPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

const MEAL_META: Record<string, { label: string; emoji: string; body: string }> = {
  breakfast: { label: '아침', emoji: '☀️', body: '오늘 아침은 뭐 드실 건가요? 추천 받아보세요!' },
  lunch: { label: '점심', emoji: '🌤️', body: '점심 시간이에요! 오늘 점심 메뉴를 골라보세요.' },
  dinner: { label: '저녁', emoji: '🌙', body: '저녁 시간이에요! 오늘 하루 마무리 식사를 기록해보세요.' },
};

const showNotification = async (mealType: string): Promise<void> => {
  if (Notification.permission !== 'granted') return;
  const meta = MEAL_META[mealType];
  const title = `${meta.emoji} ${meta.label} 식사 시간이에요!`;
  const options: NotificationOptions = {
    body: meta.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `meal-${mealType}`, // 같은 타입 알림은 덮어씀
  };

  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  } catch {
    new Notification(title, options);
  }
};

export const sendTestNotification = async (): Promise<void> => {
  if (Notification.permission !== 'granted') return;
  const options: NotificationOptions = {
    body: '알림이 정상적으로 작동하고 있어요!',
    icon: '/icon.svg',
    tag: 'meal-test',
  };
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification('🍱 MealLog 알림 테스트', options);
    } else {
      new Notification('🍱 MealLog 알림 테스트', options);
    }
  } catch {
    new Notification('🍱 MealLog 알림 테스트', options);
  }
};

// 등록된 타임아웃 ID를 추적해 중복 예약 방지
const scheduledTimeouts: ReturnType<typeof setTimeout>[] = [];

export const clearScheduledNotifications = (): void => {
  scheduledTimeouts.forEach(clearTimeout);
  scheduledTimeouts.length = 0;
};

/**
 * 앱이 켜져 있는 동안 오늘/내일 식사 알림을 setTimeout으로 예약합니다.
 * 앱이 꺼지면 타이머도 사라지므로, 앱을 열 때마다 재예약됩니다.
 */
export const scheduleMealNotifications = (prefs: NotificationPrefs): void => {
  clearScheduledNotifications();
  if (!prefs.enabled || Notification.permission !== 'granted') return;

  const now = new Date();

  const meals: { type: string; time: string }[] = [
    { type: 'breakfast', time: prefs.breakfast },
    { type: 'lunch', time: prefs.lunch },
    { type: 'dinner', time: prefs.dinner },
  ];

  meals.forEach(({ type, time }) => {
    const [h, m] = time.split(':').map(Number);
    const target = new Date(now);
    target.setHours(h, m, 0, 0);

    // 이미 지난 시간이면 내일로 설정
    if (target <= now) target.setDate(target.getDate() + 1);

    const delay = target.getTime() - now.getTime();
    const timeout = setTimeout(async () => {
      await showNotification(type);
      // 다음 날 재예약
      scheduleMealNotifications(getNotificationPrefs());
    }, delay);

    scheduledTimeouts.push(timeout);
  });
};
