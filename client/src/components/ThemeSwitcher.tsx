import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme, themeConfig } = useTheme();

  const handleThemeChange = (newTheme: 'PVZ' | 'MINECRAFT') => {
    setTheme(newTheme);
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="text-sm text-gray-600 mr-2">主题:</div>
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleThemeChange('PVZ')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition ${
            theme === 'PVZ'
              ? 'bg-white shadow-md text-green-600'
              : 'text-gray-600 hover:text-green-600'
          }`}
        >
          <span className="text-lg">🌻</span>
          <span className="text-sm font-medium">植物大战僵尸</span>
        </button>
        <button
          onClick={() => handleThemeChange('MINECRAFT')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md transition ${
            theme === 'MINECRAFT'
              ? 'bg-white shadow-md text-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          <span className="text-lg">⛏️</span>
          <span className="text-sm font-medium">我的世界</span>
        </button>
      </div>
    </div>
  );
};

export default ThemeSwitcher;