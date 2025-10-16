import React from 'react';
import { ToastData } from '../../types';
import Toast from './Toast';

interface ToastContainerProps {
    toasts: ToastData[];
    setToasts: React.Dispatch<React.SetStateAction<ToastData[]>>;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, setToasts }) => {
    
    const handleDismiss = (id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    };

    return (
        <div className="fixed top-6 right-6 z-[100] w-full max-w-xs space-y-3">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onDismiss={() => handleDismiss(toast.id)}
                />
            ))}
        </div>
    );
};

export default ToastContainer;