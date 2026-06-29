import React, { useEffect } from 'react';

export function ThemeProvider({ children }) {
  useEffect(() => {
    // Check if system prefers dark mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = (e) => {
      const isDark = e.matches || mediaQuery.matches;
      const html = document.documentElement;
      
      if (isDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    };
    
    // Set initial theme
    updateTheme({ matches: mediaQuery.matches });
    
    // Listen for changes
    mediaQuery.addEventListener('change', updateTheme);
    
    return () => {
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, []);

  return children;
}