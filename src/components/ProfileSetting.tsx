import { useState, useEffect } from 'react';
import { getProfile, saveProfile, clearAllData } from '../utils/storage';
import { calculateBMI } from '../utils/bmiCalculator';

const ProfileSetting = () => {
  const [name, setName] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [calorieGoal, setCalorieGoal] = useState('');

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      setName(profile.name || '');
      setHeight(profile.height.toString());
      setWeight(profile.weight.toString());
      setCalorieGoal(profile.calorieGoal?.toString() || '');
    }
  }, []);

  const handleSave = () => {
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const calorieGoalNum = calorieGoal ? parseFloat(calorieGoal) : undefined;

    if (!heightNum || !weightNum || heightNum <= 0 || weightNum <= 0) {
      alert('올바른 키와 몸무게를 입력해주세요!');
      return;
    }

    if (calorieGoalNum && calorieGoalNum <= 0) {
      alert('올바른 칼로리 목표를 입력해주세요!');
      return;
    }

    saveProfile({
      name: name.trim() || undefined,
      height: heightNum,
      weight: weightNum,
      calorieGoal: calorieGoalNum,
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
      setCalorieGoal('');
      alert('모든 데이터가 삭제되었습니다.');
    }
  };

  // BMI 계산 (키와 몸무게가 있을 때만)
  const getBMIInfo = () => {
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (heightNum > 0 && weightNum > 0) {
      return calculateBMI(heightNum, weightNum);
    }
    return null;
  };

  const bmiInfo = getBMIInfo();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="glass border border-black/20 rounded-3xl shadow-strong p-6 backdrop-blur-xl">
        <div className="text-center mb-5">
          <span className="text-3xl">⚙️</span>
          <h2 className="text-xl font-bold text-gray-900 mt-2 mb-1 tracking-tight">
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
              className="w-full px-4 py-2.5 border-2 border-black/20 bg-white/80 rounded-xl focus:border-gray-700 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all text-sm backdrop-blur-sm"
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
              className="w-full px-4 py-2.5 border-2 border-black/20 bg-white/80 rounded-xl focus:border-gray-700 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all text-sm backdrop-blur-sm"
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
              className="w-full px-4 py-2.5 border-2 border-black/20 bg-white/80 rounded-xl focus:border-gray-700 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all text-sm backdrop-blur-sm"
            />
          </div>

          {/* BMI 정보 표시 */}
          {bmiInfo && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-400 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-700 mb-1">현재 BMI 지수</p>
                  <p className="text-2xl font-bold text-gray-900">{bmiInfo.bmi}</p>
                  <p className={`text-sm font-semibold ${bmiInfo.color}`}>
                    {bmiInfo.category}
                  </p>
                </div>
                <div className="text-4xl">⚖️</div>
              </div>
            </div>
          )}

          {/* 칼로리 목표 */}
          <div>
            <label className="block text-xs font-semibold text-gray-800 mb-1.5">
              🎯 하루 칼로리 목표 (kcal, 선택)
            </label>
            <input
              type="number"
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(e.target.value)}
              placeholder="2000"
              className="w-full px-4 py-2.5 border-2 border-black/20 bg-white/80 rounded-xl focus:border-gray-700 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all text-sm backdrop-blur-sm"
            />
            <p className="text-[10px] text-gray-500 mt-1 ml-1">
              입력 시 히스토리에서 일일 칼로리 섭취량을 추적할 수 있어요
            </p>
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-gradient-to-r from-gray-800 to-black text-white font-bold text-base rounded-xl hover:from-gray-900 hover:to-gray-800 hover:shadow-glow transition-all duration-300 transform hover:scale-105"
          >
            💾 프로필 저장
          </button>

          {/* 데이터 초기화 */}
          <div className="pt-6 border-t border-black/20">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              🗂️ 데이터 관리
            </h3>
            <button
              onClick={handleClearData}
              className="w-full py-2.5 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-pink-700 hover:shadow-glow transition-all border border-black/20 text-sm transform hover:scale-105 duration-300"
            >
              🗑️ 모든 데이터 삭제
            </button>
            <p className="text-xs text-gray-700 mt-1.5 text-center">
              프로필, 식사 기록, 커스텀 메뉴가 모두 삭제됩니다
            </p>
          </div>

          {/* 앱 정보 */}
          <div className="pt-6 border-t border-black/20 text-center">
            <p className="text-gray-900 font-semibold mb-1 text-sm">
              MealLog v1.1
            </p>
            <p className="text-xs text-gray-700">
              맛있는 하루를 기록하세요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetting;
