import { useState, useEffect } from 'react';
import { calculateBMI, type BMIResult } from '../utils/bmiCalculator';
import { getProfile, saveProfile } from '../utils/storage';
import { useToast } from '../context/ToastContext';
import type { Gender } from '../types';

const BMICalculator = () => {
  const toast = useToast();
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [result, setResult] = useState<BMIResult | null>(null);

  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      setHeight(profile.height?.toString() ?? '');
      setWeight(profile.weight?.toString() ?? '');
      setGender(profile.gender ?? '');
      if (profile.height && profile.weight) {
        setResult(calculateBMI(profile.height, profile.weight));
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
    saveProfile({ ...existingProfile, height: heightNum, weight: weightNum, gender: gender || undefined });
  };

  // BMI 10~40 범위에서 게이지 퍼센트 계산
  const gaugePercent = result
    ? Math.min(100, Math.max(0, ((result.bmi - 10) / 30) * 100))
    : null;

  const inputClass =
    'w-full px-4 py-2.5 border border-apple-border bg-white rounded-lg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 focus:outline-none transition-all text-sm';

  const categoryColorMap: Record<string, { bg: string; text: string }> = {
    저체중:    { bg: 'bg-blue-100',   text: 'text-blue-700'   },
    정상:      { bg: 'bg-green-100',  text: 'text-green-700'  },
    과체중:    { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    '비만 1단계': { bg: 'bg-orange-100', text: 'text-orange-700' },
    '비만 2단계': { bg: 'bg-red-100',    text: 'text-red-700'    },
  };

  const currentColors = result ? (categoryColorMap[result.category] ?? { bg: 'bg-gray-100', text: 'text-gray-700' }) : null;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">

      {/* ─── 입력 카드 ─── */}
      <div className="bg-white rounded-2xl border border-apple-border-light shadow-soft p-6">
        <div className="text-center mb-5">
          <span className="text-3xl animate-float inline-block">⚖️</span>
          <h2 className="text-xl font-bold text-apple-text mt-2 mb-1 tracking-tight">BMI 계산기</h2>
          <p className="text-xs text-apple-secondary">체질량지수로 나의 체중 상태를 확인해보세요</p>
        </div>

        <div className="space-y-4">
          {/* 성별 선택 */}
          <div>
            <label className="block text-xs font-semibold text-apple-secondary mb-1.5">성별</label>
            <div className="flex gap-3">
              {([['male', '👨 남성'], ['female', '👩 여성']] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setGender(val)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                    gender === val
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-apple-secondary border-apple-border hover:border-brand-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 키 / 몸무게 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-apple-secondary mb-1.5">키 (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-apple-secondary mb-1.5">몸무게 (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="65"
                className={inputClass}
              />
            </div>
          </div>

          <button
            onClick={handleCalculate}
            className="w-full py-3.5 bg-brand-500 text-white font-semibold text-base rounded-lg hover:bg-brand-600 active:bg-brand-700 transition-colors duration-150"
          >
            BMI 계산하기
          </button>
        </div>
      </div>

      {/* ─── 결과 카드 ─── */}
      {result && currentColors && (
        <div className="bg-white rounded-2xl border border-apple-border-light shadow-soft p-6">
          <div className="text-center mb-5">
            <p className="text-xs text-apple-secondary mb-1">나의 BMI 지수</p>
            <p className="text-5xl font-bold text-apple-text mb-3">{result.bmi}</p>
            <span className={`inline-block px-5 py-1.5 rounded-full text-sm font-bold ${currentColors.bg} ${currentColors.text}`}>
              {result.category}
            </span>
          </div>

          {/* 게이지 바 */}
          {gaugePercent !== null && (
            <div className="mb-4">
              <div className="relative h-3 rounded-full overflow-hidden"
                style={{ background: 'linear-gradient(to right, #60a5fa, #34d399, #facc15, #fb923c, #ef4444)' }}>
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-700 rounded-full shadow-md -translate-x-1/2 transition-all duration-700"
                  style={{ left: `${gaugePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-apple-secondary mt-1.5 px-0.5">
                <span>저체중</span>
                <span>정상</span>
                <span>과체중</span>
                <span>비만</span>
                <span>고도비만</span>
              </div>
            </div>
          )}

          <div className="bg-apple-bg border border-apple-border-light rounded-xl p-3">
            <p className="text-sm text-apple-secondary leading-relaxed">{result.description}</p>
          </div>

          {/* 성별별 참고 */}
          {gender && (
            <div className={`mt-3 p-3 rounded-xl border text-xs ${
              gender === 'male'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-pink-50 border-pink-200 text-pink-700'
            }`}>
              {gender === 'male'
                ? '👨 남성은 근육량이 많아 BMI가 높게 나올 수 있어요. 건강한 체지방률 기준은 15~20%입니다.'
                : '👩 여성은 호르몬 특성상 체지방이 남성보다 자연적으로 높아요. 건강한 체지방률 기준은 20~25%입니다.'}
            </div>
          )}
        </div>
      )}

      {/* ─── 판정기준 표 ─── */}
      <div className="bg-white rounded-2xl border border-apple-border-light shadow-soft p-6">
        <h3 className="text-sm font-bold text-apple-text mb-3">📊 BMI 판정기준</h3>
        <p className="text-[11px] text-apple-secondary mb-3">대한비만학회 기준 (아시아·한국인 기준 적용)</p>
        <div className="overflow-hidden rounded-xl border border-apple-border-light">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-apple-bg">
                <th className="py-2.5 px-3 text-left font-semibold text-apple-secondary">판정</th>
                <th className="py-2.5 px-3 text-center font-semibold text-apple-secondary">BMI</th>
                <th className="py-2.5 px-3 text-center font-semibold text-blue-500">남성 체지방률</th>
                <th className="py-2.5 px-3 text-center font-semibold text-pink-500">여성 체지방률</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: '저체중',    range: '< 18.5',        mFat: '< 10%',    fFat: '< 17%',    textColor: 'text-blue-600',   bg: '' },
                { label: '정상',      range: '18.5 ~ 23.0',   mFat: '10 ~ 20%', fFat: '17 ~ 27%', textColor: 'text-green-600',  bg: 'bg-green-50' },
                { label: '과체중',    range: '23.0 ~ 25.0',   mFat: '20 ~ 25%', fFat: '27 ~ 32%', textColor: 'text-yellow-600', bg: '' },
                { label: '비만 1단계', range: '25.0 ~ 30.0',  mFat: '25 ~ 30%', fFat: '32 ~ 37%', textColor: 'text-orange-600', bg: '' },
                { label: '비만 2단계', range: '≥ 30.0',       mFat: '> 30%',    fFat: '> 37%',    textColor: 'text-red-600',    bg: '' },
              ].map((row) => (
                <tr key={row.label} className={`border-t border-apple-border-light ${row.bg}`}>
                  <td className={`py-2.5 px-3 font-semibold ${row.textColor}`}>{row.label}</td>
                  <td className="py-2.5 px-3 text-center text-apple-text font-medium">{row.range}</td>
                  <td className="py-2.5 px-3 text-center text-blue-600">{row.mFat}</td>
                  <td className="py-2.5 px-3 text-center text-pink-600">{row.fFat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-apple-secondary mt-2">* 체지방률은 참고 수치이며 개인차가 있습니다. WHO 기준은 25 이상을 과체중으로 봅니다.</p>
      </div>

      {/* ─── 계산법 ─── */}
      <div className="bg-white rounded-2xl border border-apple-border-light shadow-soft p-6">
        <h3 className="text-sm font-bold text-apple-text mb-3">📐 BMI 계산법</h3>

        <div className="bg-apple-bg border border-apple-border-light rounded-xl p-4 text-center mb-4">
          <p className="text-base font-bold text-apple-text">BMI = 체중(kg) ÷ 키(m)²</p>
          {height && weight && parseFloat(height) > 0 && parseFloat(weight) > 0 && (
            <p className="text-xs text-brand-500 mt-2">
              내 계산: {weight}kg ÷ ({(parseFloat(height) / 100).toFixed(2)}m)² ={' '}
              <span className="font-bold">{result?.bmi ?? '—'}</span>
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-apple-border-light">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-apple-bg">
                <th className="py-2.5 px-3 text-left font-semibold text-apple-secondary">항목</th>
                <th className="py-2.5 px-3 text-left font-semibold text-apple-secondary">설명</th>
              </tr>
            </thead>
            <tbody>
              {[
                { item: '공식', desc: '체중(kg) ÷ 신장(m)²' },
                { item: '단위', desc: '단위 없음 (kg/m²)' },
                { item: '예시', desc: '키 170cm, 몸무게 65kg → 65 ÷ 1.70² ≈ 22.5 (정상)' },
                { item: '기준', desc: '한국·아시아는 23 이상을 과체중, WHO는 25 이상을 과체중으로 분류' },
                { item: '고안자', desc: '아돌프 케틀레 (Adolphe Quetelet), 1832년' },
              ].map((row, i) => (
                <tr key={row.item} className={i > 0 ? 'border-t border-apple-border-light' : ''}>
                  <td className="py-2.5 px-3 font-semibold text-apple-text whitespace-nowrap">{row.item}</td>
                  <td className="py-2.5 px-3 text-apple-secondary">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 주의사항 ─── */}
      <div className="bg-white rounded-2xl border border-apple-border-light shadow-soft p-6">
        <h3 className="text-sm font-bold text-apple-text mb-1">⚠️ BMI 활용 시 주의사항</h3>
        <p className="text-xs text-apple-secondary mb-4">
          BMI는 체중과 키만으로 계산하는 <span className="font-semibold">대략적인 지표</span>예요. 아래 경우엔 실제 건강 상태와 다를 수 있습니다.
        </p>
        <div className="space-y-2">
          {[
            {
              icon: '💪',
              title: '근육량이 많은 분 (헬스인)',
              desc: '근육이 지방보다 무겁기 때문에 BMI가 높게 나와도 실제로는 건강한 상태일 수 있어요.',
              bg: 'bg-blue-50 border-blue-100',
              titleColor: 'text-blue-800',
              descColor: 'text-blue-700',
            },
            {
              icon: '🫣',
              title: '마른 비만',
              desc: '몸무게는 적어도 체지방이 많은 경우, BMI는 정상이지만 건강 위험이 있을 수 있어요.',
              bg: 'bg-amber-50 border-amber-100',
              titleColor: 'text-amber-800',
              descColor: 'text-amber-700',
            },
            {
              icon: '👵',
              title: '성장기·노인',
              desc: '근육량과 골밀도가 달라 같은 BMI라도 체성분이 다를 수 있어 주의가 필요합니다.',
              bg: 'bg-purple-50 border-purple-100',
              titleColor: 'text-purple-800',
              descColor: 'text-purple-700',
            },
          ].map(({ icon, title, desc, bg, titleColor, descColor }) => (
            <div key={title} className={`flex gap-3 p-3 border rounded-xl ${bg}`}>
              <span className="text-xl shrink-0">{icon}</span>
              <div>
                <p className={`text-xs font-semibold ${titleColor}`}>{title}</p>
                <p className={`text-xs mt-0.5 ${descColor}`}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-apple-secondary mt-4 text-center">
          정확한 체성분 분석은 <span className="font-semibold">인바디 측정</span>을 권장합니다.
        </p>
      </div>

    </div>
  );
};

export default BMICalculator;
