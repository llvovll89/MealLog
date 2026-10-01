const Header = () => {
  const todayText = new Date().toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short',
  });
  return (
    <header className="app-header">
      <a href="#main-content" className="skip-link">본문으로 이동</a>
      <div className="header-inner">
        <div className="brand-lockup">
          <svg className="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="20" cy="20" r="18" fill="#e8f2fa" />
            <path d="M9 21h22c-1 8-5 11-11 11S10 29 9 21Z" fill="#3974a6" />
            <path d="M15 8c-4 5 3 6 0 10m7-12c-4 5 3 7 0 11m6-8c-3 4 2 5 0 8" stroke="#3974a6" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            <h1 className="brand-name">MealLog<span className="brand-dot">.</span></h1>
            <p className="brand-caption">맛있는 하루의 기록</p>
          </div>
        </div>
        <span className="header-date">{todayText}</span>
      </div>
    </header>
  );
};
export default Header;
