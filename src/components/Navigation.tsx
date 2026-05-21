import { useState } from 'react';

interface NavigationProps {
  currentTab: 'today' | 'log' | 'insights' | 'settings';
  onTabChange: (tab: 'today' | 'log' | 'insights' | 'settings') => void;
}

const Navigation = ({ currentTab, onTabChange }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const tabs = [
    { id: 'today' as const, label: '오늘' },
    { id: 'log' as const, label: '기록' },
    { id: 'insights' as const, label: '인사이트' },
    { id: 'settings' as const, label: '설정' },
  ];

  const currentTabData = tabs.find((t) => t.id === currentTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-2.5">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#edf0f4] via-[#edf0f4]/70 to-transparent" />
      <div className="relative max-w-[460px] mx-auto">
        <div className="rounded-xl bg-white border border-[#d8dde4] shadow-none overflow-hidden nav-safe-bottom">
          <button
            onClick={() => setIsOpen((v) => !v)}
            className="w-full px-3 py-2 flex items-center justify-between border-b border-[#edf0f4]"
            aria-label="메뉴 펼치기 또는 접기"
          >
            <span className="text-[11px] font-semibold text-[#666d78]">메뉴</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#1f1d19]">{currentTabData?.label}</span>
              <span className={`text-[10px] text-[#666d78] transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                ▾
              </span>
            </div>
          </button>

          <div className={`px-2 overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-20 py-1.5 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
            <div className="grid grid-cols-4 gap-1">
              {tabs.map((tab) => {
                const active = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative rounded-md py-1.5 px-1 transition-all ${active ? 'bg-[#0099ff] text-white shadow-none' : 'text-[#666d78] hover:bg-[#f2f4f7]'}`}
                  >
                    <span className="block text-[11px] font-semibold leading-none">{tab.label}</span>
                    <span className={`mx-auto mt-1 block h-0.5 w-4 rounded-full ${active ? 'bg-white/90' : 'bg-transparent'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
