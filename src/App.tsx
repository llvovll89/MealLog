import  { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import MealRecommendation from './components/MealRecommendation';
import MealLogger from './components/MealLogger';
import MealHistory from './components/MealHistory';
import NutritionDashboard from './components/NutritionDashboard';
import WeightTracking from './components/WeightTracking';
import BMICalculator from './components/BMICalculator';
import ProfileSetting from './components/ProfileSetting';
import { getProfile } from './utils/storage';

type Tab = 'recommend' | 'log' | 'history' | 'stats' | 'weight' | 'bmi' | 'settings';

// 프로필이 필요한 컴포넌트를 위한 래퍼
const RequireProfile = ({ children, onSettingsClick }: { children: React.ReactNode; onSettingsClick: () => void }) => {
  const profile = getProfile();

  if (!profile || !profile.height || !profile.weight) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="glass border border-black/20 rounded-3xl shadow-strong p-8 backdrop-blur-xl text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            프로필 설정이 필요합니다
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            이 기능을 사용하려면 먼저 설정에서<br />
            키와 몸무게를 입력해주세요!
          </p>
          <button
            onClick={onSettingsClick}
            className="px-8 py-3.5 bg-gradient-to-r from-gray-800 to-black text-white font-bold text-base rounded-xl hover:from-gray-900 hover:to-gray-800 hover:shadow-glow transition-all duration-300 transform hover:scale-105"
          >
            ⚙️ 설정으로 이동
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('recommend');

  const goToSettings = () => {
    setCurrentTab('settings');
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'recommend':
        return (
          <RequireProfile onSettingsClick={goToSettings}>
            <MealRecommendation />
          </RequireProfile>
        );
      case 'log':
        return (
          <RequireProfile onSettingsClick={goToSettings}>
            <MealLogger />
          </RequireProfile>
        );
      case 'history':
        return (
          <RequireProfile onSettingsClick={goToSettings}>
            <MealHistory />
          </RequireProfile>
        );
      case 'stats':
        return (
          <RequireProfile onSettingsClick={goToSettings}>
            <NutritionDashboard />
          </RequireProfile>
        );
      case 'weight':
        return (
          <RequireProfile onSettingsClick={goToSettings}>
            <WeightTracking />
          </RequireProfile>
        );
      case 'bmi':
        return <BMICalculator />;
      case 'settings':
        return <ProfileSetting />;
      default:
        return <MealRecommendation />;
    }
  };

  return (
    <div className="min-h-screen pb-safe">
      <Header />
      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
      <main className="py-3 pb-5">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
