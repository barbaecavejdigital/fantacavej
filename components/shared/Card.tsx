import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={`bg-white dark:bg-slate-800/50 shadow-lg rounded-2xl p-6 sm:p-8 ${className}`}>
            {children}
        </div>
    );
};

export default Card;