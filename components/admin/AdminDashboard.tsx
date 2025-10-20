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
    const [activeTab, setActiveTab] = useState<'customers' | 'actions' | 'prizes' | 'regulations'>('customers');

    const handleDataChange = useCallback(() => {
        setRefreshKey(prevKey => prevKey + 1);
    }, []);
    
    const renderTabButton = (tabName: 'customers' | 'actions' | 'prizes' | 'regulations', label: string) => {
        const isActive = activeTab === tabName;
        return (
            <button
                onClick={() => setActiveTab(tabName)}
                className={`${
                    isActive
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                } whitespace-nowrap py-3 px-2 sm:px-4 border-b-2 font-medium text-sm transition-colors`}
                aria-current={isActive ? 'page' : undefined}
            >
                {label}
            </button>
        );
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'customers':
                return (
                    <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:h-full">
                        {/* Mobile/Tablet View */}
                        <div className="lg:hidden space-y-6">
                            <AdminOverview refreshKey={refreshKey} show="stats-mobile" />
                            <CustomerManagement onDataChange={handleDataChange} showToast={showToast} />
                        </div>
                        
                        {/* Desktop View */}
                        <div className="hidden lg:block lg:col-span-2 h-full min-h-0">
                            <CustomerManagement onDataChange={handleDataChange} showToast={showToast} />
                        </div>
                        <div className="hidden lg:block lg:col-span-1 h-full min-h-0">
                            <AdminOverview refreshKey={refreshKey} show="stats-desktop" />
                        </div>
                    </div>
                );
            case 'actions':
                return <SettingsManagement onDataChange={handleDataChange} showToast={showToast} view="actions" />;
            case 'prizes':
                return <SettingsManagement onDataChange={handleDataChange} showToast={showToast} view="prizes" />;
            case 'regulations':
                return <SettingsManagement onDataChange={handleDataChange} showToast={showToast} view="regulations" />;
            default:
                return null;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in h-full flex flex-col">
            <header className="mb-6 shrink-0">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 tracking-tight">Bentornato, {user.firstName}!</h1>
                <p className="text-gray-500 mt-1">Ecco una panoramica del tuo programma fedeltà.</p>
            </header>

            <div className="border-b border-gray-200/80 shrink-0">
                <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto hide-scrollbar" aria-label="Tabs">
                    {renderTabButton('customers', 'Dashboard Clienti')}
                    {renderTabButton('actions', 'Azioni')}
                    {renderTabButton('prizes', 'Premi')}
                    {renderTabButton('regulations', 'Regolamento')}
                </nav>
            </div>

            <div key={activeTab} className="mt-6 flex-1 min-h-0 animate-tab-content-enter overflow-y-auto lg:overflow-y-hidden hide-scrollbar pb-28 lg:pb-0">
                 <div className="lg:h-full">
                    {renderTabContent()}
                 </div>
            </div>

            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-10">
                <AdminOverview refreshKey={refreshKey} show="recent" isStickyFooter={true} />
            </div>
        </div>
    );
};

export default AdminDashboard;