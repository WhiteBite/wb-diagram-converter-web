import { useState, useCallback, useEffect, useMemo } from 'react';
import { Wand2, X, CheckCircle, AlertTriangle, PanelLeftClose, PanelRightClose, Maximize2, Pencil, Loader2 } from 'lucide-react';
import { Header } from './components/Header';
import { FormatSelector } from './components/FormatSelector';
import { CodeEditor } from './components/CodeEditor';
import { OutputPanel } from './components/OutputPanel';
import { Preview } from './components/Preview';
import { ExamplesGallery } from './components/ExamplesGallery';
import { ConversionHistory } from './components/ConversionHistory';
import { ResizablePanel } from './components/ResizablePanel';
import { FullscreenModal } from './components/FullscreenModal';
import { useConverter } from './hooks/useConverter';
import { useFixer } from './hooks/useFixer';
import { useTheme } from './hooks/useTheme';
import { useConversionHistory } from './hooks/useConversionHistory';
import { useBoardEditor } from './hooks/useBoardEditor';
import { EXAMPLES } from './data/examples';
import { 
    parseMermaid, 
    parsePlantUML, 
    parseDot,
    parseDrawio,
    parseExcalidraw,
} from '@whitebite/diagram-converter';

import type { InputFormat, OutputFormat, DiagramFormat, Diagram } from '@whitebite/diagram-converter';

/** Parse code to IR based on format */
function parseToIR(code: string, format: InputFormat): Diagram | null {
    try {
        switch (format) {
            case 'mermaid':
                return parseMermaid(code);
            case 'plantuml':
                return parsePlantUML(code);
            case 'dot':
                return parseDot(code);
            case 'drawio':
                return parseDrawio(code);
            case 'excalidraw':
                return parseExcalidraw(code);
            default:
                return null;
        }
    } catch {
        return null;
    }
}

/** Formats that support parsing (can be edited visually) */
const PARSEABLE_FORMATS: readonly DiagramFormat[] = ['mermaid', 'drawio', 'plantuml', 'dot', 'excalidraw'] as const;

/** Check if output format supports parsing */
function isParseableFormat(format: OutputFormat): format is DiagramFormat {
    return PARSEABLE_FORMATS.includes(format as DiagramFormat);
}

const DEFAULT_CODE = `flowchart LR
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
    C --> E((Result))
    E --> D`;

function App() {
    const [inputFormat, setInputFormat] = useState<InputFormat>('mermaid');
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('drawio');
    const [code, setCode] = useState(DEFAULT_CODE);
    const { isDark, toggle: toggleDarkMode } = useTheme();
    const [showExamples, setShowExamples] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [inputFullscreen, setInputFullscreen] = useState(false);
    
    // Track which editor is being used: 'input' or 'output'
    const [editingTarget, setEditingTarget] = useState<'input' | 'output' | null>(null);
    
    // Store edited output separately (when user edits output visually)
    const [editedOutput, setEditedOutput] = useState<string | null>(null);

    const { output, error, isConverting } = useConverter(code, inputFormat, outputFormat);
    const { fix, fixResult, isFixerAvailable, clearResult } = useFixer(code, inputFormat, setCode);
    const { history, addToHistory, clearHistory, removeFromHistory } = useConversionHistory();
    const { openEditor, isEditing, result: boardResult, error: boardError, reset: resetBoard } = useBoardEditor();

    // Add to history when conversion succeeds
    useEffect(() => {
        if (output && !error && code.trim()) {
            addToHistory({
                inputFormat,
                outputFormat,
                inputCode: code,
            });
        }
    }, [output, error]);

    // Handle history item selection
    const handleHistorySelect = useCallback((record: { inputCode: string; inputFormat: string; outputFormat: string }) => {
        setCode(record.inputCode);
        setInputFormat(record.inputFormat as InputFormat);
        setOutputFormat(record.outputFormat as OutputFormat);
        setShowHistory(false);
    }, []);

    // Parse code to IR for visual editing
    const diagram = useMemo(() => {
        if (!code.trim()) return null;
        return parseToIR(code, inputFormat);
    }, [code, inputFormat]);

    // Parse output to IR for visual editing (only for parseable formats)
    const outputDiagram = useMemo(() => {
        const outputToUse = editedOutput ?? output;
        if (!outputToUse || !isParseableFormat(outputFormat)) return null;
        return parseToIR(outputToUse, outputFormat as InputFormat);
    }, [output, editedOutput, outputFormat]);

    // Handle board editor result based on editing target
    useEffect(() => {
        if (boardResult) {
            if (editingTarget === 'input') {
                setCode(boardResult.code);
            } else if (editingTarget === 'output') {
                // Store edited output directly
                setEditedOutput(boardResult.code);
            }
            resetBoard();
            setEditingTarget(null);
        }
    }, [boardResult, editingTarget, resetBoard]);
    
    // Reset edited output when input or formats change
    useEffect(() => {
        setEditedOutput(null);
    }, [code, inputFormat, outputFormat]);
    
    // Use edited output if available, otherwise use converted output
    const displayOutput = editedOutput ?? output;

    // Handle board editor error
    useEffect(() => {
        if (boardError) {
            console.error('[BoardEditor] Error:', boardError.message);
            resetBoard();
            setEditingTarget(null);
        }
    }, [boardError, resetBoard]);

    // Edit input visually
    const handleEditInputVisually = useCallback(() => {
        if (diagram) {
            setEditingTarget('input');
            openEditor(diagram, inputFormat as DiagramFormat, inputFormat as DiagramFormat);
        }
    }, [diagram, inputFormat, openEditor]);

    // Edit output visually
    const handleEditOutputVisually = useCallback(() => {
        if (outputDiagram && isParseableFormat(outputFormat)) {
            setEditingTarget('output');
            openEditor(outputDiagram, outputFormat as DiagramFormat, outputFormat as DiagramFormat);
        }
    }, [outputDiagram, outputFormat, openEditor]);

    useEffect(() => {
        if (fixResult && code !== fixResult.fixed) {
            clearResult();
        }
    }, [code, fixResult, clearResult]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const encodedCode = params.get('code');
        const from = params.get('from') as InputFormat;
        const to = params.get('to') as OutputFormat;

        if (encodedCode) {
            try {
                setCode(atob(encodedCode));
            } catch {
                console.error('Failed to decode URL code');
            }
        }
        if (from) setInputFormat(from);
        if (to) setOutputFormat(to);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                setShowPreview(p => !p);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleExampleSelect = useCallback((example: typeof EXAMPLES[0]) => {
        setCode(example.code);
        setInputFormat(example.format as InputFormat);
        setShowExamples(false);
    }, []);

    const handleShare = useCallback(() => {
        const params = new URLSearchParams({
            from: inputFormat,
            to: outputFormat,
            code: btoa(code),
        });
        const url = `${window.location.origin}${window.location.pathname}?${params}`;
        navigator.clipboard.writeText(url);
        alert('Link copied!');
    }, [code, inputFormat, outputFormat]);

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <Header darkMode={isDark} onToggleDarkMode={toggleDarkMode} onShare={handleShare} onShowHistory={() => setShowHistory(true)} />
            <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 flex-shrink-0">
                <FormatSelector inputFormat={inputFormat} outputFormat={outputFormat} onInputChange={setInputFormat} onOutputChange={setOutputFormat} onShowExamples={() => setShowExamples(true)} />
            </div>
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <ResizablePanel direction="vertical" defaultSize={showPreview ? 60 : 100} minSize={30} maxSize={showPreview ? 85 : 100} className="flex-1">
                    <div className="h-full p-4">
                        <ResizablePanel direction="horizontal" defaultSize={50} minSize={25} maxSize={75} className="h-full">
                            <div className="card h-full flex flex-col mr-2">
                                <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                                    <h2 className="font-semibold text-slate-700 dark:text-slate-200">Input ({inputFormat.toUpperCase()})</h2>
                                    <div className="flex items-center gap-2">
                                        {diagram && (
                                            <button
                                                onClick={handleEditInputVisually}
                                                disabled={isEditing && editingTarget === 'input'}
                                                data-testid="edit-input-visually"
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                title="Edit input diagram visually"
                                            >
                                                {isEditing && editingTarget === 'input' ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Editing...</span></>
                                                ) : (
                                                    <><Pencil className="w-4 h-4" /><span>Edit Visually</span></>
                                                )}
                                            </button>
                                        )}
                                        {isFixerAvailable && (<button onClick={fix} className="btn btn-ghost p-2 text-indigo-600" title="Fix"><Wand2 className="w-4 h-4" /></button>)}
                                        <button onClick={() => setInputFullscreen(true)} className="btn btn-ghost p-2" title="Fullscreen"><Maximize2 className="w-4 h-4" /></button>
                                        <span className="text-xs text-slate-500">{code.split('\n').length} lines</span>
                                    </div>
                                </div>
                                {fixResult && (
                                    <div className={`mx-3 mt-3 p-3 rounded-lg flex items-start gap-3 flex-shrink-0 ${fixResult.appliedFixes > 0 ? 'bg-green-50 border border-green-200' : fixResult.errors.length > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-200'}`}>
                                        {fixResult.appliedFixes > 0 ? <CheckCircle className="w-5 h-5 text-green-500" /> : fixResult.errors.length > 0 ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : <CheckCircle className="w-5 h-5 text-slate-400" />}
                                        <div className="flex-1 text-sm">{fixResult.appliedFixes > 0 ? <p className="text-green-700">Fixed {fixResult.appliedFixes} issues</p> : fixResult.errors.length > 0 ? <p className="text-amber-700">{fixResult.errors.length} issues found</p> : <p className="text-slate-600">No issues</p>}</div>
                                        <button onClick={clearResult} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                                    </div>
                                )}
                                <div className="flex-1 p-3 min-h-0">
                                    <div className="h-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                        <CodeEditor value={code} onChange={setCode} language={inputFormat === 'mermaid' ? 'markdown' : 'xml'} />
                                    </div>
                                </div>
                            </div>
                            <div className="card h-full flex flex-col ml-2 p-3">
                                <OutputPanel 
                                    output={displayOutput} 
                                    error={error} 
                                    isConverting={isConverting} 
                                    format={outputFormat}
                                    canEditVisually={isParseableFormat(outputFormat) && !!outputDiagram}
                                    isEditingVisually={isEditing && editingTarget === 'output'}
                                    onEditVisually={handleEditOutputVisually}
                                />
                            </div>
                        </ResizablePanel>
                    </div>
                    {showPreview && (
                        <div className="h-full p-4 pt-0">
                            <div className="card h-full p-4 flex flex-col">
                                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">Preview</h3>
                                </div>
                                <div className="flex-1 min-h-0">
                                    <Preview code={code} format={inputFormat} output={displayOutput} outputFormat={outputFormat} />
                                </div>
                            </div>
                        </div>
                    )}
                </ResizablePanel>
                <button onClick={() => setShowPreview(!showPreview)} className="absolute bottom-4 right-4 btn btn-secondary shadow-lg flex items-center gap-2 z-10" title={showPreview ? 'Hide preview' : 'Show preview'}>
                    {showPreview ? <><PanelRightClose className="w-4 h-4" /><span className="text-sm">Hide Preview</span></> : <><PanelLeftClose className="w-4 h-4" /><span className="text-sm">Show Preview</span></>}
                </button>
            </main>
            {showExamples && <ExamplesGallery onSelect={handleExampleSelect} onClose={() => setShowExamples(false)} />}
            {showHistory && (
                <ConversionHistory
                    history={history}
                    onSelect={handleHistorySelect}
                    onClear={clearHistory}
                    onRemove={removeFromHistory}
                    onClose={() => setShowHistory(false)}
                />
            )}
            <FullscreenModal isOpen={inputFullscreen} onClose={() => setInputFullscreen(false)} title={`Input (${inputFormat.toUpperCase()})`}>
                <div className="h-full p-4"><div className="h-full rounded-lg overflow-hidden border border-slate-700"><CodeEditor value={code} onChange={setCode} language={inputFormat === 'mermaid' ? 'markdown' : 'xml'} /></div></div>
            </FullscreenModal>
        </div>
    );
}

export default App;
