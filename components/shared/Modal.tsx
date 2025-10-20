import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const modalRoot = document.getElementById('modal-root');

const Modal: React.FC<ModalProps> = ({ title, children, onClose, size = 'lg' }) => {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose();
        };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleKeyDown);
        }
    }, []);

    const sizeClasses = { md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl', '3xl': 'max-w-3xl' };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => onClose(), 200);
    };

    const modalContent = (
        <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-200" 
            style={{opacity: isClosing ? 0 : 1}}
            onClick={handleClose}
        >
            <div 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/20 w-[calc(100%-2rem)] ${sizeClasses[size]} max-h-[90vh] flex flex-col border border-black/10 ${isClosing ? 'animate-modal-exit' : 'animate-modal-enter'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-5 border-b border-black/10 shrink-0">
                    <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                    <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 bg-black/10 hover:text-gray-700 hover:bg-black/20 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );

    if (!modalRoot) {
        return null;
    }

    return createPortal(modalContent, modalRoot);
};

export default Modal;