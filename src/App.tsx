import { useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import MealRecommendation from './components/MealRecommendation';
import MealLogger from './components/MealLogger';
import MealHistory from './components/MealHistory';
import BMICalculator from './components/BMICalculator';
import ProfileSetting from './components/ProfileSetting';

type Tab = 'recommend' | 'log' | 'history' | 'bmi' | 'settings';

function App() {
  const [currentTab, setCurrentTab] = useState<Tab>('recommend');

  const renderContent = () => {
    switch (currentTab) {
      case 'recommend':
        return <MealRecommendation />;
      case 'log':
        return <MealLogger />;
      case 'history':
        return <MealHistory />;
      case 'bmi':
        return <BMICalculator />;
      case 'settings':
        return <ProfileSetting />;
      default:
        return <MealRecommendation />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-safe">
      <Header />
      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
      <main className="py-4 pb-6">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
