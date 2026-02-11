import { useState, useEffect } from 'react';
import { getMealRecords } from '../utils/storage';
import { menuDatabase } from '../data/menuDatabase';
import type { MealRecord } from '../types';

type TimePeriod = 'week' | 'month';

const NutritionDashboard = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [records, setRecords] = useState<MealRecord[]>([]);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const allRecords = getMealRecords();
    setRecords(allRecords);
  };

  const getFilteredRecords = () => {
    const now = new Date();
    const daysToShow = timePeriod === 'week' ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - daysToShow * 24 * 60 * 60 * 1000);

    return records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= cutoffDate;
    });
  };

  const getMenuCalories = (menuName: string) => {
    const menuItem = menuDatabase.find(item => item.name === menuName);
    return menuItem?.calories || 0;
  };

  const getMenuCategory = (menuName: string) => {
    const menuItem = menuDatabase.find(item => item.name === menuName);
    return menuItem?.category || '기타';
  };

  const filteredRecords = getFilteredRecords();

  // 총 칼로리 계산
  const totalCalories = filteredRecords.reduce((sum, record) => {
    return sum + getMenuCalories(record.menu);
  }, 0);

  // 평균 칼로리 계산
  const avgCalories = filteredRecords.length > 0
    ? Math.round(totalCalories / (timePeriod === 'week' ? 7 : 30))
    : 0;

  // 카테고리별 통계
  const categoryStats = filteredRecords.reduce((acc, record) => {
    const category = getMenuCategory(record.menu);
    const calories = getMenuCalories(record.menu);

    if (!acc[category]) {
      acc[category] = { count: 0, calories: 0 };
    }
    acc[category].count++;
    acc[category].calories += calories;

    return acc;
  }, {} as Record<string, { count: number; calories: number }>);

  const sortedCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1].calories - a[1].calories);

  // 식사 시간대별 통계
  const mealTypeStats = filteredRecords.reduce((acc, record) => {
    if (!acc[record.mealType]) {
      acc[record.mealType] = { count: 0, calories: 0 };
    }
    acc[record.mealType].count++;
    acc[record.mealType].calories += getMenuCalories(record.menu);

    return acc;
  }, {} as Record<string, { count: number; calories: number }>);

  const mealTypeLabels = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="glass border border-black/20 rounded-3xl shadow-strong p-6 backdrop-blur-xl">
        <div className="text-center mb-5">
          <span className="text-3xl">📊</span>
          <h2 className="text-xl font-bold text-gray-900 mt-2 mb-1 tracking-tight">
            영양 통계 대시보드
          </h2>
          <p className="text-xs text-gray-700">
            식사 패턴과 영양 섭취를 분석해보세요
          </p>
        </div>

        {/* 기간 선택 */}
        <div className="mb-5">
          <div className="flex gap-2">
            <button
              onClick={() => setTimePeriod('week')}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                timePeriod === 'week'
                  ? 'bg-gradient-to-r from-gray-800 to-black text-white shadow-glow'
                  : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-soft border border-black/20'
              }`}
            >
              최근 7일
            </button>
            <button
              onClick={() => setTimePeriod('month')}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                timePeriod === 'month'
                  ? 'bg-gradient-to-r from-gray-800 to-black text-white shadow-glow'
                  : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-soft border border-black/20'
              }`}
            >
              최근 30일
            </button>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-10 text-gray-700">
            <span className="text-4xl mb-3 block">📭</span>
            <p className="text-base font-medium">
              {timePeriod === 'week' ? '지난 7일' : '지난 30일'} 동안 기록된 식사가 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 전체 통계 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/50 border border-black/20 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-xs text-gray-700 mb-1">총 칼로리</p>
                <p className="text-2xl font-bold text-gray-900">{totalCalories.toLocaleString()}</p>
                <p className="text-xs text-gray-600">kcal</p>
              </div>
              <div className="bg-white/50 border border-black/20 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-xs text-gray-700 mb-1">평균 칼로리/일</p>
                <p className="text-2xl font-bold text-gray-900">{avgCalories.toLocaleString()}</p>
                <p className="text-xs text-gray-600">kcal</p>
              </div>
              <div className="bg-white/50 border border-black/20 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-xs text-gray-700 mb-1">총 식사 횟수</p>
                <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
                <p className="text-xs text-gray-600">회</p>
              </div>
              <div className="bg-white/50 border border-black/20 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-xs text-gray-700 mb-1">평균 식사/일</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(filteredRecords.length / (timePeriod === 'week' ? 7 : 30)).toFixed(1)}
                </p>
                <p className="text-xs text-gray-600">회</p>
              </div>
            </div>

            {/* 카테고리별 통계 */}
            <div className="bg-white/50 border border-black/20 rounded-2xl p-4 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>🏷️</span>
                <span>카테고리별 섭취량</span>
              </h3>
              <div className="space-y-2">
                {sortedCategories.map(([category, stats]) => {
                  const percentage = (stats.calories / totalCalories) * 100;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-900">{category}</span>
                        <div className="text-gray-700">
                          <span className="font-semibold">{stats.count}회</span>
                          <span className="mx-1">·</span>
                          <span>{stats.calories}kcal</span>
                          <span className="ml-1 text-gray-600">({percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-300 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-gray-700 to-black transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 식사 시간대별 통계 */}
            <div className="bg-white/50 border border-black/20 rounded-2xl p-4 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>⏰</span>
                <span>시간대별 식사 패턴</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(mealTypeStats).map(([type, stats]) => (
                  <div key={type} className="bg-white/80 border border-black/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-700 mb-1">{mealTypeLabels[type as keyof typeof mealTypeLabels]}</p>
                    <p className="text-lg font-bold text-gray-900">{stats.count}회</p>
                    <p className="text-xs text-gray-600">{stats.calories}kcal</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NutritionDashboard;
