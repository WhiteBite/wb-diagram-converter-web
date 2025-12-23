import { Moon, Sun, Share2, Github, Globe } from 'lucide-react';
import { useI18n } from '../i18n';

interface HeaderProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
    onShare: () => void;
}

export function Header({ darkMode, onToggleDarkMode, onShare }: HeaderProps) {
    const { t, language, setLanguage } = useI18n();

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ru' : 'en');
    };

    return (
        <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-shrink-0">
            <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">WB</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-slate-900 dark:text-white">
                                {t.appName}
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {t.appDescription}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="btn btn-ghost p-2 flex items-center gap-1"
                            title={language === 'en' ? 'Русский' : 'English'}
                        >
                            <Globe className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase">{language}</span>
                        </button>

                        <button
                            onClick={onShare}
                            className="btn btn-ghost p-2"
                            title={t.shareLink}
                        >
                            <Share2 className="w-5 h-5" />
                        </button>

                        <button
                            onClick={onToggleDarkMode}
                            className="btn btn-ghost p-2"
                            title={darkMode ? t.lightMode : t.darkMode}
                        >
                            {darkMode ? (
                                <Sun className="w-5 h-5" />
                            ) : (
                                <Moon className="w-5 h-5" />
                            )}
                        </button>

                        <a
                            href="https://www.npmjs.com/package/@whitebite/diagram-converter"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost p-2 hidden sm:flex"
                            title="NPM Package"
                        >
                            <span className="text-sm font-mono">npm</span>
                        </a>

                        <a
                            href="https://github.com/WhiteBite/wb-diagram-converter-web"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <Github className="w-4 h-4" />
                            <span className="hidden sm:inline">GitHub</span>
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
}
