import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'theme';

type Theme = 'light' | 'dark';

interface UseThemeResult {
    isDark: boolean;
    theme: Theme;
    toggle: () => void;
    setTheme: (theme: Theme) => void;
}

/**
 * Hook for managing dark/light theme with localStorage persistence
 * and system preference detection
 */
export function useTheme(): UseThemeResult {
    const [isDark, setIsDark] = useState<boolean>(() => {
        // Check localStorage first
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === 'dark' || saved === 'light') {
            return saved === 'dark';
        }
        // Fall back to system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    }, [isDark]);

    // Listen for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = (e: MediaQueryListEvent) => {
            // Only apply system preference if user hasn't explicitly set a theme
            const saved = localStorage.getItem(THEME_KEY);
            if (!saved) {
                setIsDark(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggle = useCallback(() => {
        setIsDark(prev => !prev);
    }, []);

    const setTheme = useCallback((theme: Theme) => {
        setIsDark(theme === 'dark');
    }, []);

    return {
        isDark,
        theme: isDark ? 'dark' : 'light',
        toggle,
        setTheme,
    };
}
