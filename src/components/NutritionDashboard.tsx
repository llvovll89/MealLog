import { useState, useEffect } from 'react';
import { getMealRecords, getProfile } from '../utils/storage';
import { getAllMenuItems } from '../utils/recommendationEngine';
import type { MealRecord } from '../types';

type TimePeriod = 'week' | 'month';

const NutritionDashboard = ({ onSettingsClick }: { onSettingsClick?: () => void }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [calorieGoal, setCalorieGoal] = useState<number | null>(null);

  useEffect(() => {
    const allRecords = getMealRecords();
    setRecords(allRecords);
    const profile = getProfile();
    if (profile?.calorieGoal) setCalorieGoal(profile.calorieGoal);
  }, []);

  const allMenuItems = getAllMenuItems();

  const getFilteredRecords = () => {
    const now = new Date();
    const daysToShow = timePeriod === 'week' ? 7 : 30;
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToShow + 1)
      .toISOString()
      .split('T')[0];
    return records.filter(record => record.date >= cutoff);
  };

  const getMenuCalories = (menuName: string) =>
    allMenuItems.find(item => item.name === menuName)?.calories || 0;

  const getMenuCategory = (menuName: string) =>
    allMenuItems.find(item => item.name === menuName)?.category || '기타';

  const filteredRecords = getFilteredRecords();

  const totalCalories = filteredRecords.reduce((sum, record) => {
    return sum + getMenuCalories(record.menu);
  }, 0);

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

  const mealTypeEmojis = {
    breakfast: '☀️',
    lunch: '🌤️',
    dinner: '🌙',
  };

  const categoryVariety = sortedCategories.length;
  const dominantCategoryPct = totalCalories > 0
    ? Math.round((sortedCategories[0]?.[1].calories || 0) / totalCalories * 100)
    : 0;

  const mealCounts = [
    mealTypeStats.breakfast?.count || 0,
    mealTypeStats.lunch?.count || 0,
    mealTypeStats.dinner?.count || 0,
  ];
  const maxMealCount = Math.max(...mealCounts, 1);
  const minMealCount = Math.min(...mealCounts);
  const mealBalanceScore = Math.round((minMealCount / maxMealCount) * 100);

  const categoryColors = [
    '#0071e3', '#5ac8fa', '#34c759', '#ff9500', '#ff3b30', '#af52de'
  ];

  return (
    <div className="max-w-[460px] mx-auto animate-fade-in">
      <div className="bg-[#f5f2ec] rounded-[30px] border border-[#ddd4c3] shadow-none p-4">
        <div className="text-left mb-5 px-1">
          <p className="text-[11px] font-semibold text-[#6b6358] mb-1">인사이트</p>
          <div className="flex items-center justify-between">
            <h2 className="text-[24px] font-black text-[#1f1d19] tracking-tight leading-tight">영양 통계</h2>
            <span className="text-3xl animate-float">📊</span>
          </div>
          <p className="text-xs text-[#7a7266] mt-1">식사 패턴과 영양 섭취를 분석해보세요</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#d8d1c4] p-4 shadow-none">

        {/* 칼로리 목표 미설정 유도 배너 */}
        {!calorieGoal && onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="w-full mb-4 flex items-center gap-3 bg-[#eee8dd] border border-[#d6cebe] rounded-2xl px-4 py-3 text-left hover:bg-[#e5efff] transition-all"
          >
            <span className="text-xl flex-shrink-0">💡</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">목표 칼로리를 설정하면 구성 분석에 달성률 해석이 더 정확해져요</p>
              <p className="text-[10px] text-[#1f3b5b] mt-0.5">설정 탭에서 키·체중·목표 입력</p>
            </div>
          </button>
        )}

        {/* 기간 선택 */}
        <div className="mb-5">
          <div className="flex gap-2">
            <button
              onClick={() => setTimePeriod('week')}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${timePeriod === 'week'
                  ? 'bg-[#1f3b5b] text-white shadow-none'
                  : 'bg-[#f8f5ef] text-[#6b6358] hover:bg-[#f1ebe0] border border-[#e3dccf]'
                }`}
            >
              최근 7일
            </button>
            <button
              onClick={() => setTimePeriod('month')}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${timePeriod === 'month'
                  ? 'bg-[#1f3b5b] text-white shadow-none'
                  : 'bg-[#f8f5ef] text-[#6b6358] hover:bg-[#f1ebe0] border border-[#e3dccf]'
                }`}
            >
              최근 30일
            </button>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-10 text-apple-secondary">
            <span className="text-4xl mb-3 inline-block animate-float">📭</span>
            <p className="text-base font-medium">
              {timePeriod === 'week' ? '지난 7일' : '지난 30일'} 동안 기록된 식사가 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 핵심 구성 지표 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-[#d8d1c4] rounded-2xl p-4">
                <p className="text-xs text-apple-secondary mb-1">카테고리 다양성</p>
                <p className="text-2xl font-bold text-apple-text">{categoryVariety}</p>
                <p className="text-xs text-[#1f3b5b] font-medium">유형 사용</p>
              </div>
              <div className="bg-white border border-[#d8d1c4] rounded-2xl p-4">
                <p className="text-xs text-apple-secondary mb-1">최다 카테고리 비중</p>
                <p className="text-2xl font-bold text-apple-text">{dominantCategoryPct}%</p>
                <p className="text-xs text-[#1f3b5b] font-medium">편중도</p>
              </div>
              <div className="bg-white border border-[#d8d1c4] rounded-2xl p-4">
                <p className="text-xs text-apple-secondary mb-1">식사 균형 점수</p>
                <p className="text-2xl font-bold text-apple-text">{mealBalanceScore}</p>
                <p className="text-xs text-[#1f3b5b] font-medium">/ 100</p>
              </div>
            </div>

            <div className="bg-[#f8f5ef] border border-[#e3dccf] rounded-2xl p-4">
              <p className="text-sm text-apple-secondary leading-relaxed">
                현재 {timePeriod === 'week' ? '최근 7일' : '최근 30일'} 식단은
                <span className="text-apple-text font-semibold"> {sortedCategories[0]?.[0] || '기타'} 중심</span>으로,
                전체의 <span className="text-apple-text font-semibold"> {dominantCategoryPct}%</span>를 차지합니다.
              </p>
            </div>

            {/* 카테고리별 통계 */}
            <div className="bg-[#f8f5ef] border border-[#e3dccf] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-apple-text mb-3 flex items-center gap-2">
                <span>🏷️</span>
                <span>카테고리별 섭취량</span>
              </h3>
              <div className="space-y-2">
                {sortedCategories.map(([category, stats], idx) => {
                  const percentage = (stats.calories / totalCalories) * 100;
                  const color = categoryColors[idx % categoryColors.length];
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-apple-text">{category}</span>
                        <div className="text-apple-secondary">
                          <span className="font-semibold">{stats.count}회</span>
                          <span className="mx-1">·</span>
                          <span>{stats.calories}kcal</span>
                          <span className="ml-1 text-[#1f3b5b]">({percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%`, backgroundColor: color }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 식사 시간대별 통계 */}
            <div className="bg-[#f8f5ef] border border-[#e3dccf] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-apple-text mb-3 flex items-center gap-2">
                <span>⏰</span>
                <span>시간대별 식사 패턴</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(['breakfast', 'lunch', 'dinner'] as const).map((type) => {
                  const stats = mealTypeStats[type] || { count: 0, calories: 0 };
                  return (
                    <div key={type} className="bg-white border border-[#d8d1c4] rounded-2xl p-3 text-center">
                      <p className="text-xl mb-1">{mealTypeEmojis[type as keyof typeof mealTypeEmojis]}</p>
                      <p className="text-xs text-apple-secondary mb-1">{mealTypeLabels[type as keyof typeof mealTypeLabels]}</p>
                      <p className="text-lg font-bold text-apple-text">{stats.count}회</p>
                      <p className="text-xs text-[#1f3b5b]">{stats.calories}kcal</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default NutritionDashboard;
