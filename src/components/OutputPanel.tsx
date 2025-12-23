import { useState } from 'react';
import { Copy, Download, Check, AlertCircle, Loader2, Maximize2, WrapText, Hash, ExternalLink } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { FullscreenModal } from './FullscreenModal';

interface OutputPanelProps {
    output: string;
    error: string | null;
    isConverting: boolean;
    format: string;
}

const BOARD_URL = 'https://whitebite.github.io/wb-diagram-board';

export function OutputPanel({ output, error, isConverting, format }: OutputPanelProps) {
    const [copied, setCopied] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [wordWrap, setWordWrap] = useState(true);
    const [lineNumbers, setLineNumbers] = useState(true);

    const handleCopy = async () => {
        if (!output) return;
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!output) return;

        const extensions: Record<string, string> = {
            drawio: 'drawio',
            excalidraw: 'excalidraw',
            mermaid: 'md',
            plantuml: 'puml',
            dot: 'dot',
            svg: 'svg',
        };

        const mimeTypes: Record<string, string> = {
            drawio: 'application/xml',
            excalidraw: 'application/json',
            mermaid: 'text/markdown',
            plantuml: 'text/plain',
            dot: 'text/plain',
            svg: 'image/svg+xml',
        };

        const blob = new Blob([output], { type: mimeTypes[format] || 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagram.${extensions[format] || 'txt'}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleOpenInEditor = async () => {
        if (!output) return;
        // Copy to clipboard and open editor
        await navigator.clipboard.writeText(output);
        window.open(BOARD_URL, '_blank');
    };

    // Check if format is supported by the editor
    const canOpenInEditor = ['excalidraw'].includes(format);

    const getLanguage = () => {
        switch (format) {
            case 'drawio':
            case 'svg':
                return 'xml';
            case 'excalidraw':
                return 'json';
            case 'dot':
                return 'plaintext';
            default:
                return 'plaintext';
        }
    };

    const renderEditor = () => (
        <CodeEditor
            value={output}
            onChange={() => { }}
            language={getLanguage()}
            readOnly
            wordWrap={wordWrap}
            lineNumbers={lineNumbers}
        />
    );

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-slate-700 dark:text-slate-200">
                        Output
                    </h2>
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded font-medium">
                        {format.toUpperCase()}
                    </span>
                    {isConverting && (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {/* Toggle buttons */}
                    <button
                        onClick={() => setWordWrap(!wordWrap)}
                        className={`p-1.5 rounded transition-colors ${wordWrap ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        title={wordWrap ? 'Disable Word Wrap' : 'Enable Word Wrap'}
                    >
                        <WrapText className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setLineNumbers(!lineNumbers)}
                        className={`p-1.5 rounded transition-colors ${lineNumbers ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        title={lineNumbers ? 'Hide Line Numbers' : 'Show Line Numbers'}
                    >
                        <Hash className="w-4 h-4" />
                    </button>

                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1" />

                    {/* Action buttons */}
                    <button
                        onClick={handleCopy}
                        disabled={!output || isConverting}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        title="Copy to clipboard"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={!output || isConverting}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        title="Download file"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    {canOpenInEditor && (
                        <button
                            onClick={handleOpenInEditor}
                            disabled={!output || isConverting}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors text-indigo-600"
                            title="Open in Editor"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => setIsFullscreen(true)}
                        disabled={!output}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                        title="Fullscreen"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0">
                {error ? (
                    <div className="h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20">
                        <div className="text-center p-6">
                            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                            <p className="text-red-600 dark:text-red-400 font-medium">
                                Conversion Error
                            </p>
                            <p className="text-sm text-red-500 dark:text-red-400 mt-2 max-w-md">
                                {error}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="h-full">
                        {renderEditor()}
                    </div>
                )}
            </div>

            {/* Fullscreen Modal */}
            <FullscreenModal
                isOpen={isFullscreen}
                onClose={() => setIsFullscreen(false)}
                title={`Output (${format.toUpperCase()})`}
            >
                <div className="h-full flex flex-col">
                    {/* Fullscreen toolbar */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <button
                            onClick={() => setWordWrap(!wordWrap)}
                            className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 ${wordWrap ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            <WrapText className="w-4 h-4" />
                            Word Wrap
                        </button>
                        <button
                            onClick={() => setLineNumbers(!lineNumbers)}
                            className={`px-3 py-1.5 rounded text-sm flex items-center gap-1.5 ${lineNumbers ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        >
                            <Hash className="w-4 h-4" />
                            Line Numbers
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={handleCopy}
                            className="px-3 py-1.5 rounded text-sm flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            Copy
                        </button>
                        <button
                            onClick={handleDownload}
                            className="px-3 py-1.5 rounded text-sm flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                    </div>
                    <div className="flex-1 min-h-0">
                        {renderEditor()}
                    </div>
                </div>
            </FullscreenModal>
        </div>
    );
}
