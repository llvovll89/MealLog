const Header = () => {
  return (
    <header className="glass-warm border-b border-blue-200/60 sm:py-4 py-2.5 sm:px-4 px-3 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto text-center animate-slide-down">
        <div className="flex items-center justify-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full blur-xl opacity-30 animate-pulse"></div>
            <span className="relative sm:text-3xl text-2xl animate-float inline-block">🍱</span>
          </div>
          <h1 className="sm:text-3xl text-2xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-700 to-indigo-500 bg-clip-text text-transparent tracking-tight drop-shadow-sm">
            MealLog
          </h1>
        </div>
        <p className="text-blue-800/70 sm:text-xs text-[10px] font-medium mt-0.5 hidden sm:block">
          오늘은 뭐 먹지? 맛있는 하루를 기록해보세요 ✨
        </p>
      </div>
    </header>
  );
};

export default Header;
