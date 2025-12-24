import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Initialize settings from localStorage
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [autoRefresh, setAutoRefresh] = useState(() => {
        const saved = localStorage.getItem('autoRefresh');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [fontSize, setFontSize] = useState(() => {
        const saved = localStorage.getItem('fontSize');
        return saved || 'medium';
    });

    // Apply dark mode theme on load and when it changes
    useEffect(() => {
        if (darkMode) {
            // Dark theme
            document.documentElement.style.setProperty('--bg-primary', '#0a0a0a');
            document.documentElement.style.setProperty('--bg-secondary', '#1f2937');
            document.documentElement.style.setProperty('--text-primary', '#ffffff');
            document.documentElement.style.setProperty('--text-secondary', '#a1a1a1');
            document.documentElement.style.setProperty('--border-color', '#374151');
            document.documentElement.style.setProperty('--card-bg', 'rgba(31, 41, 55, 1.0)');
            document.documentElement.style.setProperty('--input-bg', 'rgba(255, 255, 255, 0.05)');
            document.documentElement.style.setProperty('--hover-bg', 'rgba(255, 255, 255, 0.1)');
            document.documentElement.style.setProperty('--navbar-bg', 'rgba(10, 10, 10, 0.8)');
            document.documentElement.style.setProperty('--heading-color', '#ffffff');
        } else {
            // Light theme
            document.documentElement.style.setProperty('--bg-primary', '#f9fafb');
            document.documentElement.style.setProperty('--bg-secondary', '#ffffff');
            document.documentElement.style.setProperty('--text-primary', '#111827');
            document.documentElement.style.setProperty('--text-secondary', '#6b7280');
            document.documentElement.style.setProperty('--border-color', '#e5e7eb');
            document.documentElement.style.setProperty('--card-bg', '#ffffff');
            document.documentElement.style.setProperty('--input-bg', '#f3f4f6');
            document.documentElement.style.setProperty('--hover-bg', '#f3f4f6');
            document.documentElement.style.setProperty('--navbar-bg', 'rgba(243, 244, 246, 0.95)');
            document.documentElement.style.setProperty('--heading-color', '#1f2937');
        }
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    // Save auto-refresh setting
    useEffect(() => {
        localStorage.setItem('autoRefresh', JSON.stringify(autoRefresh));
    }, [autoRefresh]);

    // Apply font size and save to localStorage
    useEffect(() => {
        const multipliers = {
            small: 0.875,
            medium: 1,
            large: 1.125
        };
        document.documentElement.style.setProperty('--font-size-multiplier', multipliers[fontSize]);
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    const value = {
        darkMode,
        setDarkMode,
        autoRefresh,
        setAutoRefresh,
        fontSize,
        setFontSize
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
