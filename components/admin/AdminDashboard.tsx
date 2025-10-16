import React, { useState, useCallback } from 'react';
import CustomerManagement from './CustomerManagement';
import SettingsManagement from './SettingsManagement';
import AdminOverview from './AdminOverview';
import { User } from '../../types';

interface AdminDashboardProps {
    user: User;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, showToast }) => {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleDataChange = useCallback(() => {
        setRefreshKey(prevKey => prevKey + 1);
    }, []);

    return (
        <div className="h-full p-4 sm:p-6 lg:p-8 overflow-hidden">
            <div className="h-full flex flex-col gap-6">
                <header className="shrink-0">
                    <h1 className="text-4xl font-bold text-slate-800 dark:text-white">Bentornato, {user.firstName}!</h1>
                    <p className="text-slate-500 dark:text-slate-400">Ecco una panoramica del tuo programma fedeltà.</p>
                </header>
                
                <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-0">
                    
                    <div className="lg:col-span-2 xl:col-span-3 h-full min-h-0">
                        <CustomerManagement onDataChange={handleDataChange} showToast={showToast} />
                    </div>

                    <div className="lg:col-span-1 xl:col-span-1 h-full flex flex-col gap-6 min-h-0">
                         <div className="shrink-0">
                            <AdminOverview refreshKey={refreshKey} />
                        </div>
                        <div className="flex-grow min-h-0">
                            <SettingsManagement onDataChange={handleDataChange} showToast={showToast} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;