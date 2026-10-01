interface NavigationProps {
  currentTab: 'today' | 'log' | 'insights' | 'settings';
  onTabChange: (tab: 'today' | 'log' | 'insights' | 'settings') => void;
}
const tabs = [
  { id: 'today' as const, label: '오늘', path: 'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17m10-10 1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0' },
  { id: 'log' as const, label: '식사 기록', path: 'M14 4H5v16h14v-9M10 14l1-4 7-7 3 3-7 7-4 1Z' },
  { id: 'insights' as const, label: '인사이트', path: 'M4 20h16M7 16v-5m5 5V5m5 11V8' },
  { id: 'settings' as const, label: '설정', path: 'M4 7h16M4 17h16M9 4v6m6 4v6' },
];
const Navigation = ({ currentTab, onTabChange }: NavigationProps) => (
  <nav className="app-nav" aria-label="주 메뉴">
    <div className="nav-inner">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" aria-current={currentTab === tab.id ? 'page' : undefined}
          onClick={() => { onTabChange(tab.id); window.scrollTo({ top: 0, behavior: 'instant' }); }}
          className={`nav-item ${currentTab === tab.id ? 'is-active' : ''}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={tab.path} /></svg>
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  </nav>
);
export default Navigation;
