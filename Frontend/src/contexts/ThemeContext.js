import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('fittrack_theme') || 'dark');

  useEffect(() => {
    // Apply to <html> so CSS vars work on EVERY page, not just ones that use ThemeContext
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    localStorage.setItem('fittrack_theme', theme);
  }, [theme]);

  // Apply on first load too (before React hydrates)
  useEffect(() => {
    const saved = localStorage.getItem('fittrack_theme') || 'dark';
    if (saved === 'light') {
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};