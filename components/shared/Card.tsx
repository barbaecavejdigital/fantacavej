import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, className, style }) => {
    return (
        <div 
            className={`bg-white shadow-xl shadow-gray-200/50 rounded-3xl p-6 sm:p-8 border border-black/5 ${className}`}
            style={style}
        >
            {children}
        </div>
    );
};

export default Card;
