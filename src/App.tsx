import { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { getNotificationPrefs, scheduleMealNotifications } from './utils/notificationScheduler';
import Header from './components/Header';
import Navigation from './components/Navigation';
import MealRecommendation from './components/MealRecommendation';
import MealLogger from './components/MealLogger';
import MealHistory from './components/MealHistory';
import NutritionDashboard from './components/NutritionDashboard';
import WeightTracking from './components/WeightTracking';
import BMICalculator from './components/BMICalculator';
import ProfileSetting from './components/ProfileSetting';
import WeeklyReport from './components/WeeklyReport';

type Tab = 'recommend' | 'log' | 'history' | 'stats' | 'weight' | 'bmi' | 'settings' | 'report';

function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('recommend');

  useEffect(() => {
    const prefs = getNotificationPrefs();
    if (prefs.enabled) scheduleMealNotifications(prefs);
  }, []);

  const goToSettings = () => setCurrentTab('settings');

  const renderContent = () => {
    switch (currentTab) {
      case 'recommend': return <MealRecommendation />;
      case 'log':       return <MealLogger />;
      case 'history':   return <MealHistory onSettingsClick={goToSettings} />;
      case 'stats':     return <NutritionDashboard onSettingsClick={goToSettings} />;
      case 'weight':    return <WeightTracking />;
      case 'report':    return <WeeklyReport onSettingsClick={goToSettings} />;
      case 'bmi':       return <BMICalculator />;
      case 'settings':  return <ProfileSetting />;
      default:          return <MealRecommendation />;
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen">
        <Header />
        <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
        <main className="py-3 pb-nav">
          {renderContent()}
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
