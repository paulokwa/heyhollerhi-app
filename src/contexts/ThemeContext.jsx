import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    // Determine initial theme: check localStorage, otherwise default to 'auto'
    const [theme, setThemeState] = useState(() => {
        const savedTheme = localStorage.getItem('app-theme');
        return savedTheme || 'auto';
    });

    // We also need a "resolved" theme for components like MapTiler that need a concrete 'light' or 'dark' string
    const [resolvedTheme, setResolvedTheme] = useState('dark');

    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('app-theme', newTheme);
    };

    useEffect(() => {
        const root = document.documentElement;

        const updateTheme = () => {
            if (theme === 'auto') {
                // Check system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const activeTheme = prefersDark ? 'dark' : 'light';

                root.setAttribute('data-theme', activeTheme);
                setResolvedTheme(activeTheme);
            } else {
                root.setAttribute('data-theme', theme);
                setResolvedTheme(theme);
            }
        };

        updateTheme();

        // If 'auto', listen for OS changes
        if (theme === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => updateTheme();
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
