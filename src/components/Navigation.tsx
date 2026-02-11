import { useState } from 'react';

interface NavigationProps {
  currentTab: 'recommend' | 'log' | 'history' | 'stats' | 'weight' | 'bmi' | 'settings';
  onTabChange: (tab: 'recommend' | 'log' | 'history' | 'stats' | 'weight' | 'bmi' | 'settings') => void;
}

const Navigation = ({ currentTab, onTabChange }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const tabs = [
    { id: 'recommend' as const, label: '추천', emoji: '🍽️' },
    { id: 'log' as const, label: '기록', emoji: '📝' },
    { id: 'history' as const, label: '히스토리', emoji: '📅' },
    { id: 'stats' as const, label: '통계', emoji: '📊' },
    { id: 'weight' as const, label: '체중', emoji: '📈' },
    { id: 'bmi' as const, label: 'BMI', emoji: '⚖️' },
    { id: 'settings' as const, label: '설정', emoji: '⚙️' },
  ];

  const currentTabData = tabs.find(tab => tab.id === currentTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-4xl mx-auto sm:px-4 px-0">
        {/* 토글 버튼 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="backdrop-blur-2xl absolute text-[clamp(0.9rem,2vw,1rem)] sm:-top-12 -top-11 left-1/2 -translate-x-1/2 bg-gradient-to-br glass text-black/70 sm:px-6 sm:py-3 px-5 py-2 rounded-t-2xl transition-all duration-300"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">{currentTabData?.emoji}</span>
            <span className="font-medium">{currentTabData?.label}</span>
            <span className={`text-sm transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </button>

        {/* 네비게이션 메뉴 */}
        <div
          className={`glass shadow-soft transition-all duration-300 ${isOpen ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
            } overflow-x-auto overflow-y-hidden`}
        >
          <div className="flex justify-around sm:py-3 py-2 min-w-max sm:min-w-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center sm:px-3 px-1.5 py-2 rounded-xl transition-all duration-300 flex-shrink-0 ${currentTab === tab.id
                    ? 'bg-gradient-to-br from-gray-800 to-black text-white font-semibold shadow-glow'
                    : 'text-gray-700 hover:text-black hover:bg-white/50 hover:shadow-soft'
                  }`}
              >
                <span className="sm:text-2xl text-xl mb-1 filter drop-shadow-sm">{tab.emoji}</span>
                <span className="sm:text-[11px] text-[9px] font-medium whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
