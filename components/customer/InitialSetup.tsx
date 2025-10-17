import React, { useState } from 'react';
import { User } from '../../types';
import { updateUser } from '../../services/dataService';
import Button from '../shared/Button';
import Card from '../shared/Card';
import { APP_TITLE } from '../../constants';

interface InitialSetupProps {
    user: User;
    onComplete: (user: User) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const InitialSetup: React.FC<InitialSetupProps> = ({ user, onComplete, showToast }) => {
    const [firstName, setFirstName] = useState(user.firstName || '');
    const [lastName, setLastName] = useState(user.lastName || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Le password non coincidono.');
            return;
        }

        if (password && password.length < 6) {
            setError('La password deve essere di almeno 6 caratteri.');
            return;
        }

        setIsLoading(true);
        try {
            const updatedUserData: User = {
                ...user,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                isInitialLogin: false,
            };
            
            if (password) {
                // The password is intentionally not removed from the object passed to updateUser
                // as the service is expected to handle it.
                updatedUserData.password = password;
            } else {
                delete updatedUserData.password;
            }

            const updatedUser = await updateUser(updatedUserData);
            showToast('Setup completato con successo!', 'success');
            onComplete(updatedUser);

        } catch (err) {
            console.error(err);
            setError('Si è verificato un errore durante l\'aggiornamento.');
            showToast('Errore durante il salvataggio.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputClasses = "mt-1 block w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-transparent rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition";


    return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-purple-50 dark:bg-slate-900/50">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-slate-800 dark:text-white">Benvenuto/a in {APP_TITLE}!</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Completa la configurazione del tuo account.</p>
                </div>
                <Card>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-center text-sm">{error}</p>}
                        
                        <p className="text-sm text-slate-600 dark:text-slate-300">Il tuo username è: <strong className="font-mono p-1 bg-slate-100 dark:bg-slate-700 rounded text-purple-600 dark:text-purple-400">{user.username}</strong></p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="firstName">
                                    Nome
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className={inputClasses}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="lastName">
                                    Cognome
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className={inputClasses}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="password">
                                Nuova Password (opzionale)
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputClasses}
                                disabled={isLoading}
                                placeholder="Lascia vuoto per non cambiare"
                            />
                        </div>

                        {password && (
                            <div>
                                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="confirmPassword">
                                    Conferma Nuova Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={inputClasses}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                        )}
                        
                        <div className="pt-4">
                            <Button type="submit" fullWidth disabled={isLoading}>
                                {isLoading ? 'Salvataggio...' : 'Completa e Accedi'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default InitialSetup;
