import { useState } from 'react';
import type { MealType, MealRecord } from '../types';
import { menuDatabase } from '../data/menuDatabase';
import { saveMealRecord } from '../utils/storage';
import { formatDate, getMealTypeLabel } from '../utils/recommendationEngine';

const MealLogger = () => {
  const today = formatDate(new Date());
  const [date, setDate] = useState(today);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [customMenu, setCustomMenu] = useState('');
  const [selectedMenu, setSelectedMenu] = useState('');

  const categories = ['전체', '한식', '중식', '일식', '양식', '분식', '기타'];

  const filteredMenus =
    selectedCategory === '전체'
      ? menuDatabase
      : menuDatabase.filter((menu) => menu.category === selectedCategory);

  const handleSave = () => {
    const menuToSave = selectedMenu || customMenu;
    if (!menuToSave.trim()) {
      alert('메뉴를 선택하거나 입력해주세요!');
      return;
    }

    const record: MealRecord = {
      id: crypto.randomUUID(),
      date,
      mealType,
      menu: menuToSave,
      timestamp: Date.now(),
    };
    saveMealRecord(record);
    alert(`${menuToSave}를 ${getMealTypeLabel(mealType)}로 기록했습니다!`);

    setCustomMenu('');
    setSelectedMenu('');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="text-center mb-5">
          <span className="text-3xl">📝</span>
          <h2 className="text-xl font-bold text-black mt-2 mb-1 tracking-tight">
            식사 기록하기
          </h2>
        </div>

        <div className="space-y-4">
          {/* 날짜 선택 */}
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">
              📅 날짜
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-black focus:outline-none transition-colors text-sm"
            />
          </div>

          {/* 식사 시간대 선택 */}
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">
              ⏰ 식사 시간
            </label>
            <div className="flex gap-2">
              {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    mealType === type
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getMealTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* 카테고리 선택 */}
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">
              🏷️ 카테고리
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 메뉴 선택 */}
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">
              🍽️ 메뉴 선택
            </label>
            <div className="grid grid-cols-3 gap-1.5 max-h-52 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
              {filteredMenus.map((menu) => (
                <button
                  key={menu.name}
                  onClick={() => setSelectedMenu(menu.name)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectedMenu === menu.name
                      ? 'bg-black text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {menu.name}
                </button>
              ))}
            </div>
          </div>

          {/* 직접 입력 */}
          <div>
            <label className="block text-xs font-semibold text-black mb-1.5">
              ✍️ 또는 직접 입력
            </label>
            <input
              type="text"
              value={customMenu}
              onChange={(e) => {
                setCustomMenu(e.target.value);
                setSelectedMenu('');
              }}
              placeholder="메뉴 이름을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-black focus:outline-none transition-colors text-sm"
            />
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            className="w-full py-3 bg-black text-white font-semibold text-base rounded-xl hover:bg-gray-800 transition-colors duration-200"
          >
            기록하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealLogger;
