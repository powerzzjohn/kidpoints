import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const ThemeButton: React.FC<ThemeButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
}) => {
  const { themeConfig } = useTheme();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: `bg-gradient-to-r ${themeConfig.colors.button} text-white hover:${themeConfig.colors.buttonHover}`,
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    accent: `bg-gradient-to-r from-${themeConfig.colors.accent} to-${themeConfig.colors.secondary} text-white`,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg font-semibold
        transition-all duration-200
        transform hover:scale-105
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-md hover:shadow-lg
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default ThemeButton;