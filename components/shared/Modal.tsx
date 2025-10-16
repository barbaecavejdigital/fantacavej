import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

interface ModalProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose, size = 'lg' }) => {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const sizeClasses = { md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '3xl': 'max-w-3xl' };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onClose(), 150);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-150" 
            style={{opacity: isClosing ? 0 : 1}}
            onClick={handleClose}
        >
            <div 
                className={`bg-white dark:bg-slate-800/95 rounded-2xl shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col ${isClosing ? 'animate-modal-exit' : 'animate-modal-enter'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-6 border-b dark:border-slate-700 shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{title}</h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;