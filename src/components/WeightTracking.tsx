import { useState, useEffect } from 'react';
import type { WeightRecord } from '../types';
import { getWeightRecords, saveWeightRecord, deleteWeightRecord, getProfile, saveProfile } from '../utils/storage';
import { formatDate } from '../utils/recommendationEngine';

const WeightTracking = () => {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(formatDate(new Date()));
  const [note, setNote] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [showTargetInput, setShowTargetInput] = useState(false);

  useEffect(() => {
    loadRecords();
    const profile = getProfile();
    if (profile?.targetWeight) {
      setTargetWeight(profile.targetWeight.toString());
    }
  }, []);

  const loadRecords = () => {
    const allRecords = getWeightRecords()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setRecords(allRecords);
  };

  const handleSave = () => {
    const weightNum = parseFloat(weight);

    if (!weightNum || weightNum <= 0) {
      alert('올바른 체중을 입력해주세요!');
      return;
    }

    const record: WeightRecord = {
      id: crypto.randomUUID(),
      date,
      weight: weightNum,
      timestamp: Date.now(),
      note: note.trim() || undefined,
    };

    saveWeightRecord(record);
    loadRecords();
    setWeight('');
    setNote('');
    setDate(formatDate(new Date()));
    alert('체중이 기록되었습니다!');
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteWeightRecord(id);
      loadRecords();
    }
  };

  const handleSaveTarget = () => {
    const targetNum = parseFloat(targetWeight);

    if (!targetNum || targetNum <= 0) {
      alert('올바른 목표 체중을 입력해주세요!');
      return;
    }

    const profile = getProfile();
    if (profile) {
      saveProfile({
        ...profile,
        targetWeight: targetNum,
      });
      setShowTargetInput(false);
      alert('목표 체중이 저장되었습니다!');
    }
  };

  // 체중 변화 계산
  const getWeightChange = () => {
    if (records.length < 2) return null;

    const latest = records[0].weight;
    const oldest = records[records.length - 1].weight;
    const change = latest - oldest;

    return {
      change,
      percentage: ((change / oldest) * 100),
    };
  };

  const weightChange = getWeightChange();
  const currentWeight = records.length > 0 ? records[0].weight : null;
  const targetWeightNum = targetWeight ? parseFloat(targetWeight) : null;
  const remainingWeight = currentWeight && targetWeightNum ? currentWeight - targetWeightNum : null;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="glass border border-black/20 rounded-3xl shadow-strong p-6 backdrop-blur-xl">
        <div className="text-center mb-5">
          <span className="text-3xl">📈</span>
          <h2 className="text-xl font-bold text-gray-900 mt-2 mb-1 tracking-tight">
            체중 추적
          </h2>
          <p className="text-xs text-gray-700">
            체중을 기록하고 변화를 추적하세요
          </p>
        </div>

        {/* 현재 상태 */}
        {currentWeight && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white/50 border border-black/20 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-xs text-gray-700 mb-1">현재 체중</p>
              <p className="text-2xl font-bold text-gray-900">{currentWeight}kg</p>
            </div>
            {targetWeightNum && (
              <div className="bg-white/50 border border-black/20 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-xs text-gray-700 mb-1">목표 체중까지</p>
                <p className={`text-2xl font-bold ${
                  remainingWeight && remainingWeight > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {remainingWeight !== null ? `${remainingWeight > 0 ? '+' : ''}${remainingWeight.toFixed(1)}kg` : '-'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 체중 변화 */}
        {weightChange && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-400 rounded-2xl p-4 mb-5 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>📊</span>
              <span>전체 변화량</span>
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold ${
                  weightChange.change > 0 ? 'text-red-600' : weightChange.change < 0 ? 'text-green-600' : 'text-gray-900'
                }`}>
                  {weightChange.change > 0 ? '+' : ''}{weightChange.change.toFixed(1)}kg
                </p>
                <p className="text-xs text-gray-600">
                  {weightChange.percentage > 0 ? '+' : ''}{weightChange.percentage.toFixed(2)}%
                </p>
              </div>
              <div className="text-xs text-gray-700">
                총 {records.length}회 기록
              </div>
            </div>
          </div>
        )}

        {/* 목표 체중 설정 */}
        <div className="mb-5">
          {!showTargetInput ? (
            <div className="flex items-center justify-between bg-white/50 border border-black/20 rounded-xl p-3">
              <div>
                <p className="text-xs text-gray-700">목표 체중</p>
                <p className="font-semibold text-gray-900">
                  {targetWeightNum ? `${targetWeightNum}kg` : '설정 안 함'}
                </p>
              </div>
              <button
                onClick={() => setShowTargetInput(true)}
                className="px-4 py-2 bg-gradient-to-r from-gray-800 to-black text-white rounded-lg hover:from-gray-900 hover:to-gray-800 transition-all text-sm font-medium"
              >
                {targetWeightNum ? '변경' : '설정'}
              </button>
            </div>
          ) : (
            <div className="bg-white/50 border border-black/20 rounded-xl p-4">
              <label className="block text-xs font-semibold text-gray-800 mb-2">
                🎯 목표 체중 (kg)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="65"
                  className="flex-1 px-4 py-2.5 border-2 border-black/20 bg-white/80 rounded-xl focus:border-gray-700 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all text-sm"
                />
                <button
                  onClick={handleSaveTarget}
                  className="px-4 py-2.5 bg-gradient-to-r from-gray-800 to-black text-white rounded-xl hover:from-gray-900 hover:to-gray-800 transition-all text-sm font-medium"
                >
                  저장
                </button>
                <button
                  onClick={() => setShowTargetInput(false)}
                  className="px-4 py-2.5 bg-white/70 text-gray-700 rounded-xl hover:bg-white transition-all text-sm font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 체중 기록하기 */}
        <div className="bg-white/50 border border-black/20 rounded-2xl p-4 mb-5 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-3">📝 체중 기록하기</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                📅 날짜
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-black/20 bg-white/80 rounded-xl focus:border-gray-700 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                ⚖️ 체중 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="65.5"
                className="w-full px-4 py-2.5 border-2 border-black/20 bg-white/80 rounded-xl focus:border-gray-700 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-800 mb-1.5">
                📌 메모 (선택)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 아침 측정, 운동 후"
                className="w-full px-4 py-2.5 border-2 border-black/20 bg-white/80 rounded-xl focus:border-gray-700 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all text-sm"
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full py-3 bg-gradient-to-r from-gray-800 to-black text-white font-bold rounded-xl hover:from-gray-900 hover:to-gray-800 hover:shadow-glow transition-all transform hover:scale-105"
            >
              기록하기
            </button>
          </div>
        </div>

        {/* 기록 목록 */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span>📋</span>
            <span>체중 기록 ({records.length})</span>
          </h3>

          {records.length === 0 ? (
            <div className="text-center py-10 text-gray-700">
              <span className="text-4xl mb-3 block">📭</span>
              <p className="text-base font-medium">기록된 체중이 없습니다</p>
              <p className="text-xs mt-1">위에서 체중을 기록해보세요!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((record, index) => {
                const prevRecord = records[index + 1];
                const change = prevRecord ? record.weight - prevRecord.weight : null;

                return (
                  <div
                    key={record.id}
                    className="bg-white/80 border border-black/20 rounded-xl p-3 hover:border-gray-600 hover:shadow-soft transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-gray-900">{record.weight}kg</span>
                          {change !== null && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              change > 0
                                ? 'bg-red-100 text-red-600'
                                : change < 0
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}kg
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-700">{record.date}</p>
                        {record.note && (
                          <p className="text-xs text-gray-600 mt-1">📌 {record.note}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 hover:shadow-glow transition-all font-medium text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeightTracking;
