const Header = () => {
  return (
    <header className="glass-warm border-b border-apple-border-light sm:py-3 py-2.5 sm:px-4 px-3 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto text-center animate-slide-down">
        <div className="flex items-center justify-center gap-2">
          <span className="sm:text-3xl text-2xl animate-float inline-block">🍱</span>
          <h1 className="sm:text-2xl text-xl font-bold text-apple-text tracking-tight">
            MealLog
          </h1>
        </div>
        <p className="text-apple-secondary sm:text-xs text-[10px] font-medium mt-0.5 hidden sm:block">
          오늘은 뭐 먹지? 맛있는 하루를 기록해보세요
        </p>
      </div>
    </header>
  );
};

export default Header;
