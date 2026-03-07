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

  const avgCalories = filteredRecords.length > 0
    ? Math.round(totalCalories / (timePeriod === 'week' ? 7 : 30))
    : 0;

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

  const dailyCalorieMap = filteredRecords.reduce((acc, record) => {
    acc[record.date] = (acc[record.date] || 0) + getMenuCalories(record.menu);
    return acc;
  }, {} as Record<string, number>);

  const dailyCalorieData = Object.entries(dailyCalorieMap).sort(([a], [b]) => a.localeCompare(b));

  const SVG_W = 320;
  const SVG_H = 110;
  const PAD = { top: 8, right: 10, bottom: 22, left: 10 };
  const C_W = SVG_W - PAD.left - PAD.right;
  const C_H = SVG_H - PAD.top - PAD.bottom;

  const maxDailyCal = Math.max(...dailyCalorieData.map(([, v]) => v), calorieGoal || 0, 1);
  const barCount = dailyCalorieData.length;
  const barSpacing = barCount > 0 ? C_W / barCount : C_W;
  const barW = Math.min(barSpacing - 3, 22);

  const categoryColors = ['from-blue-600 to-indigo-600', 'from-blue-400 to-blue-600', 'from-indigo-400 to-violet-500', 'from-purple-400 to-pink-400', 'from-blue-400 to-indigo-400', 'from-green-400 to-emerald-400'];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="glass border border-blue-200/50 rounded-3xl shadow-md p-6 backdrop-blur-xl">
        <div className="text-center mb-5">
          <span className="text-3xl animate-float inline-block">📊</span>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2 mb-1 tracking-tight">
            영양 통계 대시보드
          </h2>
          <p className="text-xs text-gray-500">
            식사 패턴과 영양 섭취를 분석해보세요
          </p>
        </div>

        {/* 칼로리 목표 미설정 유도 배너 */}
        {!calorieGoal && onSettingsClick && (
          <button
            onClick={onSettingsClick}
            className="w-full mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-left hover:bg-blue-100 transition-all"
          >
            <span className="text-xl flex-shrink-0">💡</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-800">프로필을 설정하면 목표 대비 칼로리 차트가 활성화돼요</p>
              <p className="text-[10px] text-blue-600 mt-0.5">설정 탭에서 키·체중·목표 입력 →</p>
            </div>
          </button>
        )}

        {/* 기간 선택 */}
        <div className="mb-5">
          <div className="flex gap-2">
            <button
              onClick={() => setTimePeriod('week')}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${timePeriod === 'week'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow-sm'
                  : 'bg-white/70 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-soft border border-blue-200/60'
                }`}
            >
              최근 7일
            </button>
            <button
              onClick={() => setTimePeriod('month')}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${timePeriod === 'month'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow-sm'
                  : 'bg-white/70 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-soft border border-blue-200/60'
                }`}
            >
              최근 30일
            </button>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <span className="text-4xl mb-3 block animate-float inline-block">📭</span>
            <p className="text-base font-medium">
              {timePeriod === 'week' ? '지난 7일' : '지난 30일'} 동안 기록된 식사가 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 전체 통계 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card">
                <p className="text-xs text-gray-500 mb-1">총 칼로리</p>
                <p className="text-2xl font-bold text-gray-900">{totalCalories.toLocaleString()}</p>
                <p className="text-xs text-blue-600 font-medium">kcal</p>
              </div>
              <div className="stat-card">
                <p className="text-xs text-gray-500 mb-1">평균 칼로리/일</p>
                <p className="text-2xl font-bold text-gray-900">{avgCalories.toLocaleString()}</p>
                <p className="text-xs text-blue-600 font-medium">kcal</p>
              </div>
              <div className="stat-card">
                <p className="text-xs text-gray-500 mb-1">총 식사 횟수</p>
                <p className="text-2xl font-bold text-gray-900">{filteredRecords.length}</p>
                <p className="text-xs text-indigo-500 font-medium">회</p>
              </div>
              <div className="stat-card">
                <p className="text-xs text-gray-500 mb-1">평균 식사/일</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(filteredRecords.length / (timePeriod === 'week' ? 7 : 30)).toFixed(1)}
                </p>
                <p className="text-xs text-indigo-500 font-medium">회</p>
              </div>
            </div>

            {/* 카테고리별 통계 */}
            <div className="bg-white/60 border border-blue-100 rounded-2xl p-4 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>🏷️</span>
                <span>카테고리별 섭취량</span>
              </h3>
              <div className="space-y-2">
                {sortedCategories.map(([category, stats], idx) => {
                  const percentage = (stats.calories / totalCalories) * 100;
                  const colorClass = categoryColors[idx % categoryColors.length];
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-800">{category}</span>
                        <div className="text-gray-500">
                          <span className="font-semibold">{stats.count}회</span>
                          <span className="mx-1">·</span>
                          <span>{stats.calories}kcal</span>
                          <span className="ml-1 text-blue-600">({percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full bg-gradient-to-r ${colorClass} transition-all`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 일별 칼로리 차트 */}
            {dailyCalorieData.length > 0 && (
              <div className="bg-white/60 border border-blue-100 rounded-2xl p-4 backdrop-blur-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <span>📅</span>
                  <span>일별 칼로리</span>
                </h3>
                <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ height: SVG_H }}>
                  {calorieGoal && (
                    <line
                      x1={PAD.left}
                      y1={PAD.top + C_H * (1 - calorieGoal / maxDailyCal)}
                      x2={PAD.left + C_W}
                      y2={PAD.top + C_H * (1 - calorieGoal / maxDailyCal)}
                      stroke="#16a34a"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                    />
                  )}
                  <line x1={PAD.left} y1={PAD.top + C_H} x2={PAD.left + C_W} y2={PAD.top + C_H} stroke="#f3e8ff" strokeWidth={1} />

                  {dailyCalorieData.map(([date, cal], i) => {
                    const barH = (cal / maxDailyCal) * C_H;
                    const x = PAD.left + i * barSpacing + (barSpacing - barW) / 2;
                    const y = PAD.top + C_H - barH;
                    const isOver = calorieGoal ? cal > calorieGoal : false;
                    return (
                      <g key={date}>
                        <rect x={x} y={y} width={barW} height={barH} rx={3} fill={isOver ? '#ef4444' : '#f97316'} opacity={0.85} />
                        {(i === 0 || i === dailyCalorieData.length - 1) && (
                          <text x={x + barW / 2} y={SVG_H - 4} textAnchor="middle" fontSize={8} fill="#9ca3af">
                            {date.slice(5)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
                {calorieGoal && (
                  <p className="text-[10px] text-green-600 text-center mt-1">-- 목표 칼로리 · 빨간 막대 = 초과</p>
                )}
              </div>
            )}

            {/* 식사 시간대별 통계 */}
            <div className="bg-white/60 border border-blue-100 rounded-2xl p-4 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>⏰</span>
                <span>시간대별 식사 패턴</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(mealTypeStats).map(([type, stats]) => (
                  <div key={type} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl p-3 text-center">
                    <p className="text-xl mb-1">{mealTypeEmojis[type as keyof typeof mealTypeEmojis]}</p>
                    <p className="text-xs text-gray-500 mb-1">{mealTypeLabels[type as keyof typeof mealTypeLabels]}</p>
                    <p className="text-lg font-bold text-gray-900">{stats.count}회</p>
                    <p className="text-xs text-blue-600">{stats.calories}kcal</p>
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
