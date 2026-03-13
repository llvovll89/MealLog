import { useState, useEffect, useRef } from 'react';
import type { MealRecord, MenuCategory } from '../types';
import {
  getCurrentMealType,
  getMealTypeLabel,
  getRecommendedMenus,
  formatDate,
  getAllMenuItems,
} from '../utils/recommendationEngine';
import { saveMealRecord } from '../utils/storage';
import { useToast } from '../context/ToastContext';

const MealRecommendation = () => {
  const toast = useToast();
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [slotStates, setSlotStates] = useState<string[]>([]);
  const [stoppedSlots, setStoppedSlots] = useState<boolean[]>([false, false, false, false, false]);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | '전체'>('전체');
  const [recommendationCount, setRecommendationCount] = useState(5);
  const currentMealType = getCurrentMealType();
  const intervalsRef = useRef<number[]>([]);

  const categories: (MenuCategory | '전체')[] = ['전체', '한식', '중식', '일식', '양식', '분식', '기타'];

  const getMealIcon = () => {
    switch (currentMealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🌞';
      case 'dinner': return '🌙';
    }
  };

  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  const getRandomMenu = () => {
    const all = getAllMenuItems();
    return all[Math.floor(Math.random() * all.length)].name;
  };

  const handleGetRecommendations = () => {
    const finalMenus = getRecommendedMenus(
      currentMealType,
      recommendationCount,
      selectedCategory === '전체' ? undefined : selectedCategory
    );

    setSelectedMenu('');
    setIsSpinning(true);
    const initialStoppedSlots = Array(recommendationCount).fill(false);
    setStoppedSlots(initialStoppedSlots);
    setSlotStates(finalMenus);

    intervalsRef.current.forEach(interval => clearInterval(interval));
    intervalsRef.current = [];

    const newIntervals: number[] = [];

    for (let i = 0; i < recommendationCount; i++) {
      const interval = setInterval(() => {
        setSlotStates(prev => {
          const newStates = [...prev];
          newStates[i] = getRandomMenu();
          return newStates;
        });
      }, 100);
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
          }, 300);
        }
      }, 1000 + i * 600);
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

  const foodEmojis = ['🍜', '🍕', '🍔', '🍱', '🥗', '🍛', '🌮', '🍝'];
  const selectedMenuDetails = selectedMenu ? getMenuDetails(selectedMenu) : null;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-2xl border border-apple-border-light shadow-soft p-6 animate-fade-in">
        <div className="text-center mb-5">
          <div className="text-5xl animate-float inline-block mb-2">{getMealIcon()}</div>
          <h2 className="text-2xl font-bold text-apple-text mb-2 tracking-tight">
            {getMealTypeLabel(currentMealType)} 메뉴 추천
          </h2>
          <p className="text-apple-secondary text-sm">
            오늘 먹은 메뉴를 고려해서 추천해드려요
          </p>
        </div>

        {/* 카테고리 필터 */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-apple-secondary mb-2">
            카테고리 선택
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                disabled={isSpinning}
                className={`px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-200 ${selectedCategory === category
                    ? 'bg-brand-500 text-white'
                    : 'bg-apple-bg text-apple-secondary hover:bg-gray-200 border border-apple-border-light'
                  } ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 추천 개수 선택 */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-apple-secondary mb-2">
            추천 개수
          </label>
          <div className="flex gap-2">
            {[3, 5, 7, 10].map((count) => (
              <button
                key={count}
                onClick={() => setRecommendationCount(count)}
                disabled={isSpinning}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${recommendationCount === count
                    ? 'bg-brand-500 text-white'
                    : 'bg-apple-bg text-apple-secondary hover:bg-gray-200 border border-apple-border-light'
                  } ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {count}개
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGetRecommendations}
          disabled={isSpinning}
          className={`w-full sm:py-4 py-3 font-semibold text-[clamp(1rem,2vw,1.125rem)] rounded-lg transition-all duration-200 mb-4 flex items-center justify-center gap-3 ${isSpinning
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700'
            }`}
        >
          <span className="text-2xl">{isSpinning ? '🎰' : '✨'}</span>
          <span>{isSpinning ? '추천 중...' : '추천 받기'}</span>
        </button>

        {(slotStates.length > 0 || recommendations.length > 0) && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h3 className="text-[clamp(1rem,2vw,1.125rem)] font-bold text-apple-text">
                {isSpinning ? '메뉴 뽑는 중...' : '추천 메뉴'}
              </h3>
            </div>

            <div className="space-y-2.5">
              {(isSpinning ? slotStates : recommendations).map((menu, index) => {
                const isCurrentlySpinning = isSpinning && !stoppedSlots[index];
                const justStopped = isSpinning && stoppedSlots[index];
                const menuDetails = getMenuDetails(menu);

                return (
                  <div
                    key={`${menu}-${index}`}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${isCurrentlySpinning
                      ? 'border-gray-200 bg-apple-bg animate-pulse'
                      : justStopped
                        ? 'border-green-400 bg-green-50 shadow-soft'
                        : selectedMenu === menu
                          ? 'border-brand-500 bg-brand-500 text-white cursor-pointer'
                          : 'border-apple-border-light hover:border-brand-500 bg-white cursor-pointer'
                      }`}
                    onClick={() => !isSpinning && handleSelectMenu(menu)}
                    style={{ pointerEvents: isSpinning ? 'none' : 'auto' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-3xl">
                          {isCurrentlySpinning ? '🎰' : foodEmojis[index % foodEmojis.length]}
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
                                : 'bg-brand-100 text-brand-600'
                                }`}>
                                {menuDetails.category}
                              </span>
                              <span className={`font-semibold ${selectedMenu === menu ? 'text-white/90' : 'text-apple-secondary'}`}>
                                {menuDetails.calories}kcal
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {justStopped && (
                        <span className="text-sm text-green-600 font-bold px-3 py-1 bg-white rounded-lg border border-green-200">
                          멈춤!
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!isSpinning && recommendations.length > 0 && !selectedMenu && (
              <div className="mt-4 text-center">
                <p className="text-sm text-apple-secondary font-medium bg-apple-bg py-3 px-4 rounded-xl border border-apple-border-light">
                  메뉴를 탭해서 선택하세요
                </p>
              </div>
            )}

            {/* 선택한 메뉴 상세 정보 */}
            {!isSpinning && selectedMenu && selectedMenuDetails && (
              <div className="mt-5 p-5 bg-apple-bg border border-apple-border-light rounded-xl">
                <h4 className="text-base font-bold text-apple-text mb-3">선택한 메뉴</h4>
                <div className="bg-white rounded-xl p-4 mb-4 border border-apple-border-light">
                  <p className="text-2xl font-bold text-apple-text mb-2">{selectedMenu}</p>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-brand-100 text-brand-600 rounded-full text-sm font-semibold">
                      {selectedMenuDetails.category}
                    </span>
                    <span className="text-apple-secondary font-semibold">
                      {selectedMenuDetails.calories}kcal
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleSaveToHistory}
                  className="w-full py-3.5 font-semibold text-base rounded-lg bg-[#34c759] text-white hover:bg-[#2db04c] active:bg-[#25a041] transition-colors duration-150 flex items-center justify-center gap-2"
                >
                  <span>📝</span>
                  <span>히스토리에 기록하기</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MealRecommendation;
