import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import './App.css';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { BottomNav } from './components/BottomNav';
import { useEffect, useMemo, useState } from 'react';
import { AppRouter } from './AppRouter';
import { Footer } from './components/Footer';
function useIsStandalone() {
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return useMemo(() => (
    nav.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  ), [nav]);
}

function AppShell() {
  const [authOpen, setAuthOpen] = useState(false);
  const isStandalone = useIsStandalone();
  const location = useLocation();
  const isRoleplayScene = /^\/roleplay\/[^/]+\/scenes\/[^/]+$/.test(location.pathname);

  useEffect(() => {
    document.body.classList.toggle('pwa-standalone', isStandalone);
  }, [isStandalone]);

  useEffect(() => {
    const setViewportHeightVar = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--app-vh', `${vh}px`);
    };

    setViewportHeightVar();
    window.addEventListener('resize', setViewportHeightVar);
    window.addEventListener('orientationchange', setViewportHeightVar);
    window.visualViewport?.addEventListener('resize', setViewportHeightVar);

    return () => {
      window.removeEventListener('resize', setViewportHeightVar);
      window.removeEventListener('orientationchange', setViewportHeightVar);
      window.visualViewport?.removeEventListener('resize', setViewportHeightVar);
    };
  }, []);

  return (
    <>
      <div className="flex flex-col min-h-[100dvh] lg:min-h-0">
        {!isRoleplayScene && <Header onLoginClick={() => setAuthOpen(true)} />}
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        <main className={`flex-1 w-full max-lg:overflow-x-hidden ${isRoleplayScene ? 'pb-0' : 'pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] lg:pb-0'}`}>
          <AppRouter onLoginClick={() => setAuthOpen(true)} />
        </main>
      </div>
      {!isRoleplayScene && <Footer />}
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
