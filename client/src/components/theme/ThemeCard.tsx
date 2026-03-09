import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ThemeCardProps {
  children: React.ReactNode;
  title?: string;
  icon?: string;
  onClick?: () => void;
  className?: string;
  hoverEffect?: boolean;
}

const ThemeCard: React.FC<ThemeCardProps> = ({
  children,
  title,
  icon,
  onClick,
  className = '',
  hoverEffect = true,
}) => {
  const { themeConfig, theme } = useTheme();

  return (
    <div
      onClick={onClick}
      className={`
        ${themeConfig.colors.card}
        rounded-2xl shadow-lg
        ${hoverEffect ? 'transform hover:scale-105 hover:shadow-xl' : ''}
        transition-all duration-300
        border-2 border-opacity-20
        ${theme === 'PVZ' ? 'border-green-200' : 'border-blue-200'}
        p-6
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {(title || icon) && (
        <div className="flex items-center space-x-3 mb-4">
          {icon && <span className="text-3xl">{icon}</span>}
          {title && (
            <h3 className={`text-xl font-bold ${themeConfig.colors.text}`}>
              {title}
            </h3>
          )}
        </div>
      )}
      <div className={themeConfig.colors.text}>{children}</div>
    </div>
  );
};

export default ThemeCard;