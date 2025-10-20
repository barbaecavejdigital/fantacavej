import React from 'react';
import { APP_TITLE } from '../constants';
import Button from './shared/Button';

interface HomePageProps {
    onNavigateToLogin: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigateToLogin }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#f2f2f7] text-center overflow-hidden">
            <div className="relative w-full max-w-4xl mx-auto">
                {/* Background decorative shapes */}
                <div className="absolute -top-20 -left-20 w-48 h-48 bg-indigo-200 rounded-full opacity-30 mix-blend-multiply filter blur-xl animate-blob"></div>
                <div className="absolute -bottom-20 -right-10 w-64 h-64 bg-green-200 rounded-full opacity-30 mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 w-56 h-56 bg-red-200 rounded-full opacity-30 mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>

                <div className="relative z-10 animate-fade-in-slide-up">
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-black/5 mb-8">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} className="w-16 h-16 text-indigo-500 stroke-current">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-800 tracking-tighter">
                        Benvenuto in <span className="text-indigo-600">{APP_TITLE}</span>
                    </h1>
                    <p className="max-w-2xl mx-auto mt-4 text-lg text-gray-500">
                        Il tuo programma fedeltà esclusivo. Accumula punti, riscatta premi fantastici e sentiti parte del nostro club.
                    </p>
                    <div className="mt-10">
                        <Button onClick={onNavigateToLogin} size="lg" className="!text-lg !px-10 !py-4">
                            Accedi al Club
                        </Button>
                    </div>
                </div>
            </div>
            <style>
                {`
                    @keyframes blob {
                        0% { transform: translate(0px, 0px) scale(1); }
                        33% { transform: translate(30px, -50px) scale(1.1); }
                        66% { transform: translate(-20px, 20px) scale(0.9); }
                        100% { transform: translate(0px, 0px) scale(1); }
                    }
                    .animate-blob {
                        animation: blob 7s infinite;
                    }
                    .animation-delay-2000 {
                        animation-delay: 2s;
                    }
                    .animation-delay-4000 {
                        animation-delay: 4s;
                    }
                `}
            </style>
        </div>
    );
};

export default HomePage;
