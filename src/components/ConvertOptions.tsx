/**
 * Conversion options panel
 */

import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../i18n';

export interface ConvertOptionsValue {
    transliterate: boolean;
    maxLength: number | null;
    autoLayout: boolean;
    layoutDirection: 'TB' | 'LR' | 'BT' | 'RL';
}

interface ConvertOptionsProps {
    value: ConvertOptionsValue;
    onChange: (value: ConvertOptionsValue) => void;
}

export function ConvertOptions({ value, onChange }: ConvertOptionsProps) {
    const { t } = useI18n();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleChange = <K extends keyof ConvertOptionsValue>(
        key: K,
        newValue: ConvertOptionsValue[K]
    ) => {
        onChange({ ...value, [key]: newValue });
    };

    return (
        <div className="card">
            {/* Header - always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors rounded-lg"
            >
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                        {t.convertOptions || 'Conversion Options'}
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
            </button>

            {/* Options panel */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                    {/* Text Options */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {t.textOptions || 'Text Options'}
                        </h4>

                        {/* Transliterate */}
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={value.transliterate}
                                onChange={(e) => handleChange('transliterate', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <div>
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                    {t.transliterate || 'Transliterate Cyrillic'}
                                </span>
                                <p className="text-xs text-slate-500">
                                    {t.transliterateHint || 'Convert Cyrillic to Latin (for formats with poor Unicode support)'}
                                </p>
                            </div>
                        </label>

                        {/* Max Length */}
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={value.maxLength !== null}
                                    onChange={(e) => handleChange('maxLength', e.target.checked ? 50 : null)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                    {t.truncateLabels || 'Truncate long labels'}
                                </span>
                            </label>
                            {value.maxLength !== null && (
                                <input
                                    type="number"
                                    min={10}
                                    max={200}
                                    value={value.maxLength}
                                    onChange={(e) => handleChange('maxLength', parseInt(e.target.value) || 50)}
                                    className="w-20 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                                />
                            )}
                        </div>
                    </div>

                    {/* Layout Options */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {t.layoutOptions || 'Layout Options'}
                        </h4>

                        {/* Auto Layout */}
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={value.autoLayout}
                                onChange={(e) => handleChange('autoLayout', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                {t.autoLayout || 'Auto-layout nodes'}
                            </span>
                        </label>

                        {/* Direction */}
                        {value.autoLayout && (
                            <div className="flex items-center gap-2 ml-7">
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                    {t.direction || 'Direction'}:
                                </span>
                                <select
                                    value={value.layoutDirection}
                                    onChange={(e) => handleChange('layoutDirection', e.target.value as ConvertOptionsValue['layoutDirection'])}
                                    className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                                >
                                    <option value="TB">↓ Top to Bottom</option>
                                    <option value="LR">→ Left to Right</option>
                                    <option value="BT">↑ Bottom to Top</option>
                                    <option value="RL">← Right to Left</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export const DEFAULT_CONVERT_OPTIONS: ConvertOptionsValue = {
    transliterate: false,
    maxLength: null,
    autoLayout: true,
    layoutDirection: 'LR',
};
