import { useState, useMemo, useRef } from 'react';
import type { Gender, ActivityLevel, MenuPreference } from '../types';
import MenuPreferencePicker from './MenuPreferencePicker';
import MenuIngredientEditor from './MenuIngredientEditor';
import type { MenuIngredientInfo } from '../types';
import { preferenceLabel } from '../data/menuPreferences';
import {
  getProfile,
  saveProfile,
  getCustomMenus,
  saveCustomMenu,
  deleteCustomMenu,
  updateCustomMenuPreferences,
  updateCustomMenuIngredients,
  storageErrorMessage,
} from '../utils/storage';
import { clearAllData, exportAllData, importAllData, validateBackup, type BackupData, type ImportMode } from '../utils/backup';
import { formatDate } from '../utils/dates';
import { useStorageRevision } from '../hooks/useStorageRevision';
import { calculateBMI } from '../utils/bmiCalculator';
import { useToast } from '../hooks/useToast';
import {
  type NotificationPrefs,
  getNotificationPrefs,
  saveNotificationPrefs,
  getPermissionStatus,
  requestPermission,
  scheduleMealNotifications,
  sendTestNotification,
  clearScheduledNotifications,
} from '../utils/notificationScheduler';

const CATEGORIES = ['한식', '중식', '일식', '양식', '분식', '기타'];

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: '거의 운동 안 함',
  light: '가벼운 운동 (주 1-3회)',
  moderate: '보통 운동 (주 3-5회)',
  active: '활발한 운동 (주 6-7회)',
  very_active: '매우 활발 (운동선수 수준)',
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const inputClass = "w-full px-4 py-2.5 border border-[#d8e6f0] bg-white rounded-xl focus:border-[#3974a6] focus:ring-2 focus:ring-[#3974a6]/15 focus:outline-none transition-all text-sm";

const ProfileSetting = () => {
  const toast = useToast();
  useStorageRevision();
  const [initialProfile] = useState(getProfile);
  const [dataBusy, setDataBusy] = useState(false);
  const dataBusyRef = useRef(false);
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);

  const [name, setName] = useState(initialProfile?.name ?? '');
  const [height, setHeight] = useState(initialProfile?.height?.toString() ?? '');
  const [weight, setWeight] = useState(initialProfile?.weight?.toString() ?? '');
  const [targetWeight, setTargetWeight] = useState(initialProfile?.targetWeight?.toString() ?? '');
  const [gender, setGender] = useState<Gender | ''>(initialProfile?.gender ?? '');
  const [age, setAge] = useState(initialProfile?.age?.toString() ?? '');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(initialProfile?.activityLevel ?? 'moderate');
  const [calorieGoal, setCalorieGoal] = useState(initialProfile?.calorieGoal?.toString() ?? '');

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(getNotificationPrefs);
  const [permStatus, setPermStatus] = useState(getPermissionStatus);

  const customMenus = getCustomMenus();
  const [menuName, setMenuName] = useState('');
  const [menuCategory, setMenuCategory] = useState('한식');
  const [menuCalories, setMenuCalories] = useState('');
  const [menuPreferences, setMenuPreferences] = useState<MenuPreference[]>([]);
  const [menuIngredientInfo,setMenuIngredientInfo]=useState<MenuIngredientInfo|undefined>();
  const [confirmDeleteMenuId, setConfirmDeleteMenuId] = useState<string | null>(null);

  const [confirmClear, setConfirmClear] = useState(false);

  const refreshForm = () => {
    const profile = getProfile();
    setName(profile?.name ?? ''); setHeight(profile?.height?.toString() ?? ''); setWeight(profile?.weight?.toString() ?? '');
    setTargetWeight(profile?.targetWeight?.toString() ?? ''); setGender(profile?.gender ?? ''); setAge(profile?.age?.toString() ?? '');
    setActivityLevel(profile?.activityLevel ?? 'moderate'); setCalorieGoal(profile?.calorieGoal?.toString() ?? '');
    setNotifPrefs(getNotificationPrefs()); setPermStatus(getPermissionStatus());
  };

  const suggestedCalories = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const tw = parseFloat(targetWeight);
    const a = parseFloat(age);
    if (!h || !w || !a || !gender || h <= 0 || w <= 0 || a <= 0) return null;

    const bmr =
      gender === 'male'
        ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
        : 447.593 + 9.247 * w + 3.098 * h - 4.330 * a;

    let tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];

    if (tw && tw > 0) {
      if (tw < w) tdee -= 500;
      else if (tw > w) tdee += 500;
    }

    return Math.round(tdee);
  }, [height, weight, targetWeight, gender, age, activityLevel]);

  const handleToggleNotification = async () => {
    try {
    if (!notifPrefs.enabled) {
      const granted = await requestPermission();
      setPermStatus(getPermissionStatus());
      if (!granted) {
        toast.error('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
        return;
      }
      const updated = { ...notifPrefs, enabled: true };
      saveNotificationPrefs(updated);
      setNotifPrefs(updated);
      scheduleMealNotifications(updated);
      toast.success('알림이 활성화되었습니다!');
    } else {
      const updated = { ...notifPrefs, enabled: false };
      saveNotificationPrefs(updated);
      setNotifPrefs(updated);
      clearScheduledNotifications();
      toast.info('알림이 비활성화되었습니다.');
    }
    } catch (error) { toast.error(storageErrorMessage(error)); }
  };

  const handleTimeChange = (meal: keyof Pick<NotificationPrefs, 'breakfast' | 'lunch' | 'dinner'>, value: string) => {
    const updated = { ...notifPrefs, [meal]: value };
    try {
      saveNotificationPrefs(updated);
      setNotifPrefs(updated);
      if (updated.enabled) scheduleMealNotifications(updated);
    } catch (error) { toast.error(storageErrorMessage(error)); }
  };

  const handleTestNotification = async () => {
    const granted = await requestPermission();
    setPermStatus(getPermissionStatus());
    if (!granted) {
      toast.error('알림 권한이 없습니다.');
      return;
    }
    await sendTestNotification();
    toast.success('테스트 알림을 전송했습니다!');
  };

  const handleSave = () => {
    const h = Number(height), w = Number(weight);
    const goal = calorieGoal.trim() ? Number(calorieGoal) : undefined;
    const target = targetWeight.trim() ? Number(targetWeight) : undefined;
    const ageValue = age.trim() ? Number(age) : undefined;
    if (!height.trim() || !weight.trim() || !Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || h > 300 || w <= 0 || w > 1000) { toast.warning('키와 몸무게를 확인해주세요.'); return; }
    if ((goal !== undefined && (!Number.isFinite(goal) || goal <= 0 || goal > 100000)) || (target !== undefined && (!Number.isFinite(target) || target <= 0 || target > 1000)) || (ageValue !== undefined && (!Number.isInteger(ageValue) || ageValue <= 0 || ageValue > 130))) { toast.warning('목표 칼로리, 목표 체중과 나이를 확인해주세요.'); return; }
    try {
      saveProfile({ ...getProfile(), height:h, weight:w, name:name.trim() || undefined, targetWeight:target, gender:gender || undefined, age:ageValue, activityLevel, calorieGoal:goal });
      toast.success('프로필이 저장되었습니다.');
    } catch (error) { toast.error(storageErrorMessage(error)); }
  };
  const handleAddMenu = () => {
    const cal = menuCalories.trim() ? Number(menuCalories) : undefined;
    if (!menuName.trim()) { toast.warning('메뉴 이름을 입력해주세요.'); return; }
    if (cal !== undefined && (!Number.isFinite(cal) || cal < 0 || cal > 100000)) { toast.warning('칼로리는 0 이상의 숫자로 입력해주세요.'); return; }
    try {
      saveCustomMenu({ id:crypto.randomUUID(), name:menuName.trim(), category:menuCategory, calories:cal, preferences:menuPreferences,ingredientInfo:menuIngredientInfo });
      setMenuName(''); setMenuCalories(''); setMenuCategory('한식'); setMenuPreferences([]);setMenuIngredientInfo(undefined);
      toast.success('메뉴가 추가되었습니다.');
    } catch (error) { toast.error(storageErrorMessage(error)); }
  };
  const handleDeleteMenu = (id: string) => {
    try { deleteCustomMenu(id); setConfirmDeleteMenuId(null); toast.success('메뉴가 삭제되었습니다. 기존 식사 기록은 유지됩니다.'); }
    catch (error) { toast.error(storageErrorMessage(error)); }
  };
  const handleMenuPreferences = (id: string, preferences: MenuPreference[]) => {
    try { updateCustomMenuPreferences(id, preferences); }
    catch(error) { toast.error(storageErrorMessage(error)); }
  };
  const handleMenuIngredients=(id:string,ingredientInfo:MenuIngredientInfo|undefined)=>{
    try{updateCustomMenuIngredients(id,ingredientInfo);}catch(error){toast.error(storageErrorMessage(error));}
  };
  const runDataTask = async (task: () => Promise<void>) => {
    if (dataBusyRef.current) return;
    dataBusyRef.current = true; setDataBusy(true);
    try { await task(); } catch (error) { toast.error(storageErrorMessage(error)); }
    finally { dataBusyRef.current = false; setDataBusy(false); }
  };
  const handleClearData = () => runDataTask(async () => {
    await clearAllData(); refreshForm(); setConfirmClear(false); setPendingBackup(null);
    toast.info('사진과 설정을 포함한 모든 데이터가 삭제되었습니다.');
  });
  const handleExport = () => runDataTask(async () => {
    const data = await exportAllData();
    const url = URL.createObjectURL(new Blob([JSON.stringify(data)], {type:'application/json'}));
    const link = document.createElement('a'); link.href=url; link.download='meallog_backup_' + formatDate(new Date()) + '.json';
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success('사진을 포함한 백업 파일을 내보냈습니다.');
  });
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value='';
    if (!file) return;
    void runDataTask(async () => {
      const data = validateBackup(JSON.parse(await file.text()));
      setPendingBackup(data);
    });
  };
  const confirmImport = (mode: ImportMode) => runDataTask(async () => {
    if (!pendingBackup) return;
    const {missingPhotos} = await importAllData(pendingBackup, mode);
    refreshForm(); setPendingBackup(null);
    toast.success('백업을 복원했습니다. 변경 내용이 바로 반영됩니다.');
    if (missingPhotos) toast.warning('이전 형식의 백업에 사진 파일이 없어 ' + missingPhotos + '건은 텍스트만 복원했습니다.');
  });

  const bmiInfo = (() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    return h > 0 && w > 0 ? calculateBMI(h, w) : null;
  })();

  return (
    <div className="page-content space-y-3 ">
      {/* ─── 프로필 ─── */}
      <div className="page-section">
        <div className="page-heading">
          <p className="text-[13px] font-semibold text-[#586b7a] mb-1">설정</p>
          <div className="flex items-center justify-between">
            <h2 className="text-[24px] font-black text-[#263f56] tracking-tight leading-tight">프로필 설정</h2>
            <span className="text-3xl ">⚙️</span>
          </div>
        </div>

        <div className="space-y-4 content-surface profile-form">
          <div>
            <label htmlFor="profilesetting-field-1" className="block text-xs font-semibold text-[#586b7a] mb-1.5">이름 (선택)</label>
            <input id="profilesetting-field-1" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" className={inputClass} />
          </div>

          <div>
            <label htmlFor="profilesetting-field-2" className="block text-xs font-semibold text-[#586b7a] mb-1.5">키 (cm)</label>
            <input id="profilesetting-field-2" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" className={inputClass} />
          </div>

          <div>
            <label htmlFor="profilesetting-field-3" className="block text-xs font-semibold text-[#586b7a] mb-1.5">몸무게 (kg)</label>
            <input id="profilesetting-field-3" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65" className={inputClass} />
          </div>

          <div>
            <label htmlFor="profilesetting-field-4" className="block text-xs font-semibold text-[#586b7a] mb-1.5">목표 체중 (kg, 선택)</label>
            <input id="profilesetting-field-4" type="number" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="60" className={inputClass} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#586b7a] mb-1.5">성별</label>
            <div className="flex gap-3">
              {([['male', '남성'], ['female', '여성']] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  aria-pressed={gender === val}
                  onClick={() => setGender(val)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${gender === val
                      ? 'bg-[#3974a6] text-white border-[#3974a6] shadow-none'
                      : 'bg-white text-[#586b7a] border-[#d8e6f0] hover:border-[#7ba6c6]'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="profilesetting-field-5" className="block text-xs font-semibold text-[#586b7a] mb-1.5">나이 (세)</label>
            <input id="profilesetting-field-5" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" className={inputClass} />
          </div>

          <div>
            <label htmlFor="profilesetting-field-6" className="block text-xs font-semibold text-[#586b7a] mb-1.5">활동량</label>
            <select
id="profilesetting-field-6"               value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
              className="w-full px-4 py-2.5 border border-[#d8e6f0] bg-white rounded-xl focus:border-[#3974a6] focus:ring-2 focus:ring-[#3974a6]/15 focus:outline-none transition-all text-sm"
            >
              {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {bmiInfo && (
            <div className="bg-[#e8f2fa] rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#586b7a] mb-1">현재 BMI 지수</p>
                  <p className="text-2xl font-bold text-[#263f56]">{bmiInfo.bmi}</p>
                  <p className={`text-sm font-semibold ${bmiInfo.color}`}>{bmiInfo.category}</p>
                </div>
                <div className="text-4xl">⚖️</div>
              </div>
            </div>
          )}

          {suggestedCalories && (
            <div className="bg-[#e8f2fa] rounded-2xl p-4">
              <p className="text-xs text-[#586b7a] mb-1">Harris-Benedict 자동 계산 권장 칼로리</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-[#263f56]">{suggestedCalories.toLocaleString()} kcal</p>
                  <p className="text-xs text-[#3974a6] mt-0.5">
                    {parseFloat(targetWeight) > 0 && parseFloat(targetWeight) < parseFloat(weight)
                      ? '감량 목표 (-500 kcal 적용)'
                      : parseFloat(targetWeight) > 0 && parseFloat(targetWeight) > parseFloat(weight)
                        ? '증량 목표 (+500 kcal 적용)'
                        : '유지 칼로리'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCalorieGoal(suggestedCalories.toString())}
                  className="px-4 py-2 bg-[#3974a6] text-white text-xs font-bold rounded-xl hover:bg-[#2e6391] transition-colors"
                >
                  적용
                </button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="profilesetting-field-7" className="block text-xs font-semibold text-[#586b7a] mb-1.5">
              하루 칼로리 목표 (kcal, 선택)
            </label>
            <input id="profilesetting-field-7" type="number" value={calorieGoal} onChange={(e) => setCalorieGoal(e.target.value)} placeholder="2000" className={inputClass} />
            <p className="text-[12px] text-[#586b7a] mt-1 ml-1">
              입력 시 히스토리에서 일일 칼로리 섭취량을 추적할 수 있어요
            </p>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-[#3974a6] text-white font-semibold text-base rounded-2xl hover:bg-[#2e6391] active:bg-[#263f56] transition-colors duration-150 shadow-none"
          >
            프로필 저장
          </button>
        </div>
      </div>

      {/* ─── 알림 설정 ─── */}
      <div className="content-surface">
        <div className="text-center mb-5">
          <span className="text-3xl  inline-block">🔔</span>
          <h2 className="text-xl font-bold text-[#263f56] mt-2 mb-1 tracking-tight">식사 알림</h2>
          <p className="text-xs text-[#586b7a]">앱이 열려 있는 동안 식사 시간을 알려드려요</p>
        </div>

        {permStatus === 'unsupported' ? (
          <div className="bg-apple-bg border border-apple-border-light rounded-xl p-4 text-center">
            <p className="text-sm text-apple-secondary">이 브라우저에서는 알림을 지원하지 않습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {permStatus === 'denied' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                알림이 차단되었습니다. 브라우저 주소창 옆 자물쇠 아이콘에서 알림을 허용해주세요.
              </div>
            )}

            <div className="flex items-center justify-between bg-apple-bg border border-apple-border-light rounded-xl p-4">
              <div>
                <p className="text-sm font-semibold text-apple-text">식사 알림</p>
                <p className="text-xs text-apple-secondary mt-0.5">
                  {notifPrefs.enabled ? '알림이 켜져 있어요' : '알림이 꺼져 있어요'}
                </p>
              </div>
              <button
                role="switch" aria-checked={notifPrefs.enabled} aria-label="식사 알림"
                onClick={handleToggleNotification}
                disabled={permStatus === 'denied'}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50 ${notifPrefs.enabled ? 'bg-brand-500' : 'bg-gray-200'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${notifPrefs.enabled ? 'translate-x-6' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {notifPrefs.enabled && permStatus === 'granted' && (
              <div className="bg-apple-bg border border-apple-border-light rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-apple-secondary mb-2">알림 시간 설정</p>
                {(
                  [
                    { key: 'breakfast', label: '☀️ 아침' },
                    { key: 'lunch', label: '🌤️ 점심' },
                    { key: 'dinner', label: '🌙 저녁' },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-apple-text">{label}</span>
                    <input
                      aria-label={`${label} 알림 시간`}
                      type="time"
                      value={notifPrefs[key]}
                      onChange={(e) => handleTimeChange(key, e.target.value)}
                      className="px-3 py-1.5 border border-apple-border bg-white rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleTestNotification}
              disabled={permStatus === 'denied'}
              className="w-full py-2.5 bg-apple-bg border border-apple-border-light text-apple-secondary font-semibold rounded-lg hover:bg-gray-200 transition-all text-sm disabled:opacity-50"
            >
              🔔 테스트 알림 보내기
            </button>
          </div>
        )}
      </div>

      {/* ─── 나만의 메뉴 ─── */}
      <div className="content-surface">
        <div className="text-center mb-5">
          <span className="text-3xl  inline-block">🍳</span>
          <h2 className="text-xl font-bold text-[#263f56] mt-2 mb-1 tracking-tight">나만의 메뉴</h2>
          <p className="text-xs text-[#586b7a]">추가한 메뉴는 추천·기록에 자동으로 포함됩니다</p>
        </div>

        <div className="bg-apple-bg border border-apple-border-light rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label htmlFor="profilesetting-field-8" className="block text-xs font-semibold text-apple-secondary mb-1.5">메뉴 이름</label>
            <input id="profilesetting-field-8" type="text" value={menuName} onChange={(e) => setMenuName(e.target.value)} placeholder="예: 엄마표 된장찌개" className={inputClass} />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="profilesetting-field-9" className="block text-xs font-semibold text-apple-secondary mb-1.5">카테고리</label>
              <select
id="profilesetting-field-9"                 value={menuCategory}
                onChange={(e) => setMenuCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-apple-border bg-white rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="profilesetting-field-10" className="block text-xs font-semibold text-apple-secondary mb-1.5">칼로리 (선택)</label>
              <input
id="profilesetting-field-10"                 type="number"
                value={menuCalories}
                onChange={(e) => setMenuCalories(e.target.value)}
                placeholder="450"
                className="w-full px-3 py-2.5 border border-apple-border bg-white rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-apple-secondary">취향 태그 (선택) · 취향 추천에 사용돼요.</p>
            <MenuPreferencePicker compact value={menuPreferences} onChange={setMenuPreferences}/>
          </div>
          <details><summary className="cursor-pointer font-semibold py-2">알레르기·제외 조건용 재료 정보</summary><div className="pt-3"><MenuIngredientEditor value={menuIngredientInfo} onChange={setMenuIngredientInfo}/></div></details>
          <button
            onClick={handleAddMenu}
            className="w-full py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 transition-colors text-sm"
          >
            + 메뉴 추가
          </button>
        </div>

        {customMenus.length === 0 ? (
          <div className="text-center py-6 text-apple-secondary">
            <p className="text-sm">아직 추가된 메뉴가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customMenus.map((menu) => (
              <div
                key={menu.id}
                className="flex items-start justify-between gap-3 bg-apple-bg border border-apple-border-light rounded-xl px-4 py-3 hover:border-brand-300 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-apple-text break-words">{menu.name}</p>
                  <p className="text-xs text-brand-500">
                    {menu.category}
                    {menu.calories != null ? ` · ${menu.calories}kcal` : ' · 칼로리 미입력'}
                  </p>
                  <details className="mt-2">
                    <summary className="text-sm text-app-primary cursor-pointer py-2">맛·재료 태그 수정</summary>
                    <div className="mt-2"><MenuPreferencePicker value={menu.preferences??[]} onChange={value=>handleMenuPreferences(menu.id,value)}/></div>
                    <p className="text-xs text-apple-secondary mt-2">{menu.preferences?.length ? menu.preferences.map(preferenceLabel).join(', ') : '선택한 태그가 없어요.'} · 변경 시 자동 저장</p>
                  </details>
                  <details className="mt-2"><summary className="text-sm cursor-pointer py-2">포함·포함 가능 재료 수정</summary><div className="pt-3"><MenuIngredientEditor value={menu.ingredientInfo} onChange={value=>handleMenuIngredients(menu.id,value)}/></div><p className="text-xs text-apple-secondary mt-2">변경 시 자동 저장 · 제외 조건에 사용됩니다.</p></details>
                </div>
                {confirmDeleteMenuId === menu.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => handleDeleteMenu(menu.id)} className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-all">
                      삭제
                    </button>
                    <button onClick={() => setConfirmDeleteMenuId(null)} className="px-2 py-1 bg-gray-100 text-apple-secondary rounded-lg text-xs font-medium hover:bg-gray-200 transition-all">
                      취소
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteMenuId(menu.id)} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-all">
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── 데이터 관리 ─── */}
      <div className="content-surface">
        <div className="text-center mb-5">
          <span className="text-3xl  inline-block">🗂️</span>
          <h2 className="text-xl font-bold text-[#263f56] mt-2 mb-1 tracking-tight">데이터 관리</h2>
        </div>

        <fieldset disabled={dataBusy} className="space-y-3 disabled:opacity-60">
          <button
            onClick={handleExport}
            className="w-full py-3 bg-[#3974a6] text-white font-semibold rounded-lg hover:bg-[#2e6391] transition-colors text-sm"
          >
            사진 포함 백업 내보내기
          </button>

          <label className="block w-full py-3 bg-apple-bg text-apple-secondary font-semibold rounded-lg hover:bg-gray-200 border border-apple-border-light transition-all text-sm text-center cursor-pointer">
            백업 파일 가져오기
            <input type="file" accept=".json" onChange={handleImport} className="sr-only" />
          </label>

          {dataBusy && <p role="status" className="text-sm text-apple-secondary">데이터를 처리하고 있어요.</p>}
          {pendingBackup && <div className="bg-apple-bg rounded-2xl p-4 space-y-3">
            <p className="font-semibold">식사 {pendingBackup.mealRecords.length}건, 체중 {pendingBackup.weightRecords.length}건을 가져옵니다.</p>
            <p className="text-sm text-apple-secondary">합치기는 기존 기록과 프로필을 유지하고 새 기록을 추가합니다. 같은 ID의 기록은 중복으로 추가하지 않습니다. 제외 재료는 두 설정을 합칩니다. 교체하기는 현재 데이터를 백업 내용으로 바꾸며, 백업에 제외 설정이 있으면 그것으로 교체합니다. 제외 설정이 없는 이전 백업은 현재 제외 설정을 유지합니다.</p>
            {pendingBackup.mealRecords.some(record => record.imageUrl?.startsWith('idb:')) && <p className="text-sm text-amber-700">이전 형식의 백업입니다. 이 기기에 없는 사진은 복원할 수 없습니다.</p>}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => confirmImport('merge')} className="btn-primary px-4 py-3">합치기</button>
              <button onClick={() => confirmImport('replace')} className="bg-white rounded-xl px-4 py-3 text-red-600">교체하기</button>
              <button onClick={() => setPendingBackup(null)} className="px-4 py-3">취소</button>
            </div>
          </div>}
          {confirmClear ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-600 mb-3 text-center">
                정말로 모든 데이터를 삭제하시겠습니까?<br />
                <span className="text-xs font-normal">식사·체중 기록, 사진과 설정이 모두 삭제됩니다.</span>
              </p>
              <div className="flex gap-2">
                <button onClick={handleClearData} className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-all text-sm">
                  삭제 확인
                </button>
                <button onClick={() => setConfirmClear(false)} className="flex-1 py-2.5 bg-gray-100 text-apple-secondary font-semibold rounded-lg hover:bg-gray-200 transition-all text-sm">
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="w-full py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              🗑️ 모든 데이터 삭제
            </button>
          )}
          <p className="text-xs text-apple-secondary text-center">
            프로필, 식사·체중 기록, 사진과 설정이 모두 삭제됩니다
          </p>
        </fieldset>
      </div>

      {/* 앱 정보 */}
      <div className="text-center py-4">
        <p className="text-[#586b7a] font-semibold mb-1 text-sm">MealLog v1.3</p>
        <p className="text-xs text-[#586b7a]">맛있는 하루를 기록하세요 🍱</p>
      </div>
    </div>
  );
};

export default ProfileSetting;
