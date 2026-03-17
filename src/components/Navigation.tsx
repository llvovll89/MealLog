import { useState } from 'react';

interface NavigationProps {
  currentTab: 'recommend' | 'log' | 'history' | 'stats' | 'weight' | 'bmi' | 'settings' | 'report';
  onTabChange: (tab: 'recommend' | 'log' | 'history' | 'stats' | 'weight' | 'bmi' | 'settings' | 'report') => void;
}

const Navigation = ({ currentTab, onTabChange }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const tabs = [
    { id: 'recommend' as const, label: '추천',     emoji: '🍽️' },
    { id: 'log'       as const, label: '기록',     emoji: '📝' },
    { id: 'history'   as const, label: '히스토리', emoji: '📅' },
    { id: 'report'    as const, label: '주간',     emoji: '📋' },
    { id: 'stats'     as const, label: '통계',     emoji: '📊' },
    { id: 'weight'    as const, label: '체중',     emoji: '📈' },
    { id: 'bmi'       as const, label: 'BMI',      emoji: '⚖️' },
    { id: 'settings'  as const, label: '설정',     emoji: '⚙️' },
  ];

  const currentTabData = tabs.find((t) => t.id === currentTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-4xl mx-auto sm:px-4 px-0">

        {/* ── 토글 핸들 ── */}
        <div className="flex justify-center">
          <button
            onClick={() => setIsOpen((v) => !v)}
            className={`
              flex items-center gap-2
              px-5 py-2
              rounded-t-2xl
              text-sm font-semibold
              shadow-[0_-2px_12px_rgba(0,0,0,0.08)]
              border border-b-0
              transition-all duration-200
              ${isOpen
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-white/95 text-apple-text border-apple-border-light backdrop-blur-md'
              }
            `}
          >
            <span className="text-base leading-none">{currentTabData?.emoji}</span>
            <span className="leading-none">{currentTabData?.label}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            >
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>

        {/* ── 네비게이션 패널 ── */}
        <div
          className={`
            bg-white/95 backdrop-blur-xl
            border-t border-x border-apple-border-light
            shadow-[0_-4px_24px_rgba(0,0,0,0.07)]
            transition-all duration-300 ease-in-out
            overflow-hidden
            ${isOpen ? 'max-h-28 opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          {/* 드래그 핸들 인디케이터 */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-8 h-1 rounded-full bg-gray-200" />
          </div>

          {/* 탭 목록 */}
          <div className="flex justify-around px-1 pb-2 overflow-x-auto nav-safe-bottom">
            {tabs.map((tab) => {
              const active = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { onTabChange(tab.id); setIsOpen(false); }}
                  className={`
                    relative flex flex-col items-center
                    sm:px-3 px-2 pt-1.5 pb-1.5
                    rounded-xl flex-shrink-0 min-w-[52px]
                    transition-all duration-200
                    ${active
                      ? 'text-brand-500'
                      : 'text-apple-secondary hover:text-apple-text'
                    }
                  `}
                >
                  {/* 활성 배경 */}
                  {active && (
                    <span className="absolute inset-0 rounded-xl bg-brand-500/10" />
                  )}

                  <span className={`sm:text-2xl text-xl transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                    {tab.emoji}
                  </span>
                  <span className={`sm:text-[11px] text-[10px] mt-0.5 whitespace-nowrap font-medium ${active ? 'font-semibold' : ''}`}>
                    {tab.label}
                  </span>

                  {/* 활성 닷 인디케이터 */}
                  <span className={`mt-0.5 w-1 h-1 rounded-full transition-all duration-200 ${active ? 'bg-brand-500 scale-100' : 'scale-0 bg-transparent'}`} />
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navigation;
