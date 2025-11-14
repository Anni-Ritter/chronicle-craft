import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { useEffect, useMemo, useState } from 'react';
import { AppRouter } from './AppRouter';
import { Footer } from './components/Footer';
function useIsStandalone() {
  return useMemo(() => (
    (window.navigator as any).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  ), []);
}

function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const isStandalone = useIsStandalone();

  useEffect(() => {
    document.body.classList.toggle('pwa-standalone', isStandalone);
  }, [isStandalone]);
  
  return (
    <Router>
      <div className="flex flex-col">
        <Header onLoginClick={() => setAuthOpen(true)} />
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        <main>
          <AppRouter onLoginClick={() => setAuthOpen(true)} />
        </main>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
