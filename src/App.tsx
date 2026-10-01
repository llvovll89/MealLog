import { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { getNotificationPrefs, scheduleMealNotifications } from './utils/notificationScheduler';
import Header from './components/Header';
import Navigation from './components/Navigation';
import MealRecommendation from './components/MealRecommendation';
import MealLogger from './components/MealLogger';
import ProfileSetting from './components/ProfileSetting';
import InsightsHub from './components/InsightsHub';

type Tab = 'today' | 'log' | 'insights' | 'settings';
const APP_TAB_STORAGE_KEY = 'mealog_app_tab';

function App() {
  const [currentTab, setCurrentTab] = useState<Tab>(() => {
    try {
      const saved = localStorage.getItem(APP_TAB_STORAGE_KEY);
      if (saved === 'today' || saved === 'log' || saved === 'insights' || saved === 'settings') {
        return saved;
      }
    } catch {
      // localStorage 접근 실패 시 기본값 사용
    }
    return 'today';
  });

  useEffect(() => {
    const prefs = getNotificationPrefs();
    if (prefs.enabled) scheduleMealNotifications(prefs);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(APP_TAB_STORAGE_KEY, currentTab);
    } catch {
      // 저장 실패 시 무시
    }
  }, [currentTab]);

  const goToSettings = () => setCurrentTab('settings');

  const renderContent = () => {
    switch (currentTab) {
      case 'today':     return <MealRecommendation />;
      case 'log':       return <MealLogger />;
      case 'insights':  return <InsightsHub onSettingsClick={goToSettings} />;
      case 'settings':  return <ProfileSetting />;
      default:          return <MealRecommendation />;
    }
  };

  return (
    <ToastProvider>
      <div className="app-shell">
        <div className="app-layout">
          <Header />
          <main id="main-content" className="app-main" key={currentTab}>
            {renderContent()}
          </main>
          <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;
