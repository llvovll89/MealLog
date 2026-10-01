import { useState } from 'react';
import { getMealRecords, getProfile } from '../utils/storage';
import { formatDate, parseDate } from '../utils/dates';
import { mealCalories, mealCategory, summarizeDay } from '../utils/mealNutrition';
import { useStorageRevision } from '../hooks/useStorageRevision';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

function getWeekRange(offset: number): { start: string; end: string; label: string } {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = formatDate;
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
  const cur = parseDate(start);
  const last = parseDate(end);
  while (cur <= last) {
    dates.push(formatDate(cur));
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

  useStorageRevision();
  const calorieGoal = getProfile()?.calorieGoal ?? null;
  const week = getWeekRange(weekOffset);
  const days = dateRange(week.start, week.end);
  const weekRecords = getMealRecords().filter(record => record.date >= week.start && record.date <= week.end);
  const summaries = days.map(date => summarizeDay(weekRecords.filter(record => record.date === date)));
  const dailyCalories = summaries.map(day => day.calories);
  const totalCalories = dailyCalories.reduce((a,b)=>a+b,0);
  const loggedDays = summaries.filter(day=>day.recorded).length;
  const completeDays = summaries.filter(day=>day.complete);
  const unknownMeals = summaries.reduce((sum,day)=>sum+day.unknownCount,0);
  const avgCalories = completeDays.length ? Math.round(completeDays.reduce((sum,day)=>sum+day.calories,0) / completeDays.length) : 0;
  const maxCalories = Math.max(...dailyCalories, calorieGoal ?? 0, 1);
  const mealTypeCounts = weekRecords.reduce((acc,record)=>{acc[record.mealType]=(acc[record.mealType]??0)+1;return acc;},{} as Record<string,number>);
  const foodCounts = weekRecords.reduce((acc,record)=>{acc[record.menu]=(acc[record.menu]??0)+1;return acc;},{} as Record<string,number>);
  const topFoods = Object.entries(foodCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const categoryCounts = weekRecords.reduce((acc,record)=>{const category=mealCategory(record);acc[category]=(acc[category]??0)+1;return acc;},{} as Record<string,number>);
  const categoryDist = Object.entries(categoryCounts).sort((a,b)=>b[1]-a[1]).map(([cat,count])=>({cat,count,pct:Math.round(count/Math.max(weekRecords.length,1)*100)}));
  const getCalories = (menu:string) => {const record=weekRecords.find(record=>record.menu===menu);return record ? mealCalories(record) : null;};
  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="page-content space-y-3 ">
      {/* 헤더 + 주간 네비 */}
      <div className="page-section">
        <div className="page-heading">
          <p className="text-[13px] font-semibold text-[#586b7a] mb-1">주간 분석</p>
          <div className="flex items-center justify-between">
            <h2 className="text-[24px] font-black text-[#263f56] tracking-tight leading-tight">주간 리포트</h2>
            <span className="text-3xl ">📋</span>
          </div>
        </div>
        <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-none">
          <button
            aria-label="이전 주 보기"
            onClick={() => setWeekOffset((o) => o - 1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-[#d8e6f0] hover:bg-[#e8f2fa] text-[#586b7a] font-bold transition-all"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-[#263f56]">{week.label}</p>
            {isCurrentWeek && (
              <p className="text-xs text-[#3974a6] font-medium mt-0.5">이번 주</p>
            )}
          </div>
          <button
            aria-label="다음 주 보기"
            onClick={() => setWeekOffset((o) => o + 1)}
            disabled={isCurrentWeek}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-[#d8e6f0] hover:bg-[#e8f2fa] text-[#586b7a] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ›
          </button>
        </div>
      </div>

      {/* 칼로리 목표 미설정 유도 배너 */}
      {!calorieGoal && onSettingsClick && (
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center gap-3 bg-[#e8f2fa] rounded-2xl px-4 py-3 text-left hover:bg-[#d8e6f0] transition-all"
        >
          <span className="text-xl flex-shrink-0">💡</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800">프로필 설정 시 일별 칼로리 목표선과 감량/증량 분석이 표시돼요</p>
            <p className="text-[12px] text-[#3974a6] mt-0.5">설정 탭에서 키·체중·목표 입력 →</p>
          </div>
        </button>
      )}

      {weekRecords.length === 0 ? (
        <div className="content-surface p-10 text-center">
          <span className="text-4xl mb-3 inline-block ">📭</span>
          <p className="text-base font-medium text-apple-secondary">이 기간에 기록된 식사가 없습니다</p>
          <p className="text-xs mt-1 text-apple-secondary">식사를 기록하면 리포트가 생성됩니다</p>
        </div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '총 식사', value: `${weekRecords.length}회`, sub: `${loggedDays}일 기록`, emoji: '🍽️' },
              { label: '평균 칼로리', value: completeDays.length ? avgCalories.toLocaleString() : '—', sub: `칼로리 입력 ${completeDays.length}일 기준`, emoji: '🔥' },
              { label: '입력된 칼로리', value: weekRecords.some(record=>mealCalories(record)!==null) ? totalCalories.toLocaleString() : '—', sub: 'kcal · 입력된 값만', emoji: '⚡' },
            ].map(({ label, value, sub, emoji }) => (
              <div
                key={label}
                className="bg-white rounded-2xl shadow-none p-4 text-center"
              >
                <span className="text-2xl block mb-1">{emoji}</span>
                <p className="text-lg font-bold text-apple-text leading-tight">{value}</p>
                <p className="text-[12px] text-apple-secondary mt-0.5">{sub}</p>
                <p className="text-[12px] text-[#3974a6] font-semibold mt-1">{label}</p>
              </div>
            ))}
          </div>

          {unknownMeals > 0 && <p className="text-sm text-apple-secondary">칼로리 미입력 식사 {unknownMeals}건이 있어요. 합계는 입력된 값만 표시하고, 평균은 모든 식사의 칼로리를 입력한 날짜만 계산해요.</p>}
          {/* 일별 칼로리 바 차트 */}
          <div className="content-surface">
            <h3 className="text-sm font-bold text-apple-text mb-4">일별 칼로리 섭취량</h3>
            <div className="flex items-end gap-1.5 h-32">
              {days.map((date, i) => {
                const cal = dailyCalories[i];
                const heightPct = cal > 0 ? Math.max((cal / maxCalories) * 100, 6) : 0;
                const isOver = calorieGoal != null && cal > calorieGoal;
                const isToday = date === formatDate(new Date());

                return (
                  <div key={date} className="flex-1 h-full flex flex-col items-center gap-1">
                    {cal > 0 && (
                      <span className="text-[9px] text-apple-secondary leading-none">
                        {cal >= 1000 ? `${(cal / 1000).toFixed(1)}k` : cal}
                      </span>
                    )}
                    <div className="w-full flex-1 min-h-0 flex items-end">
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          cal === 0 ? 'bg-gray-100' : isOver ? 'bg-[#ff3b30]' : 'bg-[#3974a6]'
                        } ${isToday ? 'ring-2 ring-[#3974a6] ring-offset-1' : ''}`}
                        style={{ height: cal > 0 ? `${heightPct}%` : '6px' }}
                      />
                    </div>
                    <span className={`text-[12px] font-semibold ${isToday ? 'text-[#3974a6]' : 'text-apple-secondary'}`}>
                      {DAY_LABELS[i]}
                    </span>
                  </div>
                );
              })}
            </div>
            {calorieGoal != null && (
              <p className="text-[12px] text-apple-secondary mt-2 text-center">
                목표: {calorieGoal.toLocaleString()} kcal/일 &nbsp;·&nbsp; 초과 시 빨간색
              </p>
            )}
          </div>

          {/* 식사 유형 분포 */}
          <div className="content-surface">
            <h3 className="text-sm font-bold text-apple-text mb-4">식사 유형별 횟수</h3>
            <div className="space-y-3">
              {(['breakfast', 'lunch', 'dinner'] as const).map((type) => {
                const count = mealTypeCounts[type] ?? 0;
                const max = Math.max(...Object.values(mealTypeCounts), 1);
                const emoji = { breakfast: '☀️', lunch: '🌤️', dinner: '🌙' }[type];
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-base w-6 text-center">{emoji}</span>
                    <span className="text-xs font-semibold text-apple-text w-8">{MEAL_TYPE_LABEL[type]}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-[#3974a6] rounded-full transition-all duration-500"
                        style={{ width: count > 0 ? `${(count / max) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-apple-secondary w-8 text-right">{count}회</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 자주 먹은 음식 */}
          {topFoods.length > 0 && (
            <div className="content-surface">
              <h3 className="text-sm font-bold text-apple-text mb-4">자주 먹은 음식 TOP {topFoods.length}</h3>
              <div className="space-y-2">
                {topFoods.map(([name, count], idx) => {
                  const cal = getCalories(name);
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div
                      key={name}
                      className="flex items-center justify-between bg-[#f0f6fa] rounded-2xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{medals[idx] ?? `${idx + 1}.`}</span>
                        <div>
                          <p className="text-sm font-semibold text-apple-text">{name}</p>
                          {cal !== null && (
                            <p className="text-xs text-[#3974a6]">{cal} kcal</p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-apple-secondary">{count}회</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 카테고리 분포 */}
          {categoryDist.length > 0 && (
            <div className="content-surface">
              <h3 className="text-sm font-bold text-apple-text mb-4">음식 카테고리 분포</h3>
              <div className="space-y-2.5">
                {categoryDist.map(({ cat, count, pct }) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-apple-text w-10">{cat}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-[#3974a6] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-apple-secondary w-16 text-right">{count}회 ({pct}%)</span>
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
