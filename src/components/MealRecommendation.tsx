import { useState } from 'react';
import type { MealRecord } from '../types';
import {
  getCurrentMealType,
  getMealTypeLabel,
  getRecommendedMenus,
  formatDate,
} from '../utils/recommendationEngine';
import { saveMealRecord } from '../utils/storage';

const MealRecommendation = () => {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string>('');
  const currentMealType = getCurrentMealType();

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

  const handleGetRecommendations = () => {
    const menus = getRecommendedMenus(currentMealType, 5);
    setRecommendations(menus);
    setSelectedMenu('');
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
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">{getMealIcon()}</div>
          <h2 className="text-xl font-bold text-black mb-1 tracking-tight">
            {getMealTypeLabel(currentMealType)} 메뉴 추천
          </h2>
          <p className="text-gray-500 text-xs">
            오늘 먹은 메뉴를 고려해서 추천해드려요
          </p>
        </div>

        <button
          onClick={handleGetRecommendations}
          className="w-full py-3 bg-black text-white font-semibold text-base rounded-xl hover:bg-gray-800 transition-colors duration-200 mb-5 flex items-center justify-center gap-2"
        >
          <span>✨</span>
          <span>추천 받기</span>
        </button>

        {recommendations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-xl">🎯</span>
              <h3 className="text-lg font-semibold text-black">
                추천 메뉴
              </h3>
            </div>
            {recommendations.map((menu, index) => (
              <div
                key={menu}
                className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                  selectedMenu === menu
                    ? 'border-black bg-black text-white shadow-lg'
                    : 'border-gray-200 hover:border-black hover:shadow-md bg-white'
                }`}
                onClick={() => handleSelectMenu(menu)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{foodEmojis[index % foodEmojis.length]}</span>
                    <span className="text-base font-medium">{menu}</span>
                  </div>
                  {selectedMenu === menu && (
                    <span className="text-white">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MealRecommendation;
