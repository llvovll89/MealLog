import { useState, useEffect } from 'react';
import { calculateBMI, type BMIResult } from '../utils/bmiCalculator';
import { getProfile, saveProfile } from '../utils/storage';
import { useToast } from '../context/ToastContext';

const BMICalculator = () => {
  const toast = useToast();
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
      toast.warning('올바른 키와 몸무게를 입력해주세요!');
      return;
    }

    const bmiResult = calculateBMI(heightNum, weightNum);
    setResult(bmiResult);

    const existingProfile = getProfile();
    saveProfile({
      ...existingProfile,
      height: heightNum,
      weight: weightNum,
    });
  };

  const inputClass = "w-full px-4 py-2.5 border border-apple-border bg-white rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all text-sm";

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-2xl border border-apple-border-light shadow-soft p-6">
        <div className="text-center mb-5">
          <span className="text-3xl animate-float inline-block">⚖️</span>
          <h2 className="text-xl font-bold text-apple-text mt-2 mb-1 tracking-tight">
            BMI 계산기
          </h2>
        </div>

        <div className="space-y-4">
          {/* 키 입력 */}
          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1.5">
              키 (cm)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="170"
              className={inputClass}
            />
          </div>

          {/* 몸무게 입력 */}
          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1.5">
              몸무게 (kg)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="65"
              className={inputClass}
            />
          </div>

          {/* 계산 버튼 */}
          <button
            onClick={handleCalculate}
            className="w-full py-3.5 bg-brand-500 text-white font-semibold text-base rounded-lg hover:bg-brand-600 active:bg-brand-700 transition-colors duration-150"
          >
            BMI 계산하기
          </button>

          {/* 결과 표시 */}
          {result && (
            <div className="mt-6 p-5 bg-apple-bg border border-apple-border-light rounded-xl">
              <div className="text-center mb-4">
                <p className="text-xs text-apple-secondary mb-1">당신의 BMI는</p>
                <p className="text-4xl font-bold text-apple-text mb-1">
                  {result.bmi}
                </p>
                <p className={`text-2xl font-semibold ${result.color}`}>
                  {result.category}
                </p>
              </div>

              <div className="bg-white border border-apple-border-light rounded-xl p-3">
                <p className="text-apple-secondary leading-relaxed text-sm">
                  {result.description}
                </p>
              </div>

              <div className="mt-4 text-xs text-apple-secondary space-y-2">
                <p className="font-semibold text-apple-text">BMI 기준</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="bg-white border border-brand-200 rounded-lg p-2">
                    <span className="text-brand-500 font-medium">저체중:</span> 18.5 미만
                  </div>
                  <div className="bg-white border border-green-200 rounded-lg p-2">
                    <span className="text-green-600 font-medium">정상:</span> 18.5 ~ 23
                  </div>
                  <div className="bg-white border border-yellow-200 rounded-lg p-2">
                    <span className="text-yellow-600 font-medium">과체중:</span> 23 ~ 25
                  </div>
                  <div className="bg-white border border-red-200 rounded-lg p-2">
                    <span className="text-red-500 font-medium">비만:</span> 25 ~ 30
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
