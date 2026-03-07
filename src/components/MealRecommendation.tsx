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
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '🌞';
      case 'dinner':
        return '🌙';
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
      <div className="glass border border-blue-200/50 rounded-3xl shadow-md p-6 backdrop-blur-xl animate-fade-in">
        <div className="text-center mb-5">
          <div className="relative inline-block mb-2">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full blur-2xl opacity-25 animate-pulse"></div>
            <div className="relative text-5xl animate-float inline-block">{getMealIcon()}</div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-700 to-indigo-500 bg-clip-text text-transparent mb-2 tracking-tight">
            {getMealTypeLabel(currentMealType)} 메뉴 추천
          </h2>
          <p className="text-gray-500 text-sm font-medium">
            🎯 오늘 먹은 메뉴를 고려해서 추천해드려요
          </p>
        </div>

        {/* 카테고리 필터 */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            🏷️ 카테고리 선택
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                disabled={isSpinning}
                className={`px-3 py-2 rounded-xl font-medium text-xs transition-all duration-300 transform hover:scale-105 ${selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow-sm'
                    : 'bg-white/70 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-soft border border-blue-200/60'
                  } ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* 추천 개수 선택 */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            🔢 추천 개수
          </label>
          <div className="flex gap-2">
            {[3, 5, 7, 10].map((count) => (
              <button
                key={count}
                onClick={() => setRecommendationCount(count)}
                disabled={isSpinning}
                className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${recommendationCount === count
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow-sm'
                    : 'bg-white/70 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-soft border border-blue-200/60'
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
          className={`w-full sm:py-4 py-3 font-bold text-[clamp(1rem,2vw,1.25rem)] rounded-xl transition-all duration-300 transform hover:scale-105 mb-4 flex items-center justify-center gap-3 ${isSpinning
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-glow hover:from-blue-700 hover:to-indigo-700'
            }`}
        >
          <span className="text-2xl">{isSpinning ? '🎰' : '✨'}</span>
          <span>{isSpinning ? '추천 중...' : '추천 받기'}</span>
        </button>

        {(slotStates.length > 0 || recommendations.length > 0) && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">🎯</span>
              <h3 className="text-[clamp(1rem,2vw,1.25rem)] font-bold text-gray-800">
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
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 ${isCurrentlySpinning
                      ? 'border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 animate-pulse shadow-medium'
                      : justStopped
                        ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg scale-101'
                        : selectedMenu === menu
                          ? 'border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow cursor-pointer scale-105'
                          : 'border-blue-100 hover:border-blue-300 hover:shadow-medium bg-white/80 cursor-pointer hover:scale-102'
                      }`}
                    onClick={() => !isSpinning && handleSelectMenu(menu)}
                    style={{
                      pointerEvents: isSpinning ? 'none' : 'auto',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-3xl">
                          {isCurrentlySpinning ? '🎰' : foodEmojis[index % foodEmojis.length]}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-lg font-bold ${isCurrentlySpinning ? 'blur-sm' : ''
                              }`}>
                              {menu}
                            </span>
                            {!isCurrentlySpinning && selectedMenu === menu && (
                              <span className="text-white text-[clamp(1rem,2vw,1.25rem)]">✓</span>
                            )}
                          </div>
                          {!isCurrentlySpinning && menuDetails && (
                            <div className="flex items-center gap-3 text-xs">
                              <span className={`px-2 py-1 rounded-lg font-medium ${selectedMenu === menu
                                ? 'bg-white/30 text-white'
                                : 'bg-blue-100 text-blue-800'
                                }`}>
                                {menuDetails.category}
                              </span>
                              <span className={`font-semibold ${selectedMenu === menu ? 'text-white' : 'text-gray-600'
                                }`}>
                                {menuDetails.calories}kcal
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {justStopped && (
                        <span className="text-sm text-green-600 font-bold px-3 py-1 bg-white rounded-lg">
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
                <p className="text-base text-blue-800 font-medium animate-bounce bg-blue-50 py-3 px-4 rounded-xl border-2 border-blue-200">
                  👆 메뉴를 클릭해서 선택하세요!
                </p>
              </div>
            )}

            {/* 선택한 메뉴 상세 정보 */}
            {!isSpinning && selectedMenu && selectedMenuDetails && (
              <div className="mt-5 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl">
                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>🎊</span>
                  <span>선택한 메뉴</span>
                </h4>
                <div className="bg-white/80 rounded-xl p-4 mb-4 border border-blue-200/60">
                  <p className="text-2xl font-bold text-gray-900 mb-2">{selectedMenu}</p>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                      {selectedMenuDetails.category}
                    </span>
                    <span className="text-gray-600 font-semibold">
                      {selectedMenuDetails.calories}kcal
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleSaveToHistory}
                  className="w-full py-3.5 font-bold text-base rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-glow hover:from-green-600 hover:to-emerald-600 transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
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
