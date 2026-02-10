import { useState, useEffect } from 'react';
import { calculateBMI, type BMIResult } from '../utils/bmiCalculator';
import { getProfile, saveProfile } from '../utils/storage';

const BMICalculator = () => {
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [result, setResult] = useState<BMIResult | null>(null);

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      setHeight(profile.height.toString());
      setWeight(profile.weight.toString());

      if (profile.height && profile.weight) {
        const bmiResult = calculateBMI(profile.height, profile.weight);
        setResult(bmiResult);
      }
    }
  }, []);

  const handleCalculate = () => {
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (!heightNum || !weightNum || heightNum <= 0 || weightNum <= 0) {
      alert('올바른 키와 몸무게를 입력해주세요!');
      return;
    }

    const bmiResult = calculateBMI(heightNum, weightNum);
    setResult(bmiResult);

    saveProfile({
      height: heightNum,
      weight: weightNum,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="glass border border-white/30 rounded-3xl shadow-strong p-6 backdrop-blur-xl">
        <div className="text-center mb-5">
          <span className="text-3xl">⚖️</span>
          <h2 className="text-xl font-bold text-gray-800 mt-2 mb-1 tracking-tight">
            BMI 계산기
          </h2>
        </div>

        <div className="space-y-4">
          {/* 키 입력 */}
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

          {/* 몸무게 입력 */}
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

          {/* 계산 버튼 */}
          <button
            onClick={handleCalculate}
            className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-base rounded-xl hover:from-purple-600 hover:to-pink-600 hover:shadow-glow transition-all duration-300 transform hover:scale-105"
          >
            📊 BMI 계산하기
          </button>

          {/* 결과 표시 */}
          {result && (
            <div className="mt-6 p-5 bg-white/50 border border-white/50 rounded-2xl backdrop-blur-sm">
              <div className="text-center mb-4">
                <p className="text-xs text-gray-600 mb-1">당신의 BMI는</p>
                <p className="text-4xl font-bold text-gray-800 mb-1">
                  {result.bmi}
                </p>
                <p className={`text-2xl font-semibold ${result.color}`}>
                  {result.category}
                </p>
              </div>

              <div className="bg-white/80 border border-white/50 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-gray-700 leading-relaxed text-sm">
                  {result.description}
                </p>
              </div>

              <div className="mt-4 text-xs text-gray-600 space-y-2">
                <p className="font-semibold text-gray-800">📋 BMI 기준</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-white/80 border border-white/50 rounded-lg p-2 backdrop-blur-sm">
                    <span className="text-blue-600 font-medium">저체중:</span> 18.5 미만
                  </div>
                  <div className="bg-white/80 border border-white/50 rounded-lg p-2 backdrop-blur-sm">
                    <span className="text-green-600 font-medium">정상:</span> 18.5 ~ 23
                  </div>
                  <div className="bg-white/80 border border-white/50 rounded-lg p-2 backdrop-blur-sm">
                    <span className="text-yellow-600 font-medium">과체중:</span> 23 ~ 25
                  </div>
                  <div className="bg-white/80 border border-white/50 rounded-lg p-2 backdrop-blur-sm">
                    <span className="text-orange-600 font-medium">비만:</span> 25 ~ 30
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BMICalculator;
