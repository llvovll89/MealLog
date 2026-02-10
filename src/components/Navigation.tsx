interface NavigationProps {
  currentTab: 'recommend' | 'log' | 'history' | 'bmi' | 'settings';
  onTabChange: (tab: 'recommend' | 'log' | 'history' | 'bmi' | 'settings') => void;
}

const Navigation = ({ currentTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: 'recommend' as const, label: '추천', emoji: '🍽️' },
    { id: 'log' as const, label: '기록', emoji: '📝' },
    { id: 'history' as const, label: '히스토리', emoji: '📅' },
    { id: 'bmi' as const, label: 'BMI', emoji: '⚖️' },
    { id: 'settings' as const, label: '설정', emoji: '⚙️' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-2">
        <div className="flex justify-around py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center px-2 py-1 rounded-lg transition-all duration-200 ${
                currentTab === tab.id
                  ? 'bg-black text-white font-semibold'
                  : 'text-gray-500 hover:text-black hover:bg-gray-100'
              }`}
            >
              <span className="text-lg mb-0.5">{tab.emoji}</span>
              <span className="text-[10px]">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
