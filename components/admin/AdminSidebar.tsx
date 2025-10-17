import React from 'react';
import { User } from '../../types';
import { APP_TITLE } from '../../constants';
import ThemeToggle from '../shared/ThemeToggle';

interface AdminSidebarProps {
    user: User;
    onLogout: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ user, onLogout }) => {
    return (
        <aside className="w-64 bg-white dark:bg-slate-800/50 flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-700/50">
            <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} className="w-8 h-8 text-purple-600 dark:text-purple-400 stroke-current">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">{APP_TITLE}</h1>
                </div>
            </div>

            <div className="flex-grow p-4">
                {/* Could add navigation items here in the future */}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                            <span className="font-bold text-purple-600 dark:text-purple-300">{user.firstName?.charAt(0)}</span>
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
                        </div>
                     </div>
                     <ThemeToggle />
                </div>
                <button
                    onClick={onLogout}
                    className="w-full mt-4 flex items-center justify-center gap-2 text-sm py-2.5 px-4 font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-slate-800 bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 dark:focus:ring-slate-500"
                    title="Logout"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
