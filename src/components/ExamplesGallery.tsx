import { X } from 'lucide-react';
import { EXAMPLES } from '../data/examples';
import { useI18n } from '../i18n';

interface ExamplesGalleryProps {
    onSelect: (example: typeof EXAMPLES[0]) => void;
    onClose: () => void;
}

export function ExamplesGallery({ onSelect, onClose }: ExamplesGalleryProps) {
    const { t } = useI18n();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
                        {t.exampleDiagrams}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Examples Grid */}
                <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {EXAMPLES.map((example, index) => (
                            <button
                                key={index}
                                onClick={() => onSelect(example)}
                                className="text-left p-4 rounded-lg border border-slate-200 dark:border-slate-600 
                                    hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 
                                    transition-all group"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full 
                                        bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                                        {example.format.toUpperCase()}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full 
                                        bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                        {example.category}
                                    </span>
                                </div>
                                <h3 className="font-medium text-slate-800 dark:text-white mb-1 
                                    group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {example.name}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                    {example.description}
                                </p>
                                <pre className="mt-3 p-2 bg-slate-100 dark:bg-slate-900 rounded text-xs 
                                    text-slate-600 dark:text-slate-400 overflow-hidden max-h-20">
                                    {example.code.slice(0, 150)}...
                                </pre>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
