import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { supabase } from './lib/supabaseClient'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionContextProvider supabaseClient={supabase}>
      <App />
    </SessionContextProvider>
  </StrictMode>
)
