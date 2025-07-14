import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { useState } from 'react';
import { AppRouter } from './AppRouter';
import { Footer } from './components/Footer';

function App() {
  const [authOpen, setAuthOpen] = useState(false);

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
