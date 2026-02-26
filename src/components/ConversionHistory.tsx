/**
 * Conversion History Panel Component
 * 
 * Displays list of recent conversions with ability to restore them
 */

import { X, Trash2, Clock, ArrowRight, History } from 'lucide-react';
import { useI18n } from '../i18n';
import type { ConversionRecord } from '../hooks/useConversionHistory';

interface ConversionHistoryProps {
    history: ConversionRecord[];
    onSelect: (record: ConversionRecord) => void;
    onClear: () => void;
    onRemove: (id: string) => void;
    onClose: () => void;
}

/** Format timestamp to readable string */
function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

/** Truncate code for preview */
function truncateCode(code: string, maxLength = 80): string {
    const firstLine = code.split('\n')[0];
    if (firstLine.length <= maxLength) return firstLine;
    return firstLine.slice(0, maxLength) + '...';
}

export function ConversionHistory({
    history,
    onSelect,
    onClear,
    onRemove,
    onClose,
}: ConversionHistoryProps) {
    const { t } = useI18n();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                            {t.history || 'Conversion History'}
                        </h2>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {history.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {history.length > 0 && (
                            <button
                                onClick={onClear}
                                className="btn btn-ghost p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title={t.clearHistory || 'Clear history'}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* History List */}
                <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                    {history.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">
                                {t.noHistory || 'No conversion history yet'}
                            </p>
                            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                                {t.historyHint || 'Your recent conversions will appear here'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {history.map((record) => (
                                <div
                                    key={record.id}
                                    className="group relative p-3 rounded-lg border border-slate-200 dark:border-slate-600 
                                        hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 
                                        transition-all cursor-pointer"
                                    onClick={() => onSelect(record)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full 
                                                bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                                                {record.inputFormat.toUpperCase()}
                                            </span>
                                            <ArrowRight className="w-3 h-3 text-slate-400" />
                                            <span className="px-2 py-0.5 text-xs font-medium rounded-full 
                                                bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                                                {record.outputFormat.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTime(record.timestamp)}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemove(record.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 
                                                    dark:hover:bg-red-900/30 rounded text-red-500 transition-opacity"
                                                title={t.remove || 'Remove'}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    <pre className="text-xs text-slate-600 dark:text-slate-400 
                                        bg-slate-50 dark:bg-slate-900 rounded p-2 overflow-hidden">
                                        {truncateCode(record.inputCode)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
