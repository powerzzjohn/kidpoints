import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface PointsDisplayProps {
  points: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({ 
  points, 
  label = '积分', 
  size = 'md',
  showIcon = true 
}) => {
  const { themeConfig } = useTheme();
  
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  };

  const iconSize = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl'
  };

  return (
    <div className="text-center">
      <div className="flex items-center justify-center space-x-2">
        {showIcon && (
          <span className={`${iconSize[size]} mr-2`}>
            {themeConfig.elements.pointsIcon}
          </span>
        )}
        <div>
          <div className={`font-bold text-${size} text-gray-800`}>
            {points.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">{label}</div>
        </div>
      </div>
    </div>
  );
};

export default PointsDisplay;