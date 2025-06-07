// App.tsx
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { useState } from 'react';
import { AppRouter } from './AppRouter';

function App() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header onLoginClick={() => setAuthOpen(true)} />
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        <main className="flex-grow p-4">
          <AppRouter />
        </main>
      </div>
    </Router>
  );
}

export default App;
