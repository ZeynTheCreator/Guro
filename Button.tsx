import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}) => {
  const baseStyles = "font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
    success: 'bg-accent text-white hover:bg-green-600 focus:ring-accent', // Assuming accent is green-like
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'bg-transparent text-primary hover:bg-red-100 focus:ring-primary', // Adjusted ghost hover
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;