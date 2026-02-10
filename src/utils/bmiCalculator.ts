export interface BMIResult {
  bmi: number;
  category: string;
  description: string;
  color: string;
}

export const calculateBMI = (heightCm: number, weightKg: number): BMIResult => {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const roundedBMI = Math.round(bmi * 10) / 10;

  let category = '';
  let description = '';
  let color = '';

  if (roundedBMI < 18.5) {
    category = '저체중';
    description = '체중이 부족한 상태입니다. 균형 잡힌 식사로 건강한 체중을 유지하세요.';
    color = 'text-blue-600';
  } else if (roundedBMI >= 18.5 && roundedBMI < 23) {
    category = '정상';
    description = '건강한 체중입니다! 현재 상태를 유지하세요.';
    color = 'text-green-600';
  } else if (roundedBMI >= 23 && roundedBMI < 25) {
    category = '과체중';
    description = '체중이 약간 높습니다. 규칙적인 운동과 건강한 식습관을 권장합니다.';
    color = 'text-yellow-600';
  } else if (roundedBMI >= 25 && roundedBMI < 30) {
    category = '비만 1단계';
    description = '비만 단계입니다. 식이요법과 운동을 통해 체중 관리가 필요합니다.';
    color = 'text-orange-600';
  } else {
    category = '비만 2단계';
    description = '고도 비만 단계입니다. 전문가와 상담하여 체계적인 관리가 필요합니다.';
    color = 'text-red-600';
  }

  return {
    bmi: roundedBMI,
    category,
    description,
    color,
  };
};
