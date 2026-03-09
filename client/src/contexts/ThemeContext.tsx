import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';

export type ThemeType = 'PVZ' | 'MINECRAFT';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  card: string;
  button: string;
  buttonHover: string;
}

interface ThemeConfig {
  name: string;
  emoji: string;
  colors: ThemeColors;
  elements: {
    headerIcon: string;
    pointsIcon: string;
    shopIcon: string;
    badgeIcon: string;
    rulesIcon: string;
    logoutIcon: string;
  };
}

interface ThemeContextType {
  theme: ThemeType;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 植物大战僵尸主题配置
const pvzTheme: ThemeConfig = {
  name: '植物大战僵尸',
  emoji: '🌻',
  colors: {
    primary: '#4CAF50', // 绿色
    secondary: '#FFC107', // 黄色
    accent: '#FF5722', // 橙色
    background: 'from-green-400 to-yellow-400',
    text: 'text-gray-800',
    card: 'bg-white/95 backdrop-blur-sm',
    button: 'bg-gradient-to-r from-green-500 to-yellow-500',
    buttonHover: 'bg-gradient-to-r from-green-600 to-yellow-600',
  },
  elements: {
    headerIcon: '🌻',
    pointsIcon: '☀️',
    shopIcon: '🧟',
    badgeIcon: '🏆',
    rulesIcon: '📋',
    logoutIcon: '🚪',
  },
};

// 我的世界主题配置
const minecraftTheme: ThemeConfig = {
  name: '我的世界',
  emoji: '⛏️',
  colors: {
    primary: '#2196F3', // 蓝色
    secondary: '#4CAF50', // 绿色
    accent: '#FF9800', // 橙色
    background: 'from-green-600 to-blue-600',
    text: 'text-gray-800',
    card: 'bg-white/95 backdrop-blur-sm',
    button: 'bg-gradient-to-r from-blue-500 to-green-500',
    buttonHover: 'bg-gradient-to-r from-blue-600 to-green-600',
  },
  elements: {
    headerIcon: '⛏️',
    pointsIcon: '💎',
    shopIcon: '🧱',
    badgeIcon: '🏅',
    rulesIcon: '📜',
    logoutIcon: '🚶',
  },
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  const [theme, setThemeState] = useState<ThemeType>('PVZ');

  // 从用户数据或本地存储加载主题
  useEffect(() => {
    if (user?.theme) {
      setThemeState(user.theme as ThemeType);
    } else {
      const savedTheme = localStorage.getItem('theme') as ThemeType;
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    }
  }, [user]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    // TODO: 更新用户主题到服务器
  };

  const themeConfig = theme === 'PVZ' ? pvzTheme : minecraftTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};