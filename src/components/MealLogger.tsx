import { useState } from 'react';
import type { MealType, MealRecord } from '../types';
import { saveMealRecord } from '../utils/storage';
import { formatDate, getMealTypeLabel, getAllMenuItems } from '../utils/recommendationEngine';
import { saveImage } from '../utils/imageStorage';
import { useToast } from '../context/ToastContext';

const inputClass = "w-full px-4 py-2.5 border border-apple-border bg-white rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all text-sm";

const MealLogger = () => {
  const toast = useToast();
  const today = formatDate(new Date());
  const [date, setDate] = useState(today);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [customMenu, setCustomMenu] = useState('');
  const [selectedMenu, setSelectedMenu] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);

  const categories = ['전체', '한식', '중식', '일식', '양식', '분식', '기타'];
  const allMenus = getAllMenuItems();
  const filteredMenus =
    selectedCategory === '전체'
      ? allMenus
      : allMenus.filter((menu) => menu.category === selectedCategory);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('이미지 크기는 5MB 이하여야 합니다!');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImageData(base64);
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageData(null);
    setImagePreview(null);
  };

  const handleSave = async () => {
    const menuToSave = selectedMenu || customMenu;
    if (!menuToSave.trim()) {
      toast.warning('메뉴를 선택하거나 입력해주세요!');
      return;
    }

    const id = crypto.randomUUID();
    let imageUrl: string | undefined;

    if (imageData) {
      try {
        await saveImage(id, imageData);
        imageUrl = `idb:${id}`;
      } catch {
        toast.error('이미지 저장에 실패했습니다. 텍스트만 저장합니다.');
      }
    }

    const record: MealRecord = {
      id,
      date,
      mealType,
      menu: menuToSave,
      timestamp: Date.now(),
      imageUrl,
    };
    saveMealRecord(record);
    toast.success(`${menuToSave}를 ${getMealTypeLabel(mealType)}로 기록했습니다!`);

    setCustomMenu('');
    setSelectedMenu('');
    setImageData(null);
    setImagePreview(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-2xl border border-apple-border-light shadow-soft p-6">
        <div className="text-center mb-5">
          <span className="text-3xl animate-float inline-block">📝</span>
          <h2 className="text-xl font-bold text-apple-text mt-2 mb-1 tracking-tight">
            식사 기록하기
          </h2>
        </div>

        <div className="space-y-4">
          {/* 날짜 선택 */}
          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1.5">
              날짜
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* 식사 시간대 선택 */}
          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1.5">
              식사 시간
            </label>
            <div className="flex gap-2">
              {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setMealType(type)}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${mealType === type
                      ? 'bg-brand-500 text-white'
                      : 'bg-apple-bg text-apple-secondary hover:bg-gray-200 border border-apple-border-light'
                    }`}
                >
                  {getMealTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* 카테고리 선택 */}
          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1.5">
              카테고리
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-200 ${selectedCategory === category
                      ? 'bg-brand-500 text-white'
                      : 'bg-apple-bg text-apple-secondary hover:bg-gray-200 border border-apple-border-light'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 메뉴 선택 */}
          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1.5">
              메뉴 선택
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto p-2 bg-apple-bg rounded-lg border border-apple-border-light">
              {filteredMenus.map((menu) => (
                <button
                  key={menu.name}
                  onClick={() => { setSelectedMenu(menu.name); setCustomMenu(''); }}
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${selectedMenu === menu.name
                      ? 'bg-brand-500 text-white'
                      : 'bg-white text-apple-text hover:bg-brand-50 border border-apple-border-light'
                    }`}
                >
                  <div className="truncate">{menu.name}</div>
                  {menu.calories > 0 && (
                    <div className={`text-xs mt-0.5 ${selectedMenu === menu.name ? 'text-white/80' : 'text-apple-secondary'}`}>
                      {menu.calories}kcal
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 직접 입력 */}
          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1.5">
              또는 직접 입력
            </label>
            <input
              type="text"
              value={customMenu}
              onChange={(e) => {
                setCustomMenu(e.target.value);
                setSelectedMenu('');
              }}
              placeholder="메뉴 이름을 입력하세요"
              className={inputClass}
            />
          </div>

          {/* 사진 업로드 */}
          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1.5">
              식사 사진 (선택, 최대 5MB)
            </label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="식사 미리보기"
                  className="w-full h-48 object-cover rounded-lg border border-apple-border-light"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-all shadow-medium"
                >
                  🗑️ 삭제
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <label className="flex-1 flex flex-col items-center gap-1.5 px-3 py-5 border-2 border-dashed border-apple-border bg-apple-bg rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-all cursor-pointer text-center">
                  <span className="text-2xl">📷</span>
                  <span className="text-xs text-apple-secondary font-semibold">카메라</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <label className="flex-1 flex flex-col items-center gap-1.5 px-3 py-5 border-2 border-dashed border-apple-border bg-apple-bg rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-all cursor-pointer text-center">
                  <span className="text-2xl">🖼️</span>
                  <span className="text-xs text-apple-secondary font-semibold">갤러리</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-brand-500 text-white font-semibold text-base rounded-lg hover:bg-brand-600 active:bg-brand-700 transition-colors duration-150"
          >
            기록하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default MealLogger;
