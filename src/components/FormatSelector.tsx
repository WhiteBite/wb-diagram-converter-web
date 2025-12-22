import { ArrowRight, BookOpen } from 'lucide-react';
import type { InputFormat, OutputFormat } from '@whitebite/diagram-converter';
import { useI18n } from '../i18n';

interface FormatSelectorProps {
    inputFormat: InputFormat;
    outputFormat: OutputFormat;
    onInputChange: (format: InputFormat) => void;
    onOutputChange: (format: OutputFormat) => void;
    onShowExamples: () => void;
}

export function FormatSelector({
    inputFormat,
    outputFormat,
    onInputChange,
    onOutputChange,
    onShowExamples,
}: FormatSelectorProps) {
    const { t } = useI18n();

    const INPUT_FORMATS = [
        { value: 'mermaid', label: t.formats.mermaid, icon: '📊' },
        { value: 'drawio', label: t.formats.drawio, icon: '📐' },
        { value: 'excalidraw', label: t.formats.excalidraw, icon: '✏️' },
        { value: 'plantuml', label: t.formats.plantuml, icon: '🌱' },
        { value: 'dot', label: t.formats.dot, icon: '🔗' },
    ];

    const OUTPUT_FORMATS: Array<{ value: string; label: string; icon: string; disabled?: boolean }> = [
        { value: 'drawio', label: t.formats.drawio, icon: '📐' },
        { value: 'excalidraw', label: t.formats.excalidraw, icon: '✏️' },
        { value: 'mermaid', label: t.formats.mermaid, icon: '📊' },
        { value: 'plantuml', label: t.formats.plantuml, icon: '🌱' },
        { value: 'dot', label: t.formats.dot, icon: '🔗' },
        { value: 'svg', label: t.formats.svg, icon: '🖼️' },
        { value: 'png', label: t.formats.png, icon: '📷' },
    ];

    return (
        <div className="card p-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Input Format */}
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        {t.from}
                    </label>
                    <select
                        value={inputFormat}
                        onChange={(e) => onInputChange(e.target.value as InputFormat)}
                        className="select w-full"
                    >
                        {INPUT_FORMATS.map((format) => (
                            <option
                                key={format.value}
                                value={format.value}
                            >
                                {format.icon} {format.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 mt-6 sm:mt-0">
                    <ArrowRight className="w-5 h-5 text-slate-500" />
                </div>

                {/* Output Format */}
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                        {t.to}
                    </label>
                    <select
                        value={outputFormat}
                        onChange={(e) => onOutputChange(e.target.value as OutputFormat)}
                        className="select w-full"
                    >
                        {OUTPUT_FORMATS.map((format) => (
                            <option
                                key={format.value}
                                value={format.value}
                                disabled={format.disabled}
                            >
                                {format.icon} {format.label} {format.disabled ? `(${t.soon})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Examples Button */}
                <div className="sm:mt-6">
                    <button
                        onClick={onShowExamples}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>{t.examples}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
