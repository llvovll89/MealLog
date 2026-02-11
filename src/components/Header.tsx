const Header = () => {
  return (
    <header className="glass border-b border-black/20 sm:py-5 py-4 sm:px-4 px-3 shadow-lg sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto text-center animate-slide-down">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-black rounded-full blur-xl opacity-30 animate-pulse"></div>
            <span className="relative text-4xl filter drop-shadow-lg">🍱</span>
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-black via-gray-700 to-black bg-clip-text text-transparent tracking-tight drop-shadow-sm">
            MealLog
          </h1>
        </div>
        <p className="text-gray-800 text-sm font-medium bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full inline-block shadow-soft border border-black/20">
          오늘은 뭐 먹지? 맛있는 하루를 기록해보세요
        </p>
      </div>
    </header>
  );
};

export default Header;
