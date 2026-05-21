import { useState, useEffect, useRef } from 'react';
import type { MealRecord, MenuCategory } from '../types';
import {
  getCurrentMealType,
  getMealTypeLabel,
  getRecommendedMenusWithMeta,
  formatDate,
  getAllMenuItems,
  type RecommendationMeta,
} from '../utils/recommendationEngine';
import { saveMealRecord } from '../utils/storage';
import { useToast } from '../context/ToastContext';

const FAST_MODE_STORAGE_KEY = 'mealog_recommend_fast_mode';

const MealRecommendation = () => {
  const toast = useToast();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [slotStates, setSlotStates] = useState<string[]>([]);
  const [stoppedSlots, setStoppedSlots] = useState<boolean[]>([false, false, false, false, false]);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | '전체'>('전체');
  const [recommendationCount, setRecommendationCount] = useState(5);
  const [recommendationReasons, setRecommendationReasons] = useState<Record<string, string[]>>({});
  const [recommendationMetaMap, setRecommendationMetaMap] = useState<Record<string, RecommendationMeta>>({});
  const [showReasonDetail, setShowReasonDetail] = useState(false);
  const [reasonTone, setReasonTone] = useState<'friendly' | 'data'>('friendly');
  const [fastMode, setFastMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(FAST_MODE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const currentMealType = getCurrentMealType();
  const intervalsRef = useRef<number[]>([]);

  const categories: (MenuCategory | '전체')[] = ['전체', '한식', '중식', '일식', '양식', '분식', '기타'];

  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAST_MODE_STORAGE_KEY, fastMode ? '1' : '0');
    } catch {
      // localStorage 저장 실패 시 무시
    }
  }, [fastMode]);

  const getRandomMenu = () => {
    const all = getAllMenuItems();
    return all[Math.floor(Math.random() * all.length)].name;
  };

  const handleGetRecommendations = () => {
    const finalRecommendations = getRecommendedMenusWithMeta(
      currentMealType,
      recommendationCount,
      selectedCategory === '전체' ? undefined : selectedCategory
    );
    const finalMenus = finalRecommendations.map((item) => item.name);
    const reasonMap = finalRecommendations.reduce((acc, item) => {
      acc[item.name] = item.reasons;
      return acc;
    }, {} as Record<string, string[]>);
    const metaMap = finalRecommendations.reduce((acc, item) => {
      acc[item.name] = item;
      return acc;
    }, {} as Record<string, RecommendationMeta>);

    setSelectedMenu('');
    setShowReasonDetail(false);
    setRecommendationReasons(reasonMap);
    setRecommendationMetaMap(metaMap);
    setIsSpinning(true);
    const initialStoppedSlots = Array(recommendationCount).fill(false);
    setStoppedSlots(initialStoppedSlots);
    setSlotStates(finalMenus);

    intervalsRef.current.forEach(interval => clearInterval(interval));
    intervalsRef.current = [];

    const newIntervals: number[] = [];
    const spinInterval = fastMode ? 65 : 100;
    const stopStartDelay = fastMode ? 450 : 1000;
    const stopStepDelay = fastMode ? 260 : 600;
    const finishDelay = fastMode ? 120 : 300;

    for (let i = 0; i < recommendationCount; i++) {
      const interval = setInterval(() => {
        setSlotStates(prev => {
          const newStates = [...prev];
          newStates[i] = getRandomMenu();
          return newStates;
        });
      }, spinInterval);
      newIntervals.push(interval);
    }

    intervalsRef.current = newIntervals;

    for (let i = 0; i < recommendationCount; i++) {
      setTimeout(() => {
        clearInterval(newIntervals[i]);
        setSlotStates(prev => {
          const newStates = [...prev];
          newStates[i] = finalMenus[i];
          return newStates;
        });
        setStoppedSlots(prev => {
          const newStopped = [...prev];
          newStopped[i] = true;
          return newStopped;
        });

        if (i === recommendationCount - 1) {
          setTimeout(() => {
            setIsSpinning(false);
            setRecommendations(finalMenus);
            setSelectedMenu(finalMenus[0] || '');
          }, finishDelay);
        }
      }, stopStartDelay + i * stopStepDelay);
    }
  };

  const getMenuDetails = (menuName: string) => {
    return getAllMenuItems().find(item => item.name === menuName) || null;
  };

  const handleSelectMenu = (menu: string) => {
    setSelectedMenu(menu);
  };

  const handleSaveToHistory = () => {
    if (!selectedMenu) return;

    const record: MealRecord = {
      id: crypto.randomUUID(),
      date: formatDate(new Date()),
      mealType: currentMealType,
      menu: selectedMenu,
      timestamp: Date.now(),
    };
    saveMealRecord(record);
    toast.success(`${selectedMenu}를 ${getMealTypeLabel(currentMealType)} 메뉴로 기록했습니다!`);
  };

  const primaryMenu = !isSpinning && recommendations.length > 0 ? (selectedMenu || recommendations[0]) : '';
  const primaryMenuDetails = primaryMenu ? getMenuDetails(primaryMenu) : null;
  const primaryMenuMeta = primaryMenu ? recommendationMetaMap[primaryMenu] : null;
  const alternativeMenus = isSpinning ? slotStates : recommendations.filter((menu) => menu !== primaryMenu);
  const toPercent = (score: number) => Math.round(score * 100);
  const scoreLabel = (score: number) => {
    const pct = toPercent(score);
    if (pct >= 75) return '높음';
    if (pct >= 45) return '보통';
    return '낮음';
  };

  const formatReason = (reason: string) => {
    if (reasonTone === 'friendly') return reason;

    if (reason.includes('카테고리 반영')) return '카테고리 제약 조건 일치';
    if (reason.includes('덜 먹은 카테고리')) return '선호도 점수 우위';
    if (reason.includes('목표 칼로리')) return '칼로리 적합도 우위';
    if (reason.includes('중복 낮음')) return '다양성 점수 우위';
    if (reason.includes('시간대')) return '시간대 적합도 우위';
    if (reason.includes('패턴 기반')) return '히스토리 기반 탐색';
    return reason;
  };

  return (
    <div className="max-w-[460px] mx-auto">
      <div className="bg-white rounded-2xl border border-[#d8dde4] shadow-[0_6px_20px_rgba(15,23,42,0.06)] p-4">
        <div className="text-left mb-5 px-1">
          <p className="text-[11px] font-semibold text-[#666d78] mb-1">오늘의 추천</p>
          <h2 className="text-[22px] font-black text-[#1f1d19] tracking-tight leading-tight">
            {getMealTypeLabel(currentMealType)} 메뉴 추천
          </h2>
          <p className="text-[#666d78] text-xs mt-1.5">
            최근 기록을 반영해서 지금 먹기 좋은 메뉴를 골라드려요
          </p>
        </div>

        <div className="mb-4 rounded-xl bg-white border border-[#d8dde4] p-3.5 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <p className="text-[11px] font-semibold text-[#666d78] mb-2">빠른 카테고리</p>
          <div className="grid grid-cols-4 gap-2">
            {['한식', '중식', '일식', '양식'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSelectedCategory(item as MenuCategory)}
                disabled={isSpinning}
                className={`rounded-md py-2 text-xs font-semibold border transition-all ${selectedCategory === item ? 'bg-[#0099ff] text-white border-[#0099ff]' : 'bg-[#f3f5f8] text-[#4f5b70] border-[#d8dde4] hover:bg-[#ebeef3]'} ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#d8dde4] p-4 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
          <div className="text-center mb-5">
            <h3 className="text-lg font-bold text-[#1f1d19] mb-1">
              추천 옵션 설정
            </h3>
            <p className="text-[#666d78] text-xs">
              필터를 고른 뒤 버튼 한 번으로 추천을 시작하세요
            </p>
          </div>

          {/* 카테고리 필터 */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#666d78] mb-2">
              카테고리 선택
            </label>
            <div className="flex gap-1.5">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  disabled={isSpinning}
                  className={`flex-1 min-w-0 py-1.5 rounded-md font-medium text-xs text-center whitespace-nowrap transition-all duration-200 ${selectedCategory === category
                    ? 'bg-[#0099ff] text-white shadow-none'
                    : 'bg-[#f3f5f8] text-[#666d78] hover:bg-[#ebeef3] border border-[#d8dde4]'
                    } ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 추천 개수 선택 */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#666d78] mb-2">
              추천 개수
            </label>
            <div className="flex gap-2">
              {[3, 5, 7, 10].map((count) => (
                <button
                  key={count}
                  onClick={() => setRecommendationCount(count)}
                  disabled={isSpinning}
                  className={`flex-1 py-2 rounded-md font-semibold text-sm transition-all duration-200 ${recommendationCount === count
                    ? 'bg-[#0099ff] text-white shadow-none'
                    : 'bg-[#f3f5f8] text-[#666d78] hover:bg-[#ebeef3] border border-[#d8dde4]'
                    } ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {count}개
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between bg-[#f3f5f8] border border-[#d8dde4] rounded-md px-3 py-2.5">
            <div>
              <p className="text-xs font-semibold text-[#1f1d19]">빠른 추천 모드</p>
              <p className="text-[11px] text-[#666d78]">슬롯 애니메이션을 짧게 실행합니다</p>
            </div>
            <button
              onClick={() => setFastMode((prev) => !prev)}
              disabled={isSpinning}
              className={`w-14 h-8 rounded-full relative transition-colors ${fastMode ? 'bg-[#0099ff]' : 'bg-gray-300'} ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="빠른 추천 모드 토글"
            >
              <span
                className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${fastMode ? '-translate-x-6' : 'translate-x-0.5'}`}
              />
            </button>
          </div>

          <button
            onClick={handleGetRecommendations}
            disabled={isSpinning}
            className={`w-full sm:py-3 py-2.5 font-semibold text-base rounded-md transition-all duration-200 mb-4 flex items-center justify-center ${isSpinning
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-[#0099ff] text-white hover:bg-[#008ae6] active:bg-[#007acc] shadow-[0_3px_10px_rgba(0,153,255,0.22)]'
              }`}
          >
            <span>{isSpinning ? '추천 계산 중...' : '추천 받기'}</span>
          </button>
        </div>

        {(slotStates.length > 0 || recommendations.length > 0) && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h3 className="text-[clamp(1rem,2vw,1.125rem)] font-bold text-[#1f1d19]">
                {isSpinning ? '추천 결과 계산 중' : '추천 결과'}
              </h3>
            </div>

            {!isSpinning && primaryMenu && primaryMenuDetails && (
              <div className="p-5 rounded-xl border border-[#0099ff] bg-[#0099ff] shadow-none">
                <p className="text-xs font-semibold text-white/90 mb-2">추천 메뉴</p>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-2xl font-black text-white">{primaryMenu}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2.5 py-1 rounded-full bg-white/20 border border-white/35 text-white text-xs font-semibold">
                        {primaryMenuDetails.category}
                      </span>
                      <span className="text-sm text-white/90 font-semibold">
                        {primaryMenuDetails.calories}kcal
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(recommendationReasons[primaryMenu] ?? ['내 식사 패턴 기반 추천']).map((reason) => (
                    <span
                      key={reason}
                      className="px-2.5 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-medium text-white"
                    >
                      {formatReason(reason)}
                    </span>
                  ))}
                </div>
                {primaryMenuMeta && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        onClick={() => setShowReasonDetail((prev) => !prev)}
                        className="text-xs font-semibold text-white hover:text-white/80 transition-colors"
                      >
                        {showReasonDetail ? '선택 이유 상세 닫기' : '선택 이유 상세 보기'}
                      </button>
                      <div className="inline-flex rounded-md border border-white/30 overflow-hidden">
                        <button
                          onClick={() => setReasonTone('friendly')}
                          className={`px-2 py-1 text-[11px] font-semibold ${reasonTone === 'friendly' ? 'bg-white text-[#0099ff]' : 'bg-transparent text-white'}`}
                        >
                          친화형
                        </button>
                        <button
                          onClick={() => setReasonTone('data')}
                          className={`px-2 py-1 text-[11px] font-semibold ${reasonTone === 'data' ? 'bg-white text-[#0099ff]' : 'bg-transparent text-white'}`}
                        >
                          데이터형
                        </button>
                      </div>
                    </div>
                    {showReasonDetail && (
                      <div className="mt-2 bg-white rounded-2xl border border-white/70 p-3 space-y-2">
                        <div className="text-[11px] text-[#666d78] bg-[#f3f7ff] border border-[#d8dde4] rounded-md px-2.5 py-2">
                          최근 14일 이 메뉴 섭취: <span className="font-semibold text-[#1f1d19]">{primaryMenuMeta.menuFrequency14d}회</span>
                          <span className="mx-1">·</span>
                          최근 30일 동일 카테고리 섭취: <span className="font-semibold text-[#1f1d19]">{primaryMenuMeta.categoryFrequency30d}회</span>
                        </div>
                        {[
                          { label: '선호도 반영', value: primaryMenuMeta.preferenceScore },
                          { label: '칼로리 적합도', value: primaryMenuMeta.calorieFitScore },
                          { label: '다양성 점수', value: primaryMenuMeta.diversityScore },
                          { label: '시간대 적합도', value: primaryMenuMeta.timeFitScore },
                        ].map((row) => (
                          <div key={row.label}>
                            <div className="flex items-center justify-between text-[11px] text-[#666d78] mb-1">
                              <span>{row.label}</span>
                              <span className="font-semibold text-[#1f1d19]">{toPercent(row.value)}점 ({scoreLabel(row.value)})</span>
                            </div>
                            <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                              <div className="h-1.5 bg-[#0099ff] rounded-full" style={{ width: `${toPercent(row.value)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={handleSaveToHistory}
                  className="w-full mt-4 py-3.5 font-semibold text-base rounded-md bg-white text-[#1f1d19] hover:bg-[#f3f5f8] active:bg-[#ebeef3] transition-colors duration-150"
                >
                  이 메뉴로 기록하기
                </button>
              </div>
            )}

            <div className="space-y-2.5">
              {alternativeMenus.map((menu, index) => {
                const isCurrentlySpinning = isSpinning && !stoppedSlots[index];
                const justStopped = isSpinning && stoppedSlots[index];
                const menuDetails = getMenuDetails(menu);

                return (
                  <div
                    key={`${menu}-${index}`}
                    className={`p-4 rounded-md border transition-all duration-200 ${isCurrentlySpinning
                      ? 'border-[#d8dde4] bg-[#f3f5f8] animate-pulse'
                      : justStopped
                        ? 'border-green-400 bg-green-50 shadow-none'
                        : selectedMenu === menu
                          ? 'border-[#0099ff] bg-[#0099ff] text-white cursor-pointer shadow-none'
                          : 'border-[#d8dde4] hover:border-[#0099ff] bg-white cursor-pointer'
                      }`}
                    onClick={() => !isSpinning && handleSelectMenu(menu)}
                    style={{ pointerEvents: isSpinning ? 'none' : 'auto' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="w-7 h-7 rounded-full bg-[#e9edf2] text-[#666d78] grid place-items-center text-xs font-semibold">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-lg font-bold ${isCurrentlySpinning ? 'blur-sm' : ''}`}>
                              {menu}
                            </span>
                            {!isCurrentlySpinning && selectedMenu === menu && (
                              <span className="text-white text-lg">✓</span>
                            )}
                          </div>
                          {!isCurrentlySpinning && menuDetails && (
                            <div className="flex items-center gap-3 text-xs">
                              <span className={`px-2 py-1 rounded-full font-medium ${selectedMenu === menu
                                ? 'bg-white/20 text-white'
                                : 'bg-[#e9edf2] text-[#1f1d19]'
                                }`}>
                                {menuDetails.category}
                              </span>
                              <span className={`font-semibold ${selectedMenu === menu ? 'text-white/90' : 'text-[#666d78]'}`}>
                                {menuDetails.calories}kcal
                              </span>
                              {recommendationReasons[menu]?.[0] && (
                                <span className={`font-medium ${selectedMenu === menu ? 'text-white/80' : 'text-[#1f1d19]'}`}>
                                  · {formatReason(recommendationReasons[menu][0])}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {justStopped && (
                        <span className="text-sm text-green-600 font-bold px-3 py-1 bg-white rounded-lg border border-green-200">
                          확정
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!isSpinning && recommendations.length > 0 && !selectedMenu && (
              <div className="mt-4 text-center">
                <p className="text-sm text-[#666d78] font-medium bg-[#f3f5f8] py-3 px-4 rounded-2xl border border-[#d8dde4]">
                  메뉴를 탭해서 선택하세요
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MealRecommendation;
