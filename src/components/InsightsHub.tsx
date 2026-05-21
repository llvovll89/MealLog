import { useEffect, useState } from 'react';
import MealHistory from './MealHistory';
import NutritionDashboard from './NutritionDashboard';
import WeeklyReport from './WeeklyReport';
import WeightTracking from './WeightTracking';
import BMICalculator from './BMICalculator';
import { useInsightMetrics } from '../hooks/useInsightMetrics';

type InsightTab = 'report' | 'stats' | 'history' | 'weight' | 'bmi';

const insightTabs: { id: InsightTab; label: string; emoji: string }[] = [
  { id: 'report', label: '주간 리포트', emoji: '📋' },
  { id: 'stats', label: '영양 통계', emoji: '📊' },
  { id: 'history', label: '식사 히스토리', emoji: '📚' },
  { id: 'weight', label: '체중 추적', emoji: '📈' },
  { id: 'bmi', label: 'BMI', emoji: '⚖️' },
];

const INSIGHTS_TAB_STORAGE_KEY = 'mealog_insights_tab';

const Sparkline = ({ values, color }: { values: number[]; color: string }) => {
  if (values.length === 0) return null;

  const w = 96;
  const h = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const points = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-24 h-6 mx-auto mt-2" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" points={points} />
    </svg>
  );
};

const InfoTooltip = ({
  id,
  text,
  openId,
  setOpenId,
}: {
  id: string;
  text: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
}) => {
  const isOpen = openId === id;

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={text}
        aria-expanded={isOpen}
        aria-controls={`tooltip-${id}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpenId(isOpen ? null : id);
        }}
        onBlur={() => setOpenId(null)}
        className="text-[10px] text-[#666d78]/80 hover:text-[#4f5b70]"
      >
        ⓘ
      </button>
      {isOpen && (
        <span
          id={`tooltip-${id}`}
          role="tooltip"
          className="absolute z-10 left-1/2 -translate-x-1/2 top-5 w-44 text-[10px] leading-snug bg-[#0099ff] text-white rounded-md px-2 py-1 shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
};

const InsightsHub = ({ onSettingsClick }: { onSettingsClick?: () => void }) => {
  const [currentInsightTab, setCurrentInsightTab] = useState<InsightTab>(() => {
    try {
      const saved = localStorage.getItem(INSIGHTS_TAB_STORAGE_KEY);
      if (saved && insightTabs.some((tab) => tab.id === saved)) {
        return saved as InsightTab;
      }
    } catch {
      // localStorage 접근 실패 시 기본값 사용
    }
    return 'report';
  });
  const [openTooltipId, setOpenTooltipId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(INSIGHTS_TAB_STORAGE_KEY, currentInsightTab);
    } catch {
      // 저장 실패 시 무시
    }
  }, [currentInsightTab]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenTooltipId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const {
    weeklyAvgCalories,
    weeklyGoalHitRate,
    streakDays,
    recentActiveDays,
    activeDaysDelta,
    weeklyAvgDelta,
    weeklyGoalHitDelta,
    goalDistanceDelta,
    hasGoal,
    currentWeekDailyCalories,
    currentWeekHitFlags,
  } = useInsightMetrics(currentInsightTab);

  const trendText = (delta: number, unit: string) => {
    if (delta === 0) return `전주 대비 변화 없음`;
    const sign = delta > 0 ? '+' : '';
    return `전주 대비 ${sign}${delta}${unit}`;
  };

  const trendClass = (delta: number, mode: 'higher-better' | 'lower-better' | 'neutral') => {
    if (mode === 'neutral') return 'text-apple-secondary';
    if (delta === 0) return 'text-apple-secondary';
    const isPositive = delta > 0;
    const isGood = mode === 'higher-better' ? isPositive : !isPositive;
    if (isGood) return 'text-[#34c759]';
    if (!isGood) return 'text-red-500';
    return 'text-apple-secondary';
  };

  const renderInsightContent = () => {
    switch (currentInsightTab) {
      case 'report':
        return <WeeklyReport onSettingsClick={onSettingsClick} />;
      case 'stats':
        return <NutritionDashboard onSettingsClick={onSettingsClick} />;
      case 'history':
        return <MealHistory onSettingsClick={onSettingsClick} />;
      case 'weight':
        return <WeightTracking />;
      case 'bmi':
        return <BMICalculator />;
      default:
        return <WeeklyReport onSettingsClick={onSettingsClick} />;
    }
  };

  return (
    <div>
      <section className="max-w-[460px] mx-auto pb-0">
        <div className="bg-white rounded-2xl border border-[#d8dde4] shadow-[0_6px_20px_rgba(15,23,42,0.06)] p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-[#1f1d19] tracking-tight">인사이트 허브</h2>
            <p className="text-xs text-[#666d78]">기록 분석과 건강 지표를 한 곳에서</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {insightTabs.map((tab) => {
              const active = currentInsightTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentInsightTab(tab.id)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap transition-all ${active
                    ? 'bg-[#0099ff] text-white border-[#0099ff] shadow-none'
                    : 'bg-white text-[#666d78] border-[#d8dde4] hover:border-[#76c9ff]'
                    }`}
                >
                  <span className="mr-1">{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <button
            onClick={() => setCurrentInsightTab('history')}
            className="bg-white rounded-3xl border border-[#d8dde4] shadow-none p-4 text-center transition-all hover:border-[#0099ff]"
          >
            <p className="text-xs text-[#666d78] mb-1 inline-flex items-center gap-1 justify-center">
              <span>기록 연속일</span>
              <InfoTooltip
                id="streak"
                text="오늘부터 연속으로 식사 기록을 남긴 일수"
                openId={openTooltipId}
                setOpenId={setOpenTooltipId}
              />
            </p>
            <p className="text-xl font-bold text-[#1f1d19]">{streakDays}일</p>
            <p className={`text-[10px] font-semibold mt-1 ${trendClass(activeDaysDelta, 'higher-better')}`}>
              최근 7일 기록 {recentActiveDays}일 · {trendText(activeDaysDelta, '일')}
            </p>
            <Sparkline
              values={currentWeekDailyCalories.map((v) => (v > 0 ? 1 : 0))}
              color={activeDaysDelta >= 0 ? '#34c759' : '#ff3b30'}
            />
          </button>
          <button
            onClick={() => setCurrentInsightTab('report')}
            className="bg-white rounded-3xl border border-[#d8dde4] shadow-none p-4 text-center transition-all hover:border-[#0099ff]"
          >
            <p className="text-xs text-[#666d78] mb-1 inline-flex items-center gap-1 justify-center">
              <span>주간 평균 칼로리</span>
              <InfoTooltip
                id="avg-cal"
                text="최근 7일 중 기록이 있는 날짜의 평균 섭취 칼로리"
                openId={openTooltipId}
                setOpenId={setOpenTooltipId}
              />
            </p>
            <p className="text-xl font-bold text-[#1f1d19]">{weeklyAvgCalories.toLocaleString()}</p>
            <p className={`text-[10px] font-semibold mt-1 ${hasGoal ? trendClass(goalDistanceDelta, 'lower-better') : trendClass(weeklyAvgDelta, 'neutral')}`}>
              kcal / 기록일 · {hasGoal ? `목표와 거리 ${trendText(goalDistanceDelta, 'kcal')}` : trendText(weeklyAvgDelta, 'kcal')}
            </p>
            <Sparkline
              values={currentWeekDailyCalories}
              color={hasGoal ? (goalDistanceDelta <= 0 ? '#34c759' : '#ff3b30') : '#0099ff'}
            />
          </button>
          <button
            onClick={() => setCurrentInsightTab('stats')}
            className="bg-white rounded-3xl border border-[#d8dde4] shadow-none p-4 text-center transition-all hover:border-[#0099ff]"
          >
            <p className="text-xs text-[#666d78] mb-1 inline-flex items-center gap-1 justify-center">
              <span>목표 달성률</span>
              <InfoTooltip
                id="goal-hit"
                text="기록일 중 목표 칼로리 ±20% 범위에 들어온 비율"
                openId={openTooltipId}
                setOpenId={setOpenTooltipId}
              />
            </p>
            <p className="text-xl font-bold text-[#1f1d19]">{weeklyGoalHitRate}%</p>
            <p className={`text-[10px] font-semibold mt-1 ${trendClass(weeklyGoalHitDelta, 'higher-better')}`}>
              목표 설정 기준 · {trendText(weeklyGoalHitDelta, '포인트')}
            </p>
            <Sparkline
              values={currentWeekHitFlags}
              color={weeklyGoalHitDelta >= 0 ? '#34c759' : '#ff3b30'}
            />
          </button>
        </div>
      </section>
      {renderInsightContent()}
    </div>
  );
};

export default InsightsHub;