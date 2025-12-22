import { ReactNode } from 'react';
import { Maximize2, ChevronDown, ChevronUp } from 'lucide-react';

interface PanelHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    onFullscreen?: () => void;
    className?: string;
}

export function PanelHeader({
    title,
    subtitle,
    actions,
    isCollapsed,
    onToggleCollapse,
    onFullscreen,
    className = '',
}: PanelHeaderProps) {
    return (
        <div className={`flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 ${className}`}>
            <div className="flex items-center gap-2">
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        {isCollapsed ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronUp className="w-4 h-4" />
                        )}
                    </button>
                )}
                <div>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                        {title}
                    </h3>
                    {subtitle && (
                        <span className="text-xs text-slate-500">{subtitle}</span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {actions}
                {onFullscreen && (
                    <button
                        onClick={onFullscreen}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Fullscreen"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
