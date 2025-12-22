/**
 * i18n Context for WB Diagrams
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { translations, detectLanguage, t as formatString, type Language, type Translations } from './translations';

interface I18nContextValue {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
    format: (template: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'wb-diagrams-language';

interface I18nProviderProps {
    children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
    const [language, setLanguageState] = useState<Language>(() => {
        // Try to get from localStorage first
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'en' || stored === 'ru') {
            return stored;
        }
        // Otherwise detect from browser
        return detectLanguage();
    });

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(STORAGE_KEY, lang);
    }, []);

    // Update document lang attribute
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const value: I18nContextValue = {
        language,
        setLanguage,
        t: translations[language],
        format: formatString,
    };

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n(): I18nContextValue {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return context;
}
