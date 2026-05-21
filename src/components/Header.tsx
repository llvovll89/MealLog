const Header = () => {
  const todayText = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-3 pt-3">
      <div className="max-w-[460px] mx-auto rounded-2xl bg-white border border-[#d6cebe] shadow-none overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-[18px] font-extrabold text-[#1f1d19] tracking-tight leading-tight">
              MealLog
            </h1>
            <p className="text-[11px] text-[#7a7266] truncate mt-0.5">
              {todayText} · 개인 식단 로그
            </p>
          </div>
          <span className="text-[10px] font-semibold text-[#1f1d19] bg-[#f5f2ec] border border-[#dbd2c2] rounded-md px-2 py-1 whitespace-nowrap">
            meallog
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
