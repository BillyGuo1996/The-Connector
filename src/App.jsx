import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Chat from './Chat';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState(null);
  const [theme, setTheme] = useState('light');

  // Theme toggle effect
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Auth state tracking
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  // Auth screen
  if (!session) {
    return (
      <div className="app-container">
        <h1>The Connector</h1>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          theme={theme}
        />
        <button className="theme-toggle" onClick={toggleTheme}>
          Toggle {theme === 'light' ? '🌙 Dark' : '☀️ Light'} Mode
        </button>
      </div>
    );
  }

  // Mode picker
  if (!mode) {
    return (
      <div className="app-container">
        <h1>The Connector</h1>
        <h2>Select Your Mode:</h2>
        <button onClick={() => setMode('spark')}>🌍 Spark Mode</button>
        <button onClick={() => setMode('pathway')}>✝️ Pathway Mode</button>
        <br />
        <button onClick={toggleTheme} className="theme-toggle">
          Toggle {theme === 'light' ? '🌙 Dark' : '☀️ Light'} Mode
        </button>
        <button onClick={() => supabase.auth.signOut()} style={{ marginTop: '1rem' }}>
          Log out
        </button>
      </div>
    );
  }

  // Chat screen
  return (
    <div className="app-container">
      <h1>The Connector</h1>
      <h2>{mode === 'spark' ? '🌍 Spark' : '✝️ Pathway'} Chat</h2>

      <Chat mode={mode} />

      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => setMode(null)}>← Change Mode</button>
        <button onClick={toggleTheme} className="theme-toggle">
          Toggle {theme === 'light' ? '🌙 Dark' : '☀️ Light'} Mode
        </button>
        <button onClick={() => supabase.auth.signOut()}>Log out</button>
      </div>
    </div>
  );
}

