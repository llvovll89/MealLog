const Header = () => {
  return (
    <header className="border-b border-white/20 py-4 px-4 shadow-medium sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto text-center animate-slide-down">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 bg-clip-text text-transparent mb-1 tracking-tight">
          MealLog
        </h1>
        <p className="text-white/70 text-xs font-light">
          오늘은 뭐 먹지? 맛있는 하루를 기록해보세요
        </p>
      </div>
    </header>
  );
};

export default Header;
