import { useState, useEffect } from 'react';
import { getProfile, saveProfile, clearAllData } from '../utils/storage';

const ProfileSetting = () => {
  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      setName(profile.name || '');
      setHeight(profile.height.toString());
      setWeight(profile.weight.toString());
    }
  }, []);

  const handleSave = () => {
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (!heightNum || !weightNum || heightNum <= 0 || weightNum <= 0) {
      alert('올바른 키와 몸무게를 입력해주세요!');
      return;
    }

    saveProfile({
      name: name.trim() || undefined,
      height: heightNum,
      weight: weightNum,
    });
    alert('프로필이 저장되었습니다!');
  };

  const handleClearData = () => {
    if (
      confirm(
        '정말로 모든 데이터를 삭제하시겠습니까?\n프로필, 식사 기록, 커스텀 메뉴가 모두 삭제됩니다.'
      )
    ) {
      clearAllData();
      setName('');
      setHeight('');
      setWeight('');
      alert('모든 데이터가 삭제되었습니다.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="glass border border-white/30 rounded-3xl shadow-strong p-6 backdrop-blur-xl">
        <div className="text-center mb-5">
          <span className="text-3xl">⚙️</span>
          <h2 className="text-xl font-bold text-gray-800 mt-2 mb-1 tracking-tight">
            프로필 설정
          </h2>
        </div>

        <div className="space-y-4">
          {/* 이름 */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              👤 이름 (선택)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-2.5 border-2 border-white/50 bg-white/80 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 focus:outline-none transition-all text-sm backdrop-blur-sm"
            />
          </div>

          {/* 키 */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              📏 키 (cm)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="170"
              className="w-full px-4 py-2.5 border-2 border-white/50 bg-white/80 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 focus:outline-none transition-all text-sm backdrop-blur-sm"
            />
          </div>

          {/* 몸무게 */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              🏋️ 몸무게 (kg)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="65"
              className="w-full px-4 py-2.5 border-2 border-white/50 bg-white/80 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 focus:outline-none transition-all text-sm backdrop-blur-sm"
            />
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base rounded-xl hover:from-purple-600 hover:to-pink-600 hover:shadow-glow transition-all duration-300 transform hover:scale-105"
          >
            💾 프로필 저장
          </button>

          {/* 데이터 초기화 */}
          <div className="pt-6 border-t border-white/30">
            <h3 className="text-base font-semibold text-gray-800 mb-3">
              🗂️ 데이터 관리
            </h3>
            <button
              onClick={handleClearData}
              className="w-full py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 hover:shadow-glow transition-all border border-white/50 text-sm transform hover:scale-105 duration-300"
            >
              🗑️ 모든 데이터 삭제
            </button>
            <p className="text-xs text-gray-600 mt-1.5 text-center">
              프로필, 식사 기록, 커스텀 메뉴가 모두 삭제됩니다
            </p>
          </div>

          {/* 앱 정보 */}
          <div className="pt-6 border-t border-white/30 text-center">
            <p className="text-gray-800 font-semibold mb-1 text-sm">
              MealLog v1.0
            </p>
            <p className="text-xs text-gray-600">
              맛있는 하루를 기록하세요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetting;
