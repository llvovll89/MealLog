import { useState, useEffect } from 'react';
import type { MealRecord } from '../types';
import { getMealRecords, deleteMealRecord, getProfile } from '../utils/storage';
import { getMealTypeLabel, formatDateDisplay } from '../utils/recommendationEngine';
import { menuDatabase } from '../data/menuDatabase';

const MealHistory = () => {
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null);

  useEffect(() => {
    loadRecords();
    const profile = getProfile();
    if (profile?.calorieGoal) {
      setCalorieGoal(profile.calorieGoal);
    }
  }, []);

  const loadRecords = () => {
    const allRecords = getMealRecords()
      .sort((a, b) => b.timestamp - a.timestamp);
    setRecords(allRecords);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteMealRecord(id);
      loadRecords();
    }
  };

  const filteredRecords = selectedDate
    ? records.filter((record) => record.date === selectedDate)
    : records;

  // 날짜별로 그룹화
  const recordsByDate = filteredRecords.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, MealRecord[]>);

  const mealTypeEmoji = {
    breakfast: '☀️',
    lunch: '🌤️',
    dinner: '🌙',
  };

  const getMenuCalories = (menuName: string) => {
    const menuItem = menuDatabase.find(item => item.name === menuName);
    return menuItem?.calories || null;
  };

  const getDailyCalories = (dateRecords: MealRecord[]) => {
    return dateRecords.reduce((total, record) => {
      const calories = getMenuCalories(record.menu);
      return total + (calories || 0);
    }, 0);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="glass border border-black/20 rounded-3xl shadow-strong p-6 backdrop-blur-xl">
        <div className="text-center mb-5">
          <span className="text-3xl">📚</span>
          <h2 className="text-xl font-bold text-gray-900 mt-2 mb-1 tracking-tight">
            식사 히스토리
          </h2>
        </div>

        {/* 날짜 필터 */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-800 mb-1.5">
            🔍 날짜로 필터링
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-4 py-2.5 border-2 border-black/20 bg-white/80 rounded-xl focus:border-gray-700 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all text-sm backdrop-blur-sm"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="px-4 py-2.5 bg-white/70 text-gray-700 rounded-xl hover:bg-white hover:shadow-soft transition-all font-medium text-sm transform hover:scale-105 duration-300"
              >
                전체보기
              </button>
            )}
          </div>
        </div>

        {/* 기록 목록 */}
        <div className="space-y-4">
          {Object.keys(recordsByDate).length === 0 ? (
            <div className="text-center py-10 text-gray-600">
              <span className="text-4xl mb-3 block">📭</span>
              <p className="text-base font-medium">아직 기록된 식사가 없습니다</p>
              <p className="text-xs mt-1">기록 탭에서 식사를 기록해보세요!</p>
            </div>
          ) : (
            Object.entries(recordsByDate).map(([date, dateRecords]) => {
              const dailyCalories = getDailyCalories(dateRecords);
              const caloriePercentage = calorieGoal ? (dailyCalories / calorieGoal) * 100 : 0;
              const isOverGoal = calorieGoal && dailyCalories > calorieGoal;

              return (
                <div key={date} className="bg-white/50 border border-black/20 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="mb-3">
                    <h3 className="text-base font-bold text-gray-900">
                      {formatDateDisplay(date)}
                    </h3>
                    {calorieGoal && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-700">
                            칼로리 섭취량
                          </span>
                          <span className={`text-xs font-semibold ${isOverGoal ? 'text-red-600' : 'text-green-600'}`}>
                            {dailyCalories}kcal / {calorieGoal}kcal
                          </span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isOverGoal
                                ? 'bg-gradient-to-r from-red-600 to-pink-600'
                                : 'bg-gradient-to-r from-green-600 to-emerald-600'
                            }`}
                            style={{ width: `${Math.min(caloriePercentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                  {dateRecords.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white/80 border border-black/20 rounded-xl p-3 hover:border-gray-600 hover:shadow-soft transition-all transform hover:scale-105 duration-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1">
                          <span className="text-lg mt-0.5">
                            {mealTypeEmoji[record.mealType]}
                          </span>
                          <div className="flex-1">
                            {record.imageUrl && (
                              <img
                                src={record.imageUrl}
                                alt={record.menu}
                                className="w-full h-32 object-cover rounded-lg mb-2 border border-black/20"
                              />
                            )}
                            <p className="font-semibold text-gray-900 text-sm">
                              {record.menu}
                              {getMenuCalories(record.menu) && (
                                <span className="text-xs text-gray-600 ml-2 font-normal">
                                  {getMenuCalories(record.menu)}kcal
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-700">
                              {getMealTypeLabel(record.mealType)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 hover:shadow-glow transition-all font-medium text-xs transform hover:scale-105 flex-shrink-0"
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    </div>
                  ))}
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
