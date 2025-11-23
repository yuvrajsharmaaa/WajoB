import React, { useEffect, lazy, Suspense } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { TonConnectProvider } from './contexts/TonConnectProvider';
import { WalletProvider } from './contexts/WalletContext';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages for better performance
const JobListings = lazy(() => import('./pages/JobListings'));
const JobDetails = lazy(() => import('./pages/JobDetails'));

// Loading component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

// Create React Query client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 404 or 403 errors
        if (error?.status === 404 || error?.status === 403) return false;
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false, // Don't retry mutations by default
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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<JobListings />} />
            <Route path="/jobs" element={<JobListings />} />
            <Route path="/jobs/:jobId" element={<JobDetails />} />
          </Routes>
        </Suspense>
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
            duration: 2000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
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
          <WalletProvider>
            <Router>
              <AppContent />
            </Router>
          </WalletProvider>
        </TonConnectProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
