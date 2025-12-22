import { useState, useCallback, useEffect } from 'react';
import { Wand2, X, CheckCircle, AlertTriangle, PanelLeftClose, PanelRightClose, Maximize2 } from 'lucide-react';
import { Header } from './components/Header';
import { FormatSelector } from './components/FormatSelector';
import { CodeEditor } from './components/CodeEditor';
import { OutputPanel } from './components/OutputPanel';
import { Preview } from './components/Preview';
import { ExamplesGallery } from './components/ExamplesGallery';
import { ResizablePanel } from './components/ResizablePanel';
import { FullscreenModal } from './components/FullscreenModal';
import { useConverter } from './hooks/useConverter';
import { useFixer } from './hooks/useFixer';
import { EXAMPLES } from './data/examples';

type InputFormat = 'mermaid' | 'drawio' | 'excalidraw' | 'plantuml' | 'dot';
type OutputFormat = 'drawio' | 'excalidraw' | 'mermaid' | 'plantuml' | 'dot' | 'svg' | 'png';

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
    const [darkMode, setDarkMode] = useState(false);
    const [showExamples, setShowExamples] = useState(false);
    const [showPreview, setShowPreview] = useState(true);
    const [inputFullscreen, setInputFullscreen] = useState(false);

    const { output, error, isConverting } = useConverter(code, inputFormat, outputFormat);
    const { fix, fixResult, isFixerAvailable, clearResult } = useFixer(code, inputFormat, setCode);

    useEffect(() => {
        if (fixResult && code !== fixResult.fixed) {
            clearResult();
        }
    }, [code, fixResult, clearResult]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

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
            <Header darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} onShare={handleShare} />
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
                                <OutputPanel output={output} error={error} isConverting={isConverting} format={outputFormat} />
                            </div>
                        </ResizablePanel>
                    </div>
                    {showPreview && (<div className="h-full p-4 pt-0"><div className="card h-full p-4"><Preview code={code} format={inputFormat} output={output} outputFormat={outputFormat} /></div></div>)}
                </ResizablePanel>
                <button onClick={() => setShowPreview(!showPreview)} className="absolute bottom-4 right-4 btn btn-secondary shadow-lg flex items-center gap-2 z-10" title={showPreview ? 'Hide preview' : 'Show preview'}>
                    {showPreview ? <><PanelRightClose className="w-4 h-4" /><span className="text-sm">Hide Preview</span></> : <><PanelLeftClose className="w-4 h-4" /><span className="text-sm">Show Preview</span></>}
                </button>
            </main>
            {showExamples && <ExamplesGallery onSelect={handleExampleSelect} onClose={() => setShowExamples(false)} />}
            <FullscreenModal isOpen={inputFullscreen} onClose={() => setInputFullscreen(false)} title={`Input (${inputFormat.toUpperCase()})`}>
                <div className="h-full p-4"><div className="h-full rounded-lg overflow-hidden border border-slate-700"><CodeEditor value={code} onChange={setCode} language={inputFormat === 'mermaid' ? 'markdown' : 'xml'} /></div></div>
            </FullscreenModal>
        </div>
    );
}

export default App;
