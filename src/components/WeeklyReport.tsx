import { useState, useMemo } from 'react';
import { getMealRecords, getProfile } from '../utils/storage';
import { getAllMenuItems } from '../utils/recommendationEngine';
import type { MealRecord } from '../types';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function getWeekRange(offset: number): { start: string; end: string; label: string } {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const fmtLabel = (d: Date) =>
    `${d.getMonth() + 1}/${d.getDate()}`;

  return {
    start: fmt(monday),
    end: fmt(sunday),
    label: `${fmtLabel(monday)} ~ ${fmtLabel(sunday)}`,
  };
}

function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  const last = new Date(end);
  while (cur <= last) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
};

const WeeklyReport = ({ onSettingsClick }: { onSettingsClick?: () => void }) => {
  const [weekOffset, setWeekOffset] = useState(0);

  const allMenuItems = useMemo(() => getAllMenuItems(), []);
  const profile = useMemo(() => getProfile(), []);
  const calorieGoal = profile?.calorieGoal ?? null;

  const getCalories = (menu: string) =>
    allMenuItems.find((i) => i.name === menu)?.calories ?? 0;

  const week = useMemo(() => getWeekRange(weekOffset), [weekOffset]);
  const days = useMemo(() => dateRange(week.start, week.end), [week]);

  const weekRecords: MealRecord[] = useMemo(() => {
    return getMealRecords().filter(
      (r) => r.date >= week.start && r.date <= week.end
    );
  }, [week]);

  // 날짜별 칼로리
  const dailyCalories = useMemo(() => {
    return days.map((date) => {
      const dayRecords = weekRecords.filter((r) => r.date === date);
      return dayRecords.reduce((sum, r) => sum + getCalories(r.menu), 0);
    });
  }, [weekRecords, days]);

  const totalCalories = dailyCalories.reduce((a, b) => a + b, 0);
  const loggedDays = days.filter((_, i) => dailyCalories[i] > 0).length;
  const avgCalories = loggedDays > 0 ? Math.round(totalCalories / loggedDays) : 0;
  const maxCalories = Math.max(...dailyCalories, calorieGoal ?? 0, 1);

  // 식단 횟수 (아침/점심/저녁)
  const mealTypeCounts = useMemo(() => {
    return weekRecords.reduce((acc, r) => {
      acc[r.mealType] = (acc[r.mealType] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [weekRecords]);

  // 자주 먹은 음식 Top 5
  const topFoods = useMemo(() => {
    const counts: Record<string, number> = {};
    weekRecords.forEach((r) => {
      counts[r.menu] = (counts[r.menu] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [weekRecords]);

  // 카테고리 분포
  const categoryDist = useMemo(() => {
    const counts: Record<string, number> = {};
    weekRecords.forEach((r) => {
      const cat = allMenuItems.find((i) => i.name === r.menu)?.category ?? '기타';
      counts[cat] = (counts[cat] ?? 0) + 1;
    });
    const total = weekRecords.length;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, count]) => ({ cat, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }));
  }, [weekRecords, allMenuItems]);

  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* 헤더 + 주간 네비 */}
      <div className="glass border border-blue-200/50 rounded-3xl shadow-md p-6 backdrop-blur-xl">
        <div className="text-center mb-4">
          <span className="text-3xl animate-float inline-block">📋</span>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2 mb-1 tracking-tight">
            주간 리포트
          </h2>
        </div>
        <div className="flex items-center justify-between bg-white/60 border border-blue-100 rounded-2xl px-4 py-3">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition-all"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-gray-800">{week.label}</p>
            {isCurrentWeek && (
              <p className="text-xs text-blue-600 font-medium mt-0.5">이번 주</p>
            )}
          </div>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            disabled={isCurrentWeek}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
      </div>

      {/* 칼로리 목표 미설정 유도 배너 */}
      {!calorieGoal && onSettingsClick && (
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-left hover:bg-blue-100 transition-all"
        >
          <span className="text-xl flex-shrink-0">💡</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-800">프로필 설정 시 일별 칼로리 목표선과 감량/증량 분석이 표시돼요</p>
            <p className="text-[10px] text-blue-600 mt-0.5">설정 탭에서 키·체중·목표 입력 →</p>
          </div>
        </button>
      )}

      {weekRecords.length === 0 ? (
        <div className="glass border border-blue-200/50 rounded-3xl shadow-md p-10 backdrop-blur-xl text-center">
          <span className="text-4xl mb-3 block animate-float inline-block">📭</span>
          <p className="text-base font-medium text-gray-500">이 기간에 기록된 식사가 없습니다</p>
          <p className="text-xs mt-1 text-gray-400">식사를 기록하면 리포트가 생성됩니다</p>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '총 식사', value: `${weekRecords.length}회`, sub: `${loggedDays}일 기록`, emoji: '🍽️' },
              {
                label: '평균 칼로리',
                value: `${avgCalories.toLocaleString()}`,
                sub: 'kcal/일',
                emoji: '🔥',
              },
              {
                label: '총 칼로리',
                value: `${totalCalories.toLocaleString()}`,
                sub: 'kcal',
                emoji: '⚡',
              },
            ].map(({ label, value, sub, emoji }) => (
              <div
                key={label}
                className="glass border border-blue-200/50 rounded-2xl shadow-sm p-4 backdrop-blur-xl text-center"
              >
                <span className="text-2xl block mb-1">{emoji}</span>
                <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
                <p className="text-[10px] text-blue-600 font-semibold mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* 일별 칼로리 바 차트 */}
          <div className="glass border border-blue-200/50 rounded-3xl shadow-md p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-gray-700 mb-4">일별 칼로리 섭취량</h3>
            <div className="flex items-end gap-1.5 h-32">
              {days.map((date, i) => {
                const cal = dailyCalories[i];
                const heightPct = cal > 0 ? Math.max((cal / maxCalories) * 100, 6) : 0;
                const isOver = calorieGoal != null && cal > calorieGoal;
                const isToday = date === new Date().toISOString().split('T')[0];

                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    {cal > 0 && (
                      <span className="text-[9px] text-gray-500 leading-none">
                        {cal >= 1000 ? `${(cal / 1000).toFixed(1)}k` : cal}
                      </span>
                    )}
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          cal === 0
                            ? 'bg-gray-100'
                            : isOver
                            ? 'bg-gradient-to-t from-red-500 to-pink-400'
                            : 'bg-gradient-to-t from-blue-600 to-blue-400'
                        } ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
                        style={{ height: cal > 0 ? `${heightPct}%` : '6px' }}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-semibold ${
                        isToday ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      {DAY_LABELS[i]}
                    </span>
                  </div>
                );
              })}
            </div>
            {calorieGoal != null && (
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                목표: {calorieGoal.toLocaleString()} kcal/일 &nbsp;·&nbsp; 초과 시 빨간색
              </p>
            )}
          </div>

          {/* 식사 유형 분포 */}
          <div className="glass border border-blue-200/50 rounded-3xl shadow-md p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold text-gray-700 mb-4">식사 유형별 횟수</h3>
            <div className="space-y-3">
              {(['breakfast', 'lunch', 'dinner'] as const).map((type) => {
                const count = mealTypeCounts[type] ?? 0;
                const max = Math.max(...Object.values(mealTypeCounts), 1);
                const emoji = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙' }[type];
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center">{emoji}</span>
                    <span className="text-xs font-semibold text-gray-700 w-8">{MEAL_TYPE_LABEL[type]}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-500"
                        style={{ width: count > 0 ? `${(count / max) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-600 w-8 text-right">{count}회</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 자주 먹은 음식 */}
          {topFoods.length > 0 && (
            <div className="glass border border-blue-200/50 rounded-3xl shadow-md p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-gray-700 mb-4">자주 먹은 음식 TOP {topFoods.length}</h3>
              <div className="space-y-2">
                {topFoods.map(([name, count], idx) => {
                  const cal = getCalories(name);
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div
                      key={name}
                      className="flex items-center justify-between bg-white/70 border border-blue-100 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{medals[idx] ?? `${idx + 1}.`}</span>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{name}</p>
                          {cal > 0 && (
                            <p className="text-xs text-blue-500">{cal} kcal</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-600">{count}회</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 카테고리 분포 */}
          {categoryDist.length > 0 && (
            <div className="glass border border-blue-200/50 rounded-3xl shadow-md p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-gray-700 mb-4">음식 카테고리 분포</h3>
              <div className="space-y-2.5">
                {categoryDist.map(({ cat, count, pct }) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-700 w-10">{cat}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-300 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-16 text-right">{count}회 ({pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WeeklyReport;
