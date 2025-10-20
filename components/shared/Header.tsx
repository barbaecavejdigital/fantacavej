import React from 'react';
import { User } from '../../types';
import { APP_TITLE } from '../../constants';
import AnimatedCounter from './AnimatedCounter';

interface HeaderProps {
    user: User;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
    return (
        <header className="bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-40 border-b border-black/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-3">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} className="w-8 h-8 text-indigo-500 stroke-current">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                        </svg>
                        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">{APP_TITLE}</h1>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <div className="text-right">
                            <p className="font-semibold text-gray-800 text-sm sm:text-base">{user.firstName} {user.lastName}</p>
                            <div className="text-xs sm:text-sm text-indigo-600 font-bold bg-indigo-100 px-3 py-1 rounded-full inline-block mt-1">
                                <AnimatedCounter endValue={user.points} /> Punti
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 bg-gray-200/50 hover:bg-gray-200 hover:text-indigo-500 transition-colors"
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
