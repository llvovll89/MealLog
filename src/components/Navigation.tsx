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
    <nav className="glass border-b border-white/30 sticky top-[72px] z-40 backdrop-blur-xl shadow-soft">
      <div className="max-w-4xl mx-auto px-2">
        <div className="flex justify-around py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-300 transform ${
                currentTab === tab.id
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white font-semibold shadow-glow scale-105'
                  : 'text-gray-700 hover:text-purple-600 hover:bg-white/50 hover:scale-105 hover:shadow-soft'
              }`}
            >
              <span className="text-2xl mb-1 filter drop-shadow-sm">{tab.emoji}</span>
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
