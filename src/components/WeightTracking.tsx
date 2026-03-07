import { useState, useEffect } from 'react';
import type { WeightRecord } from '../types';
import { getWeightRecords, saveWeightRecord, deleteWeightRecord, getProfile, saveProfile } from '../utils/storage';
import { formatDate } from '../utils/recommendationEngine';
import { useToast } from '../context/ToastContext';

const SVG_W = 320;
const SVG_H = 140;
const PAD = { top: 15, right: 20, bottom: 28, left: 42 };
const C_W = SVG_W - PAD.left - PAD.right;
const C_H = SVG_H - PAD.top - PAD.bottom;

const WeightChart = ({
  records,
  targetWeight,
}: {
  records: WeightRecord[];
  targetWeight: number | null;
}) => {
  const chartData = [...records]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-20);

  if (chartData.length < 2) return null;

  const weights = chartData.map((r) => r.weight);
  const dataMin = Math.min(...weights);
  const dataMax = Math.max(...weights);
  const padding = Math.max((dataMax - dataMin) * 0.2, 1);
  const yMin = dataMin - padding;
  const yMax = dataMax + padding;
  const yRange = yMax - yMin;

  const toX = (i: number) => PAD.left + (i / (chartData.length - 1)) * C_W;
  const toY = (w: number) => PAD.top + C_H - ((w - yMin) / yRange) * C_H;

  const linePath = chartData
    .map((r, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(r.weight).toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${toX(chartData.length - 1).toFixed(1)} ${(PAD.top + C_H).toFixed(1)} L ${toX(0).toFixed(1)} ${(PAD.top + C_H).toFixed(1)} Z`;

  const yLabels = [yMin, (yMin + yMax) / 2, yMax].map((v) => Math.round(v * 10) / 10);
  const showTargetLine =
    targetWeight !== null && targetWeight >= yMin && targetWeight <= yMax;

  return (
    <div className="bg-white/60 border border-blue-100 rounded-2xl p-4 backdrop-blur-sm">
      <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span>📉</span>
        <span>체중 변화 그래프</span>
      </h3>
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ height: SVG_H }}>
        {yLabels.map((v, i) => (
          <text
            key={i}
            x={PAD.left - 5}
            y={toY(v) + 3.5}
            textAnchor="end"
            fontSize={9}
            fill="#9ca3af"
          >
            {v}
          </text>
        ))}

        {showTargetLine && (
          <>
            <line
              x1={PAD.left}
              y1={toY(targetWeight!)}
              x2={PAD.left + C_W}
              y2={toY(targetWeight!)}
              stroke="#16a34a"
              strokeWidth={1.5}
              strokeDasharray="5 3"
            />
            <text
              x={PAD.left + C_W + 2}
              y={toY(targetWeight!) + 3.5}
              fontSize={8}
              fill="#16a34a"
            >
              목표
            </text>
          </>
        )}

        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + C_H} stroke="#fed7aa" strokeWidth={1} />
        <line x1={PAD.left} y1={PAD.top + C_H} x2={PAD.left + C_W} y2={PAD.top + C_H} stroke="#fed7aa" strokeWidth={1} />

        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />

        <path
          d={linePath}
          fill="none"
          stroke="#f97316"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {chartData.map((r, i) => (
          <circle
            key={r.id}
            cx={toX(i)}
            cy={toY(r.weight)}
            r={3.5}
            fill="white"
            stroke="#f97316"
            strokeWidth={2}
          />
        ))}

        <text x={toX(0)} y={SVG_H - 5} textAnchor="middle" fontSize={8} fill="#9ca3af">
          {chartData[0].date.slice(5)}
        </text>
        <text x={toX(chartData.length - 1)} y={SVG_H - 5} textAnchor="middle" fontSize={8} fill="#9ca3af">
          {chartData[chartData.length - 1].date.slice(5)}
        </text>
      </svg>
      <p className="text-[10px] text-gray-400 text-center mt-1">
        최근 {chartData.length}회 기록 기준
      </p>
    </div>
  );
};

const WeightTracking = () => {
  const toast = useToast();
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(formatDate(new Date()));
  const [note, setNote] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadRecords();
    const profile = getProfile();
    if (profile?.targetWeight) setTargetWeight(profile.targetWeight.toString());
  }, []);

  const loadRecords = () => {
    const allRecords = getWeightRecords().sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setRecords(allRecords);
  };

  const handleSave = () => {
    const weightNum = parseFloat(weight);
    if (!weightNum || weightNum <= 0) {
      toast.warning('올바른 체중을 입력해주세요!');
      return;
    }

    saveWeightRecord({
      id: crypto.randomUUID(),
      date,
      weight: weightNum,
      timestamp: Date.now(),
      note: note.trim() || undefined,
    });
    loadRecords();
    setWeight('');
    setNote('');
    setDate(formatDate(new Date()));
    toast.success('체중이 기록되었습니다!');
  };

  const handleDelete = (id: string) => {
    deleteWeightRecord(id);
    setConfirmDeleteId(null);
    loadRecords();
    toast.success('기록이 삭제되었습니다.');
  };

  const handleSaveTarget = () => {
    const targetNum = parseFloat(targetWeight);
    if (!targetNum || targetNum <= 0) {
      toast.warning('올바른 목표 체중을 입력해주세요!');
      return;
    }
    const profile = getProfile();
    saveProfile({ height: 0, weight: 0, ...profile, targetWeight: targetNum });
    setShowTargetInput(false);
    toast.success('목표 체중이 저장되었습니다!');
  };

  const getWeightChange = () => {
    if (records.length < 2) return null;
    const latest = records[0].weight;
    const oldest = records[records.length - 1].weight;
    const change = latest - oldest;
    return { change, percentage: (change / oldest) * 100 };
  };

  const weightChange = getWeightChange();
  const currentWeight = records.length > 0 ? records[0].weight : null;
  const targetWeightNum = targetWeight ? parseFloat(targetWeight) : null;
  const remainingWeight =
    currentWeight && targetWeightNum ? currentWeight - targetWeightNum : null;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="glass border border-blue-200/50 rounded-3xl shadow-md p-6 backdrop-blur-xl">
        <div className="text-center mb-5">
          <span className="text-3xl animate-float inline-block">📈</span>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2 mb-1 tracking-tight">
            체중 추적
          </h2>
          <p className="text-xs text-gray-500">체중을 기록하고 변화를 추적하세요</p>
        </div>

        {/* 현재 상태 */}
        {currentWeight && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="stat-card">
              <p className="text-xs text-gray-500 mb-1">현재 체중</p>
              <p className="text-2xl font-bold text-gray-900">{currentWeight}kg</p>
            </div>
            {targetWeightNum && (
              <div className="stat-card">
                <p className="text-xs text-gray-500 mb-1">목표 체중까지</p>
                <p
                  className={`text-2xl font-bold ${remainingWeight && remainingWeight > 0 ? 'text-red-500' : 'text-green-600'
                    }`}
                >
                  {remainingWeight !== null
                    ? `${remainingWeight > 0 ? '+' : ''}${remainingWeight.toFixed(1)}kg`
                    : '-'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 체중 변화 */}
        {weightChange && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-5">
            <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>📊</span>
              <span>전체 변화량</span>
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-2xl font-bold ${weightChange.change > 0
                      ? 'text-red-500'
                      : weightChange.change < 0
                        ? 'text-green-600'
                        : 'text-gray-900'
                    }`}
                >
                  {weightChange.change > 0 ? '+' : ''}
                  {weightChange.change.toFixed(1)}kg
                </p>
                <p className="text-xs text-gray-500">
                  {weightChange.percentage > 0 ? '+' : ''}
                  {weightChange.percentage.toFixed(2)}%
                </p>
              </div>
              <div className="text-xs text-blue-700 font-medium bg-blue-100 px-3 py-1.5 rounded-lg">총 {records.length}회 기록</div>
            </div>
          </div>
        )}

        {/* 그래프 */}
        <div className="mb-5">
          <WeightChart records={records} targetWeight={targetWeightNum} />
        </div>

        {/* 목표 체중 설정 */}
        <div className="mb-5">
          {!showTargetInput ? (
            <div className="flex items-center justify-between bg-white/60 border border-blue-100 rounded-xl p-3">
              <div>
                <p className="text-xs text-gray-500">목표 체중</p>
                <p className="font-semibold text-gray-800">
                  {targetWeightNum ? `${targetWeightNum}kg` : '설정 안 함'}
                </p>
              </div>
              <button
                onClick={() => setShowTargetInput(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-glow-sm"
              >
                {targetWeightNum ? '변경' : '설정'}
              </button>
            </div>
          ) : (
            <div className="bg-white/60 border border-blue-100 rounded-xl p-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                🎯 목표 체중 (kg)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  placeholder="65"
                  className="flex-1 px-4 py-2.5 border-2 border-blue-200/60 bg-white/80 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-sm"
                />
                <button
                  onClick={handleSaveTarget}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium"
                >
                  저장
                </button>
                <button
                  onClick={() => setShowTargetInput(false)}
                  className="px-4 py-2.5 bg-white/70 text-gray-600 rounded-xl hover:bg-blue-50 transition-all text-sm font-medium border border-blue-200/60"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 체중 기록하기 */}
        <div className="bg-white/60 border border-blue-100 rounded-2xl p-4 mb-5 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-3">📝 체중 기록하기</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">📅 날짜</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-blue-200/60 bg-white/80 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">⚖️ 체중 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="65.5"
                className="w-full px-4 py-2.5 border-2 border-blue-200/60 bg-white/80 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">📌 메모 (선택)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 아침 측정, 운동 후"
                className="w-full px-4 py-2.5 border-2 border-blue-200/60 bg-white/80 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all text-sm"
              />
            </div>
            <button
              onClick={handleSave}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 hover:shadow-glow transition-all transform hover:scale-105"
            >
              기록하기
            </button>
          </div>
        </div>

        {/* 기록 목록 */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>📋</span>
            <span>체중 기록 ({records.length})</span>
          </h3>

          {records.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <span className="text-4xl mb-3 block animate-float inline-block">📭</span>
              <p className="text-base font-medium">기록된 체중이 없습니다</p>
              <p className="text-xs mt-1 text-gray-400">위에서 체중을 기록해보세요!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((record, index) => {
                const prevRecord = records[index + 1];
                const change = prevRecord ? record.weight - prevRecord.weight : null;

                return (
                  <div
                    key={record.id}
                    className="bg-white/80 border border-blue-100 rounded-xl p-3 hover:border-blue-300 hover:shadow-soft transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-gray-900">{record.weight}kg</span>
                          {change !== null && (
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${change > 0
                                  ? 'bg-red-100 text-red-500'
                                  : change < 0
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                              {change > 0 ? '+' : ''}{change.toFixed(1)}kg
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{record.date}</p>
                        {record.note && (
                          <p className="text-xs text-gray-500 mt-1">📌 {record.note}</p>
                        )}
                      </div>

                      {confirmDeleteId === record.id ? (
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-all"
                          >
                            삭제
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-all"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(record.id)}
                          className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all font-medium text-xs flex-shrink-0"
                        >
                          🗑️
                        </button>
                      )}
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
