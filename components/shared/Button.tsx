import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', fullWidth = false, className, ...props }) => {
    const baseClasses = 'font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-slate-900 transform active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100';

    const variantClasses = {
        primary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500 disabled:bg-purple-400',
        secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 dark:focus:ring-slate-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-400'
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