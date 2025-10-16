import React, { useState } from 'react';
import { User } from '../types';
import { login } from '../services/dataService';
import { APP_TITLE } from '../constants';
import Button from './shared/Button';
import Card from './shared/Card';

interface LoginPageProps {
    onLoginSuccess: (user: User) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, showToast }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await login(username, password);
            if (user) {
                // FIX: The showToast function requires a 'type' argument. Added 'success' for a successful login.
                showToast(`Benvenuto/a ${user.firstName || user.username}!`, 'success');
                onLoginSuccess(user);
            } else {
                setError('Credenziali non valide. Riprova.');
            }
        } catch (err) {
            console.error(err);
            setError('Si è verificato un errore. Controlla la connessione.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputClasses = "mt-1 block w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-transparent rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition";

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md">
                 <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-white dark:bg-slate-700/50 rounded-2xl shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} className="w-12 h-12 text-purple-600 dark:text-purple-400 stroke-current">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-800 dark:text-white mt-4">{APP_TITLE}</h1>
                    <p className="text-slate-500 dark:text-slate-400">Accedi per gestire il tuo programma fedeltà</p>
                </div>
                <Card>
                    <form onSubmit={handleSubmit}>
                        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center text-sm">{error}</p>}
                        <div className="mb-4">
                            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="username">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={inputClasses}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputClasses}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="mt-8">
                             <Button type="submit" fullWidth disabled={isLoading}>
                                {isLoading ? 'Accesso in corso...' : 'Accedi'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;