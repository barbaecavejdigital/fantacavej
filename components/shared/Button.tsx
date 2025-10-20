import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', fullWidth = false, className, ...props }) => {
    const baseClasses = 'font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 transform active:scale-[0.98] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 hover:-translate-y-0.5 hover:shadow-lg';

    const variantClasses = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500/30 disabled:bg-indigo-400 shadow-indigo-500/20',
        secondary: 'bg-gray-200/70 text-gray-800 hover:bg-gray-200 focus:ring-gray-500/30 border border-transparent',
        danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500/30 disabled:bg-red-400 shadow-red-500/20'
    };

    const sizeClasses = {
        sm: 'py-2 px-4 text-xs',
        md: 'py-2.5 px-6 text-sm',
        lg: 'py-3 px-8 text-base'
    };
    
    const widthClass = fullWidth ? 'w-full' : '';

    const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
};

export default Button;
