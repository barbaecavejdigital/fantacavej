import React, { useState, useEffect, useCallback } from 'react';
import { User } from './types';
import { initData, getCurrentUser, logout } from './services/dataService';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/admin/AdminDashboard';
import CustomerDashboard from './components/customer/CustomerDashboard';
import InitialSetup from './components/customer/InitialSetup';
import ToastContainer from './components/shared/ToastContainer';
import AdminSidebar from './components/admin/AdminSidebar';
import Header from './components/shared/Header';
import { ToastData } from './types';
import HomePage from './components/HomePage';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'app'>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initData();
        const user = getCurrentUser();
        if (user) {
            setCurrentUser(user);
        }
      } catch (error) {
        console.error("Failed to initialize app:", error);
        showToast("Errore di connessione al database.", 'error');
      } finally {
        setIsInitializing(false);
      }
    };
    initializeApp();
  }, [showToast]);

  const handleLoginSuccess = useCallback((user: User) => {
    setCurrentUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setCurrentUser(null);
    showToast('Logout effettuato con successo.');
  }, [showToast]);

  const handleInitialSetupComplete = useCallback((user: User) => {
    setCurrentUser(user);
  }, []);

  const navigateToApp = useCallback(() => setCurrentView('app'), []);
  const navigateToHome = useCallback(() => setCurrentView('home'), []);

  const renderAppContent = () => {
    if (isInitializing) {
      return (
        <div className="flex h-screen items-center justify-center bg-[#f2f2f7]">
          <div className="text-center animate-fade-in">
            <svg className="mx-auto h-12 w-12 animate-spin text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 className="mt-4 text-lg font-semibold text-gray-700">Inizializzazione...</h2>
            <p className="text-gray-500 text-sm">Connessione al database in corso.</p>
          </div>
        </div>
      );
    }
    
    if (!currentUser) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} showToast={showToast} onNavigateToHome={navigateToHome} />;
    }

    if (currentUser.role === 'admin') {
      return (
        <div className="flex flex-col h-screen bg-[#f2f2f7]">
          <AdminSidebar user={currentUser} onLogout={handleLogout} showToast={showToast} />
          <main className="flex-1 overflow-y-hidden">
            <AdminDashboard user={currentUser} showToast={showToast} />
          </main>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen bg-[#f2f2f7]">
        <Header user={currentUser} onLogout={handleLogout} />
        <main className="flex-grow overflow-y-auto hide-scrollbar">
          {currentUser.isInitialLogin ? (
            <InitialSetup user={currentUser} onComplete={handleInitialSetupComplete} showToast={showToast} />
          ) : (
            <CustomerDashboard user={currentUser} />
          )}
        </main>
      </div>
    );
  };

  return (
    <>
      <ToastContainer toasts={toasts} setToasts={setToasts} />
      {currentView === 'home' ? (
        <HomePage onNavigateToLogin={navigateToApp} />
      ) : (
        renderAppContent()
      )}
    </>
  );
}

export default App;
