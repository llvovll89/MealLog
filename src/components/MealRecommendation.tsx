import { useState, useEffect, useRef } from 'react';
import type { MealRecord } from '../types';
import {
  getCurrentMealType,
  getMealTypeLabel,
  getRecommendedMenus,
  formatDate,
} from '../utils/recommendationEngine';
import { saveMealRecord } from '../utils/storage';
import { menuDatabase } from '../data/menuDatabase';

const MealRecommendation = () => {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string>('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [slotStates, setSlotStates] = useState<string[]>([]);
  const [stoppedSlots, setStoppedSlots] = useState<boolean[]>([false, false, false, false, false]);
  const currentMealType = getCurrentMealType();
  const intervalsRef = useRef<number[]>([]);

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
    // Clean up intervals on unmount
    return () => {
      intervalsRef.current.forEach(interval => clearInterval(interval));
    };
  }, []);

  const getRandomMenu = () => {
    return menuDatabase[Math.floor(Math.random() * menuDatabase.length)].name;
  };

  const handleGetRecommendations = () => {
    const finalMenus = getRecommendedMenus(currentMealType, 5);

    // Reset states
    setSelectedMenu('');
    setIsSpinning(true);
    setStoppedSlots([false, false, false, false, false]);
    setSlotStates(finalMenus);

    // Clear any existing intervals
    intervalsRef.current.forEach(interval => clearInterval(interval));
    intervalsRef.current = [];

    // Create spinning effect for each slot
    const newIntervals: number[] = [];

    for (let i = 0; i < 5; i++) {
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

    // Stop each slot sequentially
    for (let i = 0; i < 5; i++) {
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

        // All slots stopped
        if (i === 4) {
          setTimeout(() => {
            setIsSpinning(false);
            setRecommendations(finalMenus);
          }, 300);
        }
      }, 1000 + i * 600); // First slot stops at 1s, then every 600ms
    }
  };

  const handleSelectMenu = (menu: string) => {
    const record: MealRecord = {
      id: crypto.randomUUID(),
      date: formatDate(new Date()),
      mealType: currentMealType,
      menu,
      timestamp: Date.now(),
    };
    saveMealRecord(record);
    setSelectedMenu(menu);
    alert(`${menu}를 ${getMealTypeLabel(currentMealType)} 메뉴로 기록했습니다!`);
  };

  const foodEmojis = ['🍜', '🍕', '🍔', '🍱', '🥗'];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="glass border border-white/30 rounded-3xl shadow-strong p-6 backdrop-blur-xl animate-fade-in">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">{getMealIcon()}</div>
          <h2 className="text-xl font-bold text-gray-800 mb-1 tracking-tight">
            {getMealTypeLabel(currentMealType)} 메뉴 추천
          </h2>
          <p className="text-gray-600 text-xs">
            오늘 먹은 메뉴를 고려해서 추천해드려요
          </p>
        </div>

        <button
          onClick={handleGetRecommendations}
          disabled={isSpinning}
          className={`w-full py-3.5 font-bold text-base rounded-xl transition-all duration-300 transform hover:scale-105 mb-5 flex items-center justify-center gap-2 ${
            isSpinning
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-glow hover:from-purple-600 hover:to-pink-600'
          }`}
        >
          <span>{isSpinning ? '🎰' : '✨'}</span>
          <span>{isSpinning ? '추천 중...' : '추천 받기'}</span>
        </button>

        {(slotStates.length > 0 || recommendations.length > 0) && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-xl">🎯</span>
              <h3 className="text-lg font-semibold text-gray-800">
                {isSpinning ? '메뉴 뽑는 중...' : '추천 메뉴'}
              </h3>
            </div>

            <div className="space-y-2">
              {(isSpinning ? slotStates : recommendations).map((menu, index) => {
                const isCurrentlySpinning = isSpinning && !stoppedSlots[index];
                const justStopped = isSpinning && stoppedSlots[index];

                return (
                  <div
                    key={`${menu}-${index}`}
                    className={`p-4 rounded-2xl border transition-all duration-300 ${
                      isCurrentlySpinning
                        ? 'border-purple-400 bg-gradient-to-br from-purple-100 via-pink-100 to-purple-100 animate-pulse shadow-medium scale-105'
                        : justStopped
                        ? 'border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg scale-105'
                        : selectedMenu === menu
                        ? 'border-white bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-glow cursor-pointer'
                        : 'border-white/50 hover:border-purple-400 hover:shadow-medium bg-white/80 cursor-pointer hover:scale-105'
                    }`}
                    onClick={() => !isSpinning && handleSelectMenu(menu)}
                    style={{
                      pointerEvents: isSpinning ? 'none' : 'auto',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {isCurrentlySpinning ? '🎰' : foodEmojis[index % foodEmojis.length]}
                        </span>
                        <div>
                          <span className={`text-base font-medium block ${
                            isCurrentlySpinning ? 'blur-sm' : ''
                          }`}>
                            {menu}
                          </span>
                          {justStopped && (
                            <span className="text-xs text-green-600 font-semibold">
                              멈춤!
                            </span>
                          )}
                        </div>
                      </div>
                      {!isSpinning && selectedMenu === menu && (
                        <span className="text-white text-xl">✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {!isSpinning && recommendations.length > 0 && !selectedMenu && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 animate-bounce">
                  👆 메뉴를 클릭해서 선택하세요!
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
