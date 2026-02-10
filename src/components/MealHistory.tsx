import { useState, useEffect } from 'react';
import type { MealRecord } from '../types';
import { getMealRecords, deleteMealRecord } from '../utils/storage';
import { getMealTypeLabel, formatDateDisplay } from '../utils/recommendationEngine';

const MealHistory = () => {
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = () => {
    const allRecords = getMealRecords()
      .sort((a, b) => b.timestamp - a.timestamp);
    setRecords(allRecords);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteMealRecord(id);
      loadRecords();
    }
  };

  const filteredRecords = selectedDate
    ? records.filter((record) => record.date === selectedDate)
    : records;

  // 날짜별로 그룹화
  const recordsByDate = filteredRecords.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, MealRecord[]>);

  const mealTypeEmoji = {
    breakfast: '☀️',
    lunch: '🌤️',
    dinner: '🌙',
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
        <div className="text-center mb-5">
          <span className="text-3xl">📚</span>
          <h2 className="text-xl font-bold text-black mt-2 mb-1 tracking-tight">
            식사 히스토리
          </h2>
        </div>

        {/* 날짜 필터 */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-black mb-1.5">
            🔍 날짜로 필터링
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:border-black focus:outline-none transition-colors text-sm"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="px-3 py-2 bg-gray-200 text-black rounded-xl hover:bg-gray-300 transition-colors font-medium text-sm"
              >
                전체보기
              </button>
            )}
          </div>
        </div>

        {/* 기록 목록 */}
        <div className="space-y-4">
          {Object.keys(recordsByDate).length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <span className="text-4xl mb-3 block">📭</span>
              <p className="text-base font-medium">아직 기록된 식사가 없습니다</p>
              <p className="text-xs mt-1">기록 탭에서 식사를 기록해보세요!</p>
            </div>
          ) : (
            Object.entries(recordsByDate).map(([date, dateRecords]) => (
              <div key={date} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h3 className="text-base font-bold text-black mb-3">
                  {formatDateDisplay(date)}
                </h3>
                <div className="space-y-2">
                  {dateRecords.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white border border-gray-200 rounded-lg p-3 hover:border-black transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {mealTypeEmoji[record.mealType]}
                          </span>
                          <div>
                            <p className="font-semibold text-black text-sm">
                              {record.menu}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getMealTypeLabel(record.mealType)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-xs"
                        >
                          🗑️ 삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MealHistory;
