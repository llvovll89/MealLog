import { useState, useEffect, useMemo } from 'react';
import type { CustomMenu, Gender, ActivityLevel } from '../types';
import {
  getProfile,
  saveProfile,
  clearAllData,
  getCustomMenus,
  saveCustomMenu,
  deleteCustomMenu,
  exportAllData,
  importAllData,
} from '../utils/storage';
import { calculateBMI } from '../utils/bmiCalculator';
import { useToast } from '../context/ToastContext';
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

const ProfileSetting = () => {
  const toast = useToast();

  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [age, setAge] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [calorieGoal, setCalorieGoal] = useState('');

  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(getNotificationPrefs);
  const [permStatus, setPermStatus] = useState(getPermissionStatus);

  const [customMenus, setCustomMenus] = useState<CustomMenu[]>([]);
  const [menuName, setMenuName] = useState('');
  const [menuCategory, setMenuCategory] = useState('한식');
  const [menuCalories, setMenuCalories] = useState('');
  const [confirmDeleteMenuId, setConfirmDeleteMenuId] = useState<string | null>(null);

  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      setName(profile.name || '');
      setHeight(profile.height.toString());
      setWeight(profile.weight.toString());
      setTargetWeight(profile.targetWeight?.toString() || '');
      setGender(profile.gender || '');
      setAge(profile.age?.toString() || '');
      setActivityLevel(profile.activityLevel || 'moderate');
      setCalorieGoal(profile.calorieGoal?.toString() || '');
    }
    setCustomMenus(getCustomMenus());
  }, []);

  const suggestedCalories = useMemo(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const tw = parseFloat(targetWeight);
    const a = parseFloat(age);
    if (!h || !w || !a || !gender || h <= 0 || w <= 0 || a <= 0) return null;

    // Harris-Benedict BMR
    const bmr =
      gender === 'male'
        ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * a
        : 447.593 + 9.247 * w + 3.098 * h - 4.330 * a;

    let tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];

    // 목표 체중에 따른 조정 (±500kcal)
    if (tw && tw > 0) {
      if (tw < w) tdee -= 500;       // 감량
      else if (tw > w) tdee += 500;  // 증량
    }

    return Math.round(tdee);
  }, [height, weight, targetWeight, gender, age, activityLevel]);

  const handleToggleNotification = async () => {
    if (!notifPrefs.enabled) {
      const granted = await requestPermission();
      setPermStatus(getPermissionStatus());
      if (!granted) {
        toast.error('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
        return;
      }
      const updated = { ...notifPrefs, enabled: true };
      setNotifPrefs(updated);
      saveNotificationPrefs(updated);
      scheduleMealNotifications(updated);
      toast.success('알림이 활성화되었습니다!');
    } else {
      const updated = { ...notifPrefs, enabled: false };
      setNotifPrefs(updated);
      saveNotificationPrefs(updated);
      clearScheduledNotifications();
      toast.info('알림이 비활성화되었습니다.');
    }
  };

  const handleTimeChange = (meal: keyof Pick<NotificationPrefs, 'breakfast' | 'lunch' | 'dinner'>, value: string) => {
    const updated = { ...notifPrefs, [meal]: value };
    setNotifPrefs(updated);
    saveNotificationPrefs(updated);
    if (updated.enabled) scheduleMealNotifications(updated);
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
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const calorieGoalNum = calorieGoal ? parseFloat(calorieGoal) : undefined;

    if (!heightNum || !weightNum || heightNum <= 0 || weightNum <= 0) {
      toast.warning('올바른 키와 몸무게를 입력해주세요!');
      return;
    }
    if (calorieGoalNum && calorieGoalNum <= 0) {
      toast.warning('올바른 칼로리 목표를 입력해주세요!');
      return;
    }

    const existingProfile = getProfile();
    const targetWeightNum = targetWeight ? parseFloat(targetWeight) : undefined;
    const ageNum = age ? parseInt(age) : undefined;
    saveProfile({
      ...existingProfile,
      name: name.trim() || undefined,
      height: heightNum,
      weight: weightNum,
      targetWeight: targetWeightNum && targetWeightNum > 0 ? targetWeightNum : undefined,
      gender: gender || undefined,
      age: ageNum && ageNum > 0 ? ageNum : undefined,
      activityLevel,
      calorieGoal: calorieGoalNum,
    });
    toast.success('프로필이 저장되었습니다!');
  };

  const handleAddMenu = () => {
    if (!menuName.trim()) {
      toast.warning('메뉴 이름을 입력해주세요!');
      return;
    }
    const cal = menuCalories ? parseFloat(menuCalories) : undefined;
    if (cal !== undefined && (isNaN(cal) || cal < 0)) {
      toast.warning('올바른 칼로리를 입력해주세요!');
      return;
    }

    saveCustomMenu({
      id: crypto.randomUUID(),
      name: menuName.trim(),
      category: menuCategory,
      calories: cal,
    });

    setMenuName('');
    setMenuCalories('');
    setMenuCategory('한식');
    setCustomMenus(getCustomMenus());
    toast.success(`'${menuName.trim()}' 메뉴가 추가되었습니다!`);
  };

  const handleDeleteMenu = (id: string) => {
    deleteCustomMenu(id);
    setConfirmDeleteMenuId(null);
    setCustomMenus(getCustomMenus());
    toast.success('메뉴가 삭제되었습니다.');
  };

  const handleClearData = () => {
    clearAllData();
    setName('');
    setHeight('');
    setWeight('');
    setCalorieGoal('');
    setCustomMenus([]);
    setConfirmClear(false);
    toast.info('모든 데이터가 삭제되었습니다.');
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meallog_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('데이터를 내보냈습니다!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const data = JSON.parse(reader.result as string);
        importAllData(data);
        setCustomMenus(getCustomMenus());
        toast.success('데이터를 복원했습니다! 새로고침하면 반영됩니다.');
      } catch {
        toast.error('파일 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const bmiInfo = (() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    return h > 0 && w > 0 ? calculateBMI(h, w) : null;
  })();

  const inputClass = "w-full px-4 py-2.5 border-2 border-blue-200/60 bg-white/80 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-sm backdrop-blur-sm";

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* ─── 프로필 ─── */}
      <div className="glass border border-blue-200/50 rounded-3xl shadow-md p-6 backdrop-blur-xl">
        <div className="text-center mb-5">
          <span className="text-3xl animate-float inline-block">⚙️</span>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2 mb-1 tracking-tight">프로필 설정</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">👤 이름 (선택)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">📏 키 (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="170"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">🏋️ 몸무게 (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="65"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">🎯 목표 체중 (kg, 선택)</label>
            <input
              type="number"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="60"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">👤 성별</label>
            <div className="flex gap-3">
              {([['male', '남성'], ['female', '여성']] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setGender(val)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${gender === val
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent'
                      : 'bg-white/80 text-gray-600 border-blue-200/60 hover:border-blue-400'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">🎂 나이 (세)</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="25"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">🏃 활동량</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
              className="w-full px-4 py-2.5 border-2 border-blue-200/60 bg-white/80 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-sm"
            >
              {(Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {bmiInfo && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">현재 BMI 지수</p>
                  <p className="text-2xl font-bold text-gray-900">{bmiInfo.bmi}</p>
                  <p className={`text-sm font-semibold ${bmiInfo.color}`}>{bmiInfo.category}</p>
                </div>
                <div className="text-4xl">⚖️</div>
              </div>
            </div>
          )}

          {suggestedCalories && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-xs text-gray-500 mb-1">Harris-Benedict 자동 계산 권장 칼로리</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{suggestedCalories.toLocaleString()} kcal</p>
                  <p className="text-xs text-blue-600 mt-0.5">
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
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
                >
                  적용
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              🔥 하루 칼로리 목표 (kcal, 선택)
            </label>
            <input
              type="number"
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(e.target.value)}
              placeholder="2000"
              className={inputClass}
            />
            <p className="text-[10px] text-gray-400 mt-1 ml-1">
              입력 시 히스토리에서 일일 칼로리 섭취량을 추적할 수 있어요
            </p>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:shadow-glow transition-all duration-300 transform hover:scale-105"
          >
            💾 프로필 저장
          </button>
        </div>
      </div>

      {/* ─── 알림 설정 ─── */}
      <div className="glass border border-blue-200/50 rounded-3xl shadow-md p-6 backdrop-blur-xl">
        <div className="text-center mb-5">
          <span className="text-3xl animate-float inline-block">🔔</span>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2 mb-1 tracking-tight">식사 알림</h2>
          <p className="text-xs text-gray-500">앱이 열려 있는 동안 식사 시간을 알려드려요</p>
        </div>

        {permStatus === 'unsupported' ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">이 브라우저에서는 알림을 지원하지 않습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {permStatus === 'denied' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                알림이 차단되었습니다. 브라우저 주소창 옆 자물쇠 아이콘에서 알림을 허용해주세요.
              </div>
            )}

            <div className="flex items-center justify-between bg-white/60 border border-blue-100 rounded-xl p-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">식사 알림</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {notifPrefs.enabled ? '알림이 켜져 있어요' : '알림이 꺼져 있어요'}
                </p>
              </div>
              <button
                onClick={handleToggleNotification}
                disabled={permStatus === 'denied'}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50 ${notifPrefs.enabled
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                  : 'bg-gray-200'
                  }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${notifPrefs.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            {notifPrefs.enabled && permStatus === 'granted' && (
              <div className="bg-white/60 border border-blue-100 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">⏰ 알림 시간 설정</p>
                {(
                  [
                    { key: 'breakfast', label: '☀️ 아침' },
                    { key: 'lunch', label: '🌤️ 점심' },
                    { key: 'dinner', label: '🌙 저녁' },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <input
                      type="time"
                      value={notifPrefs[key]}
                      onChange={(e) => handleTimeChange(key, e.target.value)}
                      className="px-3 py-1.5 border-2 border-blue-200/60 bg-white/80 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleTestNotification}
              disabled={permStatus === 'denied'}
              className="w-full py-2.5 bg-white/70 border-2 border-blue-200/60 text-blue-700 font-semibold rounded-xl hover:bg-blue-50 hover:shadow-soft transition-all text-sm disabled:opacity-50"
            >
              🔔 테스트 알림 보내기
            </button>
          </div>
        )}
      </div>

      {/* ─── 나만의 메뉴 ─── */}
      <div className="glass border border-blue-200/50 rounded-3xl shadow-md p-6 backdrop-blur-xl">
        <div className="text-center mb-5">
          <span className="text-3xl animate-float inline-block">🍳</span>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2 mb-1 tracking-tight">나만의 메뉴</h2>
          <p className="text-xs text-gray-500">추가한 메뉴는 추천·기록에 자동으로 포함됩니다</p>
        </div>

        <div className="bg-white/60 border border-blue-100 rounded-2xl p-4 mb-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">🍽️ 메뉴 이름</label>
            <input
              type="text"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="예: 엄마표 된장찌개"
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">🏷️ 카테고리</label>
              <select
                value={menuCategory}
                onChange={(e) => setMenuCategory(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-blue-200/60 bg-white/80 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">🔥 칼로리 (선택)</label>
              <input
                type="number"
                value={menuCalories}
                onChange={(e) => setMenuCalories(e.target.value)}
                placeholder="450"
                className="w-full px-3 py-2.5 border-2 border-blue-200/60 bg-white/80 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-sm"
              />
            </div>
          </div>
          <button
            onClick={handleAddMenu}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:shadow-glow transition-all duration-300 transform hover:scale-105 text-sm"
          >
            + 메뉴 추가
          </button>
        </div>

        {customMenus.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm">아직 추가된 메뉴가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customMenus.map((menu) => (
              <div
                key={menu.id}
                className="flex items-center justify-between bg-white/80 border border-blue-100 rounded-xl px-4 py-3 hover:border-blue-300 transition-all"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">{menu.name}</p>
                  <p className="text-xs text-blue-600">
                    {menu.category}
                    {menu.calories ? ` · ${menu.calories}kcal` : ''}
                  </p>
                </div>
                {confirmDeleteMenuId === menu.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDeleteMenu(menu.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-all"
                    >
                      삭제
                    </button>
                    <button
                      onClick={() => setConfirmDeleteMenuId(null)}
                      className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-all"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteMenuId(menu.id)}
                    className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg text-xs font-medium hover:from-red-600 hover:to-pink-600 transition-all"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── 데이터 관리 ─── */}
      <div className="glass border border-blue-200/50 rounded-3xl shadow-md p-6 backdrop-blur-xl">
        <div className="text-center mb-5">
          <span className="text-3xl animate-float inline-block">🗂️</span>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2 mb-1 tracking-tight">데이터 관리</h2>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full py-3 bg-gradient-to-r from-slate-600 to-slate-800 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-slate-900 transition-all text-sm transform hover:scale-105 duration-300"
          >
            📤 데이터 내보내기 (JSON)
          </button>

          <label className="block w-full py-3 bg-white/70 text-gray-700 font-semibold rounded-xl hover:bg-blue-50 hover:text-blue-700 border-2 border-blue-200/60 transition-all text-sm text-center cursor-pointer transform hover:scale-105 duration-300">
            📥 데이터 가져오기 (JSON)
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          {confirmClear ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-600 mb-3 text-center">
                정말로 모든 데이터를 삭제하시겠습니까?<br />
                <span className="text-xs font-normal">프로필, 식사 기록, 메뉴가 모두 삭제됩니다.</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleClearData}
                  className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all text-sm"
                >
                  삭제 확인
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-all text-sm"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="w-full py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 transition-all text-sm transform hover:scale-105 duration-300"
            >
              🗑️ 모든 데이터 삭제
            </button>
          )}
          <p className="text-xs text-gray-400 text-center">
            프로필, 식사 기록, 커스텀 메뉴가 모두 삭제됩니다
          </p>
        </div>
      </div>

      {/* 앱 정보 */}
      <div className="text-center py-4">
        <p className="text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text font-bold mb-1 text-sm">MealLog v1.3</p>
        <p className="text-xs text-gray-400">맛있는 하루를 기록하세요 🍱</p>
      </div>
    </div>
  );
};

export default ProfileSetting;
