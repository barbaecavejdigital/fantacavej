import React, { useState } from 'react';
import { User } from '../types';
import { login } from '../services/dataService';
import { APP_TITLE } from '../constants';
import Button from './shared/Button';
import Card from './shared/Card';

interface LoginPageProps {
    onLoginSuccess: (user: User) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
    onNavigateToHome: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, showToast, onNavigateToHome }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const user = await login(username, password);
            if (user) {
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
    
    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-[#f2f2f7]">
            <div className="w-full max-w-sm">
                 <div className="text-center mb-8 animate-fade-in-slide-up">
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-black/5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} className="w-12 h-12 text-indigo-500 stroke-current">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mt-4 tracking-tight">{APP_TITLE}</h1>
                    <p className="text-gray-500">Accedi per gestire il tuo programma fedeltà</p>
                </div>
                <Card className="animate-fade-in-slide-up" style={{ animationDelay: '100ms' }}>
                    <form onSubmit={handleSubmit}>
                        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center text-sm">{error}</p>}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-600 text-sm font-medium mb-2" htmlFor="username">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="form-input"
                                    required
                                    disabled={isLoading}
                                    placeholder="e.g. CL001"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-sm font-medium mb-2" htmlFor="password">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="form-input pr-10"
                                        required
                                        disabled={isLoading}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center justify-center h-full w-10 text-gray-400 hover:text-gray-600 rounded-r-lg"
                                        aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.232 5.724M4.041 4.041L19.959 19.959" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                             <Button type="submit" fullWidth disabled={isLoading} size="lg">
                                {isLoading ? 'Accesso in corso...' : 'Accedi'}
                            </Button>
                        </div>
                    </form>
                </Card>
                <div className="text-center mt-6 animate-fade-in-slide-up" style={{ animationDelay: '200ms' }}>
                    <button 
                        onClick={onNavigateToHome} 
                        className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                        &larr; Torna alla Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;