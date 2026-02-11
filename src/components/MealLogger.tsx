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
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const categories = ['전체', '한식', '중식', '일식', '양식', '분식', '기타'];

  const filteredMenus =
    selectedCategory === '전체'
      ? menuDatabase
      : menuDatabase.filter((menu) => menu.category === selectedCategory);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('이미지 크기는 2MB 이하여야 합니다!');
      return;
    }

    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImage(base64String);
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

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
      imageUrl: image || undefined,
    };
    saveMealRecord(record);
    alert(`${menuToSave}를 ${getMealTypeLabel(mealType)}로 기록했습니다!`);

    setCustomMenu('');
    setSelectedMenu('');
    setImage(null);
    setImagePreview(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="glass border border-black/20 rounded-3xl shadow-strong p-6 backdrop-blur-xl">
        <div className="text-center mb-5">
          <span className="text-3xl">📝</span>
          <h2 className="text-xl font-bold text-gray-900 mt-2 mb-1 tracking-tight">
            식사 기록하기
          </h2>
        </div>

        <div className="space-y-4">
          {/* 날짜 선택 */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              📅 날짜
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-black/20 bg-white/80 rounded-xl focus:border-gray-700 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all text-sm backdrop-blur-sm"
            />
          </div>

          {/* 식사 시간대 선택 */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              ⏰ 식사 시간
            </label>
            <div className="flex gap-2">
              {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                    mealType === type
                      ? 'bg-gradient-to-r from-gray-800 to-black text-white shadow-glow'
                      : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-soft'
                  }`}
                >
                  {getMealTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* 카테고리 선택 */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              🏷️ 카테고리
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-300 transform hover:scale-105 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-gray-800 to-black text-white shadow-glow'
                      : 'bg-white/70 text-gray-700 hover:bg-white hover:shadow-soft'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 메뉴 선택 */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              🍽️ 메뉴 선택
            </label>
            <div className="grid grid-cols-3 gap-1.5 max-h-52 overflow-y-auto p-2 bg-white/50 rounded-xl border border-black/20 backdrop-blur-sm">
              {filteredMenus.map((menu) => (
                <button
                  key={menu.name}
                  onClick={() => setSelectedMenu(menu.name)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 transform hover:scale-105 ${
                    selectedMenu === menu.name
                      ? 'bg-gradient-to-r from-gray-800 to-black text-white shadow-glow'
                      : 'bg-white/80 text-gray-700 hover:bg-white hover:shadow-soft border border-black/20'
                  }`}
                >
                  <div className="truncate">{menu.name}</div>
                  <div className={`text-[10px] mt-0.5 ${selectedMenu === menu.name ? 'text-white/80' : 'text-gray-500'}`}>
                    {menu.calories}kcal
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 직접 입력 */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
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
              className="w-full px-4 py-2.5 border-2 border-black/20 bg-white/80 rounded-xl focus:border-gray-700 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all text-sm backdrop-blur-sm"
            />
          </div>

          {/* 사진 업로드 */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              📷 식사 사진 (선택, 최대 2MB)
            </label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="식사 미리보기"
                  className="w-full h-48 object-cover rounded-xl border-2 border-black/20"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700 transition-all shadow-lg"
                >
                  🗑️ 삭제
                </button>
              </div>
            ) : (
              <label className="block w-full px-4 py-8 border-2 border-dashed border-black/20 bg-white/80 rounded-xl hover:border-gray-700 hover:bg-white transition-all cursor-pointer text-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">📷</span>
                  <span className="text-sm text-gray-700 font-medium">사진 업로드</span>
                  <span className="text-xs text-gray-600">클릭하여 이미지 선택</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-gradient-to-r from-gray-800 to-black text-white font-bold text-base rounded-xl hover:from-gray-900 hover:to-gray-800 hover:shadow-glow transition-all duration-300 transform hover:scale-105"
          >
            기록하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealLogger;
