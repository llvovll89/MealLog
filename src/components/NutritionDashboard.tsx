import { useState } from 'react';
import { getMealRecords, getProfile } from '../utils/storage';
import { formatDate, dateKeyAgo } from '../utils/dates';
import { mealCalories, mealCategory } from '../utils/mealNutrition';
import { useStorageRevision } from '../hooks/useStorageRevision';

type TimePeriod = 'week' | 'month';

const NutritionDashboard = ({ onSettingsClick }: { onSettingsClick?: () => void }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  useStorageRevision();
  const records = getMealRecords();
  const calorieGoal = getProfile()?.calorieGoal ?? null;

  const getFilteredRecords = () => {
    const daysToShow = timePeriod === 'week' ? 7 : 30;
    const cutoff = dateKeyAgo(daysToShow - 1);
    return records.filter(record => record.date >= cutoff && record.date <= formatDate(new Date()));
  };

  const filteredRecords = getFilteredRecords();


  const categoryStats = filteredRecords.reduce((acc, record) => {
    const category = mealCategory(record);
    const calories = (mealCalories(record) ?? 0);

    if (!acc[category]) {
      acc[category] = { count: 0, calories: 0, unknown: 0 };
    }
    acc[category].count++;
    if (mealCalories(record) === null) acc[category].unknown++;
    acc[category].calories += calories;

    return acc;
  }, {} as Record<string, { count: number; calories: number; unknown: number }>);

  const sortedCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1].count - a[1].count);

  const mealTypeStats = filteredRecords.reduce((acc, record) => {
    if (!acc[record.mealType]) {
      acc[record.mealType] = { count: 0, calories: 0, unknown: 0 };
    }
    acc[record.mealType].count++;
    if (mealCalories(record) === null) acc[record.mealType].unknown++;
    acc[record.mealType].calories += (mealCalories(record) ?? 0);

    return acc;
  }, {} as Record<string, { count: number; calories: number; unknown: number }>);

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
  const dominantCategoryPct = filteredRecords.length > 0
    ? Math.round((sortedCategories[0]?.[1].count || 0) / filteredRecords.length * 100)
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
    '#3974a6', '#5ac8fa', '#477360', '#ff9500', '#ff3b30', '#af52de'
  ];

  return (
    <div className="page-content ">
      <div className="page-section">
        <div className="page-heading">
          <p className="text-[13px] font-semibold text-[#586b7a] mb-1">인사이트</p>
          <div className="flex items-center justify-between">
            <h2 className="text-[24px] font-black text-[#263f56] tracking-tight leading-tight">식사 패턴</h2>
            <span className="text-3xl ">📊</span>
          </div>
          <p className="text-xs text-[#586b7a] mt-1">어떤 메뉴를 언제 먹었는지 살펴보세요</p>
        </div>

        <div className="content-surface">

        {/* 칼로리 목표 미설정 유도 배너 */}
        {!calorieGoal && onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="w-full mb-4 flex items-center gap-3 bg-[#e8f2fa] rounded-2xl px-4 py-3 text-left hover:bg-[#d8e6f0] transition-all"
          >
            <span className="text-xl flex-shrink-0">💡</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800">목표 칼로리를 설정하면 구성 분석에 달성률 해석이 더 정확해져요</p>
              <p className="text-[12px] text-[#3974a6] mt-0.5">설정 탭에서 키·체중·목표 입력</p>
            </div>
          </button>
        )}

        {/* 기간 선택 */}
        <div className="mb-5">
          <div className="flex gap-2">
            <button
              onClick={() => setTimePeriod('week')}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${timePeriod === 'week'
                  ? 'bg-[#3974a6] text-white shadow-none'
                  : 'bg-[#f0f6fa] text-[#586b7a] hover:bg-[#d8e6f0] border border-[#d8e6f0]'
                }`}
            >
              최근 7일
            </button>
            <button
              onClick={() => setTimePeriod('month')}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${timePeriod === 'month'
                  ? 'bg-[#3974a6] text-white shadow-none'
                  : 'bg-[#f0f6fa] text-[#586b7a] hover:bg-[#d8e6f0] border border-[#d8e6f0]'
                }`}
            >
              최근 30일
            </button>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-10 text-apple-secondary">
            <span className="text-4xl mb-3 inline-block ">📭</span>
            <p className="text-base font-medium">
              {timePeriod === 'week' ? '지난 7일' : '지난 30일'} 동안 기록된 식사가 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 핵심 구성 지표 */}
            <div className="grid grid-cols-1 min-[520px]:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4">
                <p className="text-xs text-apple-secondary mb-1">카테고리 다양성</p>
                <p className="text-2xl font-bold text-apple-text">{categoryVariety}</p>
                <p className="text-xs text-[#3974a6] font-medium">유형 사용</p>
              </div>
              <div className="bg-white rounded-2xl p-4">
                <p className="text-xs text-apple-secondary mb-1">최다 카테고리 비중</p>
                <p className="text-2xl font-bold text-apple-text">{dominantCategoryPct}%</p>
                <p className="text-xs text-[#3974a6] font-medium">편중도</p>
              </div>
              <div className="bg-white rounded-2xl p-4">
                <p className="text-xs text-apple-secondary mb-1">시간대 기록 균형</p>
                <p className="text-2xl font-bold text-apple-text">{mealBalanceScore}</p>
                <p className="text-xs text-[#3974a6] font-medium">/ 100</p>
              </div>
            </div>

            <div className="bg-[#f0f6fa] rounded-2xl p-4">
              <p className="text-sm text-apple-secondary leading-relaxed">
                현재 {timePeriod === 'week' ? '최근 7일' : '최근 30일'} 식사 기록은
                <span className="text-apple-text font-semibold"> {sortedCategories[0]?.[0] || '기타'} 중심</span>으로,
                전체의 <span className="text-apple-text font-semibold"> {dominantCategoryPct}%</span>를 차지합니다.
              </p>
            </div>

            {/* 카테고리별 통계 */}
            <div className="bg-[#f0f6fa] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-apple-text mb-3 flex items-center gap-2">
                <span>🏷️</span>
                <span>카테고리별 기록</span>
              </h3>
              <div className="space-y-2">
                {sortedCategories.map(([category, stats], idx) => {
                  const percentage = (stats.count / Math.max(filteredRecords.length, 1)) * 100;
                  const color = categoryColors[idx % categoryColors.length];
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-apple-text">{category}</span>
                        <div className="text-apple-secondary">
                          <span className="font-semibold">{stats.count}회</span>
                          <span className="mx-1">·</span>
                          <span>{stats.count === stats.unknown ? '—' : `${stats.calories} kcal`}</span>
                          <span className="ml-1 text-[#3974a6]">({percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                      {stats.unknown > 0 && <p className="text-xs text-apple-secondary">칼로리 미입력 {stats.unknown}건 · 입력된 값만 합산</p>}
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
            <div className="bg-[#f0f6fa] rounded-2xl p-4">
              <h3 className="text-sm font-bold text-apple-text mb-3 flex items-center gap-2">
                <span>⏰</span>
                <span>시간대별 식사 패턴</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {(['breakfast', 'lunch', 'dinner'] as const).map((type) => {
                  const stats = mealTypeStats[type] || { count: 0, calories: 0, unknown: 0 };
                  return (
                    <div key={type} className="bg-white rounded-2xl p-3 text-center">
                      <p className="text-xl mb-1">{mealTypeEmojis[type as keyof typeof mealTypeEmojis]}</p>
                      <p className="text-xs text-apple-secondary mb-1">{mealTypeLabels[type as keyof typeof mealTypeLabels]}</p>
                      <p className="text-lg font-bold text-apple-text">{stats.count}회</p>
                      <p className="text-xs text-[#3974a6]">{stats.count === stats.unknown ? '—' : `${stats.calories} kcal`}</p>
                      {stats.unknown > 0 && <p className="text-xs text-apple-secondary mt-1">미입력 {stats.unknown}건</p>}
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
