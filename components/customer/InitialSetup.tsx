import React, { useState } from 'react';
import { User } from '../../types';
import { updateUser } from '../../services/dataService';
import Button from '../shared/Button';
import Card from '../shared/Card';

interface InitialSetupProps {
    user: User;
    onComplete: (user: User) => void;
    showToast: (message: string) => void;
}

const InitialSetup: React.FC<InitialSetupProps> = ({ user, onComplete, showToast }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (firstName.trim() && lastName.trim()) {
            setIsLoading(true);
            const updated: User = { ...user, firstName, lastName, isInitialLogin: false };
            const savedUser = await updateUser(updated);
            showToast('Configurazione completata con successo!');
            onComplete(savedUser);
            setIsLoading(false);
        }
    };

    const inputClasses = "mt-1 block w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border-transparent rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition";

    return (
        <div className="flex items-center justify-center min-h-screen -mt-20 p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-slate-800 dark:text-white">Benvenuto/a!</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Inserisci nome e cognome per completare la registrazione.</p>
                </div>
                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
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
                            <label htmlFor="lastName" className="block text-sm font-bold text-slate-700 dark:text-slate-300">
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
                         <Button type="submit" fullWidth disabled={isLoading} className="!mt-8">
                            {isLoading ? 'Salvataggio...' : 'Salva e Continua'}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default InitialSetup;