import React, { useState, useEffect } from 'react';
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

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [toasts, setToasts] = useState<ToastData[]>([]);

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
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    logout();
    setCurrentUser(null);
    showToast('Logout effettuato con successo.');
  };
  
  const handleInitialSetupComplete = (user: User) => {
    setCurrentUser(user);
  };

  if (isInitializing) {
    return (
        <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-900">
            <div className="text-center">
                <svg className="mx-auto h-12 w-12 animate-spin text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h2 className="mt-4 text-xl font-semibold text-slate-700 dark:text-slate-300">Inizializzazione...</h2>
                <p className="text-slate-500 dark:text-slate-400">Connessione al database in corso.</p>
            </div>
        </div>
    );
  }

  const mainContent = () => {
    if (!currentUser) {
      return <LoginPage onLoginSuccess={handleLoginSuccess} showToast={showToast} />;
    }
    
    if (currentUser.role === 'admin') {
      return (
        <div className="flex h-screen bg-purple-50 dark:bg-slate-900/50 overflow-hidden">
            <AdminSidebar user={currentUser} onLogout={handleLogout} />
            <main className="flex-1 overflow-hidden">
                <AdminDashboard user={currentUser} showToast={showToast} />
            </main>
        </div>
      );
    }
  
    return (
      <div className="flex flex-col h-screen bg-purple-50 dark:bg-slate-900/50">
         <Header user={currentUser} onLogout={handleLogout} />
        <main className="flex-grow overflow-y-auto">
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
      {mainContent()}
    </>
  );
}

export default App;
