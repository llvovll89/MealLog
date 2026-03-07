import { useState, useEffect } from 'react';
import type { MealRecord } from '../types';
import { getMealRecords, deleteMealRecord, getProfile } from '../utils/storage';
import { getMealTypeLabel, formatDateDisplay } from '../utils/recommendationEngine';
import { getAllMenuItems } from '../utils/recommendationEngine';
import { getImage, deleteImage } from '../utils/imageStorage';
import { useToast } from '../context/ToastContext';

const MealHistory = ({ onSettingsClick }: { onSettingsClick?: () => void }) => {
  const toast = useToast();
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null);
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
    const profile = getProfile();
    if (profile?.calorieGoal) setCalorieGoal(profile.calorieGoal);
  }, []);

  useEffect(() => {
    const idbRecords = records.filter((r) => r.imageUrl?.startsWith('idb:'));
    idbRecords.forEach(async (record) => {
      const imageId = record.imageUrl!.slice(4);
      if (imageCache[record.id]) return;
      try {
        const dataUrl = await getImage(imageId);
        if (dataUrl) setImageCache((prev) => ({ ...prev, [record.id]: dataUrl }));
      } catch {
        // 이미지 로드 실패 시 무시
      }
    });
  }, [records]);

  const loadRecords = () => {
    const allRecords = getMealRecords().sort((a, b) => b.timestamp - a.timestamp);
    setRecords(allRecords);
  };

  const handleDelete = async (id: string) => {
    const record = records.find((r) => r.id === id);
    if (record?.imageUrl?.startsWith('idb:')) {
      try {
        await deleteImage(record.imageUrl.slice(4));
      } catch {
        // 이미지 삭제 실패는 무시하고 기록만 삭제
      }
    }
    deleteMealRecord(id);
    setConfirmDeleteId(null);
    loadRecords();
    toast.success('기록이 삭제되었습니다.');
  };

  const getDisplayImageUrl = (record: MealRecord): string | null => {
    if (!record.imageUrl) return null;
    if (record.imageUrl.startsWith('idb:')) return imageCache[record.id] || null;
    return record.imageUrl;
  };

  const filteredRecords = selectedDate
    ? records.filter((record) => record.date === selectedDate)
    : records;

  const recordsByDate = filteredRecords.reduce((acc, record) => {
    if (!acc[record.date]) acc[record.date] = [];
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, MealRecord[]>);

  const allMenuItems = getAllMenuItems();

  const getMenuCalories = (menuName: string) =>
    allMenuItems.find((item) => item.name === menuName)?.calories ?? null;

  const getDailyCalories = (dateRecords: MealRecord[]) =>
    dateRecords.reduce((total, record) => total + (getMenuCalories(record.menu) || 0), 0);

  const mealTypeEmoji = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙' };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="glass border border-blue-200/50 rounded-3xl shadow-md p-6 backdrop-blur-xl">
        <div className="text-center mb-5">
          <span className="text-3xl animate-float inline-block">📚</span>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2 mb-1 tracking-tight">
            식사 히스토리
          </h2>
        </div>

        {/* 칼로리 목표 미설정 유도 배너 */}
        {!calorieGoal && onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="w-full mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-left hover:bg-blue-100 transition-all"
          >
            <span className="text-xl flex-shrink-0">💡</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-800">칼로리 목표를 설정하면 일별 섭취량 진행률이 표시돼요</p>
              <p className="text-[10px] text-blue-600 mt-0.5">설정 탭에서 키·체중·목표 입력 →</p>
            </div>
          </button>
        )}

        {/* 날짜 필터 */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            🔍 날짜로 필터링
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-4 py-2.5 border-2 border-blue-200/60 bg-white/80 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-sm backdrop-blur-sm"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 hover:shadow-soft transition-all font-medium text-sm transform hover:scale-105 duration-300 border border-blue-200"
              >
                전체보기
              </button>
            )}
          </div>
        </div>

        {/* 기록 목록 */}
        <div className="space-y-4">
          {Object.keys(recordsByDate).length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <span className="text-4xl mb-3 block animate-float inline-block">📭</span>
              <p className="text-base font-medium">아직 기록된 식사가 없습니다</p>
              <p className="text-xs mt-1 text-gray-400">기록 탭에서 식사를 기록해보세요!</p>
            </div>
          ) : (
            Object.entries(recordsByDate).map(([date, dateRecords]) => {
              const dailyCalories = getDailyCalories(dateRecords);
              const caloriePercentage = calorieGoal ? (dailyCalories / calorieGoal) * 100 : 0;
              const isOverGoal = calorieGoal ? dailyCalories > calorieGoal : false;

              return (
                <div key={date} className="bg-white/60 border border-blue-100 rounded-2xl p-4 backdrop-blur-sm shadow-soft">
                  <div className="mb-3">
                    <h3 className="text-base font-bold text-gray-800">
                      {formatDateDisplay(date)}
                    </h3>
                    {calorieGoal ? (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">칼로리 섭취량</span>
                          <span className={`text-xs font-semibold ${isOverGoal ? 'text-red-500' : 'text-green-600'}`}>
                            {dailyCalories}kcal / {calorieGoal}kcal
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${isOverGoal
                                ? 'bg-gradient-to-r from-red-500 to-pink-500'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500'
                              }`}
                            style={{ width: `${Math.min(caloriePercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : dailyCalories > 0 ? (
                      <p className="text-xs text-blue-700 mt-1 font-medium">총 {dailyCalories}kcal</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    {dateRecords.map((record) => {
                      const displayImage = getDisplayImageUrl(record);
                      const calories = getMenuCalories(record.menu);

                      return (
                        <div
                          key={record.id}
                          className="bg-white/90 border border-blue-100 rounded-xl p-3 hover:border-blue-300 hover:shadow-soft transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 flex-1">
                              <span className="text-lg mt-0.5">
                                {mealTypeEmoji[record.mealType]}
                              </span>
                              <div className="flex-1">
                                {displayImage && (
                                  <img
                                    src={displayImage}
                                    alt={record.menu}
                                    className="w-full h-32 object-cover rounded-lg mb-2 border border-blue-100"
                                  />
                                )}
                                <p className="font-semibold text-gray-800 text-sm">
                                  {record.menu}
                                  {calories != null && (
                                    <span className="text-xs text-blue-600 ml-2 font-normal">
                                      {calories}kcal
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {getMealTypeLabel(record.mealType)}
                                </p>
                              </div>
                            </div>

                            {confirmDeleteId === record.id ? (
                              <div className="flex flex-col gap-1 flex-shrink-0">
                                <p className="text-xs text-gray-600 font-medium text-center">삭제?</p>
                                <button
                                  onClick={() => handleDelete(record.id)}
                                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-all"
                                >
                                  확인
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-all"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(record.id)}
                                className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all font-medium text-xs flex-shrink-0"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MealHistory;
