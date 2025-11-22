import React, { useEffect } from 'react';
import './App.css';
import { TonConnectProvider } from './contexts/TonConnectProvider';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import Header from './components/Header';
import JobListings from './pages/JobListings';

function AppContent() {
  const webApp = useTelegramWebApp();

  useEffect(() => {
    if (webApp) {
      // Set header color to match TON blue
      webApp.setHeaderColor('#0098EA');
      webApp.setBackgroundColor('#f5f5f5');
    }
  }, [webApp]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pb-20">
        <JobListings />
      </main>
    </div>
  );
}

function App() {
  return (
    <TonConnectProvider>
      <AppContent />
    </TonConnectProvider>
  );
}

export default App;
