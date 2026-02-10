const Header = () => {
  return (
    <header className="bg-black border-b border-gray-800 py-3 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
          MealLog
        </h1>
        <p className="text-gray-400 text-xs font-light">
          오늘은 뭐 먹지? 맛있는 하루를 기록해보세요
        </p>
      </div>
    </header>
  );
};

export default Header;
