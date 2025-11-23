import React, { useEffect } from 'react';
import './App.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { TonConnectProvider } from './contexts/TonConnectProvider';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import Header from './components/Header';
import JobListings from './pages/JobListings';
import ErrorBoundary from './components/ErrorBoundary';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function AppContent() {
  const webApp = useTelegramWebApp();

  useEffect(() => {
    if (webApp) {
      // Set header color to match TON blue
      webApp.setHeaderColor('#0098EA');
      webApp.setBackgroundColor('#f5f5f5');
      
      // Enable closing confirmation
      webApp.enableClosingConfirmation();
    }
  }, [webApp]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pb-20">
        <JobListings />
      </main>
      
      {/* Toast notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TonConnectProvider>
          <AppContent />
        </TonConnectProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
