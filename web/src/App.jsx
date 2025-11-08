import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import MapPage from './pages/Map/MapPage.jsx';
import TimelinePage from './pages/Timeline/TimelinePage.jsx';

const navItems = [
  { to: '/map', label: '치지직 맵' },
  { to: '/timeline', label: '치지직 타임라인' },
];

const externalLinks = [
  {
    href: 'https://chzzk.naver.com/',
    icon: '/chzzk-icon.png',
    label: '치지직 바로가기',
  },
  {
    href: 'https://github.com/project-violet/chzzk-timeline',
    icon: '/github-mark-white.svg',
    label: 'GitHub 저장소',
  },
];

const App = () => {
  return (
    <div className="min-h-screen text-white">
      <nav className="fixed left-1/2 top-6 z-50 flex -translate-x-1/2 items-center gap-6 rounded-full bg-slate-900/80 px-8 py-3 text-sm font-semibold shadow-lg backdrop-blur">
        <div className="flex items-center gap-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'transition-colors',
                  isActive ? 'text-teal-300' : 'text-slate-300 hover:text-white',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <span className="hidden h-6 w-px bg-slate-700/80 sm:inline-block" aria-hidden />
        <div className="flex items-center gap-4">
          {externalLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-800/80"
              aria-label={link.label}
              title={link.label}
            >
              <img
                src={link.icon}
                alt=""
                className="h-5 w-5"
                loading="lazy"
                aria-hidden="true"
              />
            </a>
          ))}
        </div>
      </nav>

      <div className="relative min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/timeline" replace />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/timeline" element={<TimelinePage />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
