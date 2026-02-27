import { useEffect, useState, useRef, useCallback } from 'react';
import { Maximize2, ZoomIn, ZoomOut, RotateCcw, Columns, Grid3X3, Image, Move } from 'lucide-react';
import { FullscreenModal } from './FullscreenModal';
import pako from 'pako';
import {
    parseMermaid,
    parseDrawio,
    parseExcalidraw,
    parsePlantUML,
    parseDot,
    parseD2,
    parseStructurizr,
    parseBpmn,
    parseGraphml,
    parseLucidchart,
} from '@whitebite/diagram-converter';
import type { Diagram, InputFormat } from '@whitebite/diagram-converter';

interface PreviewProps {
    code: string;
    format: string;
    output: string;
    outputFormat: string;
}

interface ZoomPanState {
    zoom: number;
    pan: { x: number; y: number };
}

interface DiagramViewerProps {
    content: React.ReactNode;
    svgContent?: string;
    className?: string;
    showGrid?: boolean;
}

// Improved DiagramViewer with better pan/zoom
function DiagramViewer({
    content,
    svgContent,
    className = '',
    showGrid = true,
}: DiagramViewerProps) {
    const [state, setState] = useState<ZoomPanState>({ zoom: 1, pan: { x: 0, y: 0 } });
    const [isPanning, setIsPanning] = useState(false);
    const [gridEnabled, setGridEnabled] = useState(showGrid);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const lastPanPos = useRef({ x: 0, y: 0 });

    const handleZoomIn = () => setState(s => ({ ...s, zoom: Math.min(s.zoom * 1.2, 4) }));
    const handleZoomOut = () => setState(s => ({ ...s, zoom: Math.max(s.zoom / 1.2, 0.25) }));
    const handleReset = () => setState({ zoom: 1, pan: { x: 0, y: 0 } });

    // Fit content to container
    const handleFitToView = useCallback(() => {
        if (!containerRef.current || !contentRef.current) return;
        const container = containerRef.current.getBoundingClientRect();
        const svg = contentRef.current.querySelector('svg');
        if (!svg) {
            setState({ zoom: 1, pan: { x: 0, y: 0 } });
            return;
        }
        const rect = svg.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const scaleX = (container.width - 60) / rect.width;
        const scaleY = (container.height - 60) / rect.height;
        const scale = Math.min(scaleX, scaleY, 1.5);
        setState({ zoom: Math.max(0.25, scale), pan: { x: 0, y: 0 } });
    }, []);

    // Reset on content change
    useEffect(() => {
        setState({ zoom: 1, pan: { x: 0, y: 0 } });
        const timer = setTimeout(handleFitToView, 150);
        return () => clearTimeout(timer);
    }, [content, handleFitToView]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Scroll = zoom, Shift+Scroll = pan horizontally
        if (e.shiftKey) {
            setState(s => ({
                ...s,
                pan: { x: s.pan.x - e.deltaY, y: s.pan.y },
            }));
        } else {
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setState(s => ({ ...s, zoom: Math.max(0.25, Math.min(4, s.zoom * delta)) }));
        }
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 0) {
            e.preventDefault();
            setIsPanning(true);
            lastPanPos.current = { x: e.clientX, y: e.clientY };
        }
    }, []);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isPanning) return;
            const dx = e.clientX - lastPanPos.current.x;
            const dy = e.clientY - lastPanPos.current.y;
            lastPanPos.current = { x: e.clientX, y: e.clientY };
            setState(s => ({ ...s, pan: { x: s.pan.x + dx, y: s.pan.y + dy } }));
        },
        [isPanning]
    );

    const handleMouseUp = useCallback(() => setIsPanning(false), []);

    // Export as PNG
    const handleExportPng = useCallback(async () => {
        if (!svgContent) return;
        const svgEl = document.createElement('div');
        svgEl.innerHTML = svgContent;
        const svg = svgEl.querySelector('svg');
        if (!svg) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const img = new window.Image();
        img.onload = () => {
            canvas.width = img.width * 2;
            canvas.height = img.height * 2;
            ctx.scale(2, 2);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const link = document.createElement('a');
            link.download = 'diagram.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }, [svgContent]);

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Compact Toolbar */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={handleZoomOut}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Zoom Out (Ctrl+Scroll)"
                    >
                        <ZoomOut className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono w-8 text-center">
                        {Math.round(state.zoom * 100)}%
                    </span>
                    <button
                        onClick={handleZoomIn}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                </div>
                <div className="flex items-center gap-0.5">
                    <button
                        onClick={handleReset}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Reset View"
                    >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button
                        onClick={() => setGridEnabled(!gridEnabled)}
                        className={`p-1 rounded ${gridEnabled ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500'}`}
                        title="Toggle Grid"
                    >
                        <Grid3X3 className="w-3.5 h-3.5" />
                    </button>
                    {svgContent && (
                        <button
                            onClick={handleExportPng}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Export PNG"
                        >
                            <Image className="w-3.5 h-3.5 text-slate-500" />
                        </button>
                    )}
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                className={`flex-1 overflow-hidden relative select-none ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    background: gridEnabled
                        ? 'linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)'
                        : undefined,
                    backgroundSize: gridEnabled ? '20px 20px' : undefined,
                }}
            >
                <div
                    ref={contentRef}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                        transform: `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`,
                        transformOrigin: 'center center',
                    }}
                >
                    {content}
                </div>
                {/* Pan hint */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-slate-400 bg-white/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">
                    <Move className="w-3 h-3" /> Drag to pan
                </div>
            </div>
        </div>
    );
}

export function Preview({ code, format, output, outputFormat }: PreviewProps) {
    const [viewMode, setViewMode] = useState<'split' | 'source' | 'output'>('split');
    const [sourceError, setSourceError] = useState<string | null>(null);
    const [outputError, setOutputError] = useState<string | null>(null);
    const [fullscreenPanel, setFullscreenPanel] = useState<'source' | 'output' | null>(null);
    const [sourceSvg, setSourceSvg] = useState<string>('');
    const [outputSvg, setOutputSvg] = useState<string>('');
    const [isSourceLoading, setIsSourceLoading] = useState(false);
    const [isOutputLoading, setIsOutputLoading] = useState(false);

    const sourceRenderSeq = useRef(0);
    const outputRenderSeq = useRef(0);

    // On format changes, keep last render visible and show loading instead.
    // This prevents flicker when switching formats.
    useEffect(() => {
        setSourceError(null);
        if (code.trim()) setIsSourceLoading(true);
    }, [format, code]);

    useEffect(() => {
        setOutputError(null);
        if (output) setIsOutputLoading(true);
    }, [outputFormat, output]);

    // Render source preview (supports multiple formats)
    useEffect(() => {
        if (!code.trim()) {
            setSourceSvg('');
            setSourceError(null);
            setIsSourceLoading(false);
            return;
        }

        setIsSourceLoading(true);
        const seq = ++sourceRenderSeq.current;
        const renderSource = async () => {
            try {
                if (format === 'mermaid') {
                    const mermaid = await import('mermaid');
                    mermaid.default.initialize({
                        startOnLoad: false,
                        theme: document.documentElement.classList.contains('dark')
                            ? 'dark'
                            : 'default',
                        securityLevel: 'loose',
                    });
                    const id = `mermaid-source-${Date.now()}`;
                    const { svg } = await mermaid.default.render(id, code);
                    if (seq !== sourceRenderSeq.current) return;
                    setSourceSvg(svg);
                    setSourceError(null);
                } else if (format === 'plantuml') {
                    const svg = await renderPlantUmlSvg(code);
                    if (seq !== sourceRenderSeq.current) return;
                    setSourceSvg(svg);
                    setSourceError(null);
                } else if (format === 'dot') {
                    const svg = await renderDotSvg(code);
                    if (seq !== sourceRenderSeq.current) return;
                    setSourceSvg(svg);
                    setSourceError(null);
                } else if (format === 'd2') {
                    const svg = await renderViaKroki(code, 'd2');
                    if (seq !== sourceRenderSeq.current) return;
                    setSourceSvg(svg);
                    setSourceError(null);
                } else if (format === 'structurizr') {
                    const svg = await renderViaKroki(code, 'structurizr');
                    if (seq !== sourceRenderSeq.current) return;
                    setSourceSvg(svg);
                    setSourceError(null);
                } else if (format === 'bpmn') {
                    const svg = await renderViaKroki(code, 'bpmn');
                    if (seq !== sourceRenderSeq.current) return;
                    setSourceSvg(svg);
                    setSourceError(null);
                } else if (format === 'graphml') {
                    const svg = renderGraphmlSvg(code);
                    if (seq !== sourceRenderSeq.current) return;
                    setSourceSvg(svg);
                    setSourceError(null);
                } else if (format === 'lucidchart') {
                    // Lucidchart JSON - render as simple node graph
                    const svg = renderLucidchartSvg(code);
                    if (seq !== sourceRenderSeq.current) return;
                    setSourceSvg(svg);
                    setSourceError(null);
                } else if (format === 'excalidraw') {
                    const data = JSON.parse(code);
                    const svg = renderExcalidrawSvg(data.elements || []);
                    if (seq !== sourceRenderSeq.current) return;
                    setSourceSvg(svg);
                    setSourceError(null);
                } else if (format === 'drawio') {
                    const svg = renderDrawioSvg(code);
                    if (seq !== sourceRenderSeq.current) return;
                    setSourceSvg(svg);
                    setSourceError(null);
                } else {
                    // Unknown format - no preview
                    const localSvg = renderViaIR(code, format as InputFormat);
                    if (seq !== sourceRenderSeq.current) return;
                    setSourceSvg(localSvg);
                    setSourceError(null);
                }
            } catch (err) {
                try {
                    // Fallback for any format: parse -> generic IR SVG
                    const localSvg = renderViaIR(code, format as InputFormat);
                    if (seq !== sourceRenderSeq.current) return;
                    setSourceSvg(localSvg);
                    setSourceError(null);
                } catch (fallbackErr) {
                    const message =
                        fallbackErr instanceof Error
                            ? fallbackErr.message
                            : err instanceof Error
                              ? err.message
                              : 'Render failed';
                    if (seq !== sourceRenderSeq.current) return;
                    setSourceError(message);
                }
            } finally {
                if (seq !== sourceRenderSeq.current) return;
                setIsSourceLoading(false);
            }
        };
        const timeout = setTimeout(renderSource, 400);
        return () => clearTimeout(timeout);
    }, [code, format]);

    // Render output preview
    useEffect(() => {
        setOutputError(null);

        if (!output) {
            setIsOutputLoading(false);
            return;
        }

        setIsOutputLoading(true);
        const seq = ++outputRenderSeq.current;
        const renderOutput = async () => {
            try {
                if (outputFormat === 'mermaid') {
                    const mermaid = await import('mermaid');
                    mermaid.default.initialize({
                        startOnLoad: false,
                        theme: document.documentElement.classList.contains('dark')
                            ? 'dark'
                            : 'default',
                        securityLevel: 'loose',
                    });
                    const id = `mermaid-output-${Date.now()}`;
                    const { svg } = await mermaid.default.render(id, output);
                    if (seq !== outputRenderSeq.current) return;
                    setOutputSvg(svg);
                    setOutputError(null);
                } else if (outputFormat === 'excalidraw') {
                    const data = JSON.parse(output);
                    const svg = renderExcalidrawSvg(data.elements || []);
                    if (seq !== outputRenderSeq.current) return;
                    setOutputSvg(svg);
                    setOutputError(null);
                } else if (outputFormat === 'drawio') {
                    const svg = renderDrawioSvg(output);
                    if (seq !== outputRenderSeq.current) return;
                    setOutputSvg(svg);
                    setOutputError(null);
                } else if (outputFormat === 'plantuml') {
                    // PlantUML via public API
                    const svg = await renderPlantUmlSvg(output);
                    if (seq !== outputRenderSeq.current) return;
                    setOutputSvg(svg);
                    setOutputError(null);
                } else if (outputFormat === 'dot') {
                    // DOT via viz.js
                    const svg = await renderDotSvg(output);
                    if (seq !== outputRenderSeq.current) return;
                    setOutputSvg(svg);
                    setOutputError(null);
                } else if (outputFormat === 'svg') {
                    // SVG output - show directly
                    if (seq !== outputRenderSeq.current) return;
                    setOutputSvg(output);
                    setOutputError(null);
                } else if (outputFormat === 'png') {
                    // PNG output - it's a data URL, wrap in img tag
                    if (output.startsWith('data:image/png')) {
                        if (seq !== outputRenderSeq.current) return;
                        setOutputSvg(`<img src="${output}" style="max-width:100%;height:auto;" />`);
                        setOutputError(null);
                    } else {
                        if (seq !== outputRenderSeq.current) return;
                        setOutputError(null);
                    }
                } else if (outputFormat === 'd2') {
                    // D2 - try Kroki, fallback to local renderer
                    try {
                        const svg = await renderViaKroki(output, 'd2');
                        if (seq !== outputRenderSeq.current) return;
                        setOutputSvg(svg);
                    } catch {
                        // Fallback to local D2 renderer
                        const svg = renderD2Svg(output);
                        if (seq !== outputRenderSeq.current) return;
                        setOutputSvg(svg);
                    }
                    if (seq !== outputRenderSeq.current) return;
                    setOutputError(null);
                } else if (outputFormat === 'structurizr') {
                    // Structurizr - try Kroki, fallback to local renderer
                    try {
                        const svg = await renderViaKroki(output, 'structurizr');
                        if (seq !== outputRenderSeq.current) return;
                        setOutputSvg(svg);
                    } catch {
                        // Fallback to local Structurizr renderer
                        const svg = renderStructurizrSvg(output);
                        if (seq !== outputRenderSeq.current) return;
                        setOutputSvg(svg);
                    }
                    if (seq !== outputRenderSeq.current) return;
                    setOutputError(null);
                } else if (outputFormat === 'bpmn') {
                    // BPMN via Kroki API
                    const svg = await renderViaKroki(output, 'bpmn');
                    if (seq !== outputRenderSeq.current) return;
                    setOutputSvg(svg);
                    setOutputError(null);
                } else if (outputFormat === 'graphml') {
                    // GraphML - render as simple node graph
                    const svg = renderGraphmlSvg(output);
                    if (seq !== outputRenderSeq.current) return;
                    setOutputSvg(svg);
                    setOutputError(null);
                } else {
                    const localSvg = renderViaIR(output, outputFormat as InputFormat);
                    if (seq !== outputRenderSeq.current) return;
                    setOutputSvg(localSvg);
                    setOutputError(null);
                }
            } catch (err) {
                try {
                    // Fallback for any output format that has parser
                    const localSvg = renderViaIR(output, outputFormat as InputFormat);
                    if (seq !== outputRenderSeq.current) return;
                    setOutputSvg(localSvg);
                    setOutputError(null);
                } catch (fallbackErr) {
                    const message =
                        fallbackErr instanceof Error
                            ? fallbackErr.message
                            : err instanceof Error
                              ? err.message
                              : 'Render failed';
                    if (seq !== outputRenderSeq.current) return;
                    setOutputError(message);
                }
            } finally {
                if (seq !== outputRenderSeq.current) return;
                setIsOutputLoading(false);
            }
        };
        const timeout = setTimeout(renderOutput, 200);
        return () => clearTimeout(timeout);
    }, [output, outputFormat]);

    const renderSourceContent = () => {
        if (sourceError) {
            return (
                <div className="text-red-500 text-xs p-4 bg-red-50 dark:bg-red-900/20 rounded-lg max-w-sm text-center">
                    <p className="font-medium mb-1">Syntax Error</p>
                    <p className="opacity-70 line-clamp-3">{sourceError}</p>
                </div>
            );
        }
        if (!sourceSvg && !code.trim()) {
            return <div className="text-slate-400 text-sm">Enter {format} code</div>;
        }
        if (!sourceSvg) {
            return <div className="text-slate-400 text-sm">Rendering {format}...</div>;
        }

        return (
            <div className="relative h-full">
                <div dangerouslySetInnerHTML={{ __html: sourceSvg }} className="diagram-content" />
                {isSourceLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px]">
                        <div className="text-slate-400 text-sm animate-pulse">Rendering…</div>
                    </div>
                )}
            </div>
        );
    };

    const renderOutputContent = () => {
        if (outputError) {
            return (
                <div className="text-red-500 text-xs p-4 bg-red-50 dark:bg-red-900/20 rounded-lg max-w-sm text-center">
                    <p className="font-medium mb-1">Render Error</p>
                    <p className="opacity-70 line-clamp-3">{outputError}</p>
                </div>
            );
        }
        if (outputSvg) {
            return (
                <div className="relative h-full">
                    <div
                        dangerouslySetInnerHTML={{ __html: outputSvg }}
                        className="diagram-content"
                    />
                    {isOutputLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px]">
                            <div className="text-slate-400 text-sm animate-pulse">Rendering…</div>
                        </div>
                    )}
                </div>
            );
        }
        if (!output) {
            return <div className="text-slate-400 text-sm">No output yet</div>;
        }
        return (
            <div className="text-center text-slate-400 p-6">
                <p className="text-sm animate-pulse">Converting...</p>
            </div>
        );
    };

    const isSplit = viewMode === 'split';

    return (
        <div
            className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-lg overflow-hidden"
            data-testid="preview-root"
        >
            {/* View Mode Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                <div className="flex items-center gap-1.5">
                    {(['split', 'source', 'output'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                                viewMode === mode
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'
                            } ${mode === 'split' ? 'flex items-center gap-1' : ''}`}
                        >
                            {mode === 'split' && <Columns className="w-3 h-3" />}
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setFullscreenPanel(viewMode === 'source' ? 'source' : 'output')}
                    className="p-1.5 rounded hover:bg-white/80 dark:hover:bg-slate-700"
                    title="Fullscreen"
                >
                    <Maximize2 className="w-4 h-4 text-slate-500" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 flex">
                {(isSplit || viewMode === 'source') && (
                    <div
                        className={`flex flex-col ${isSplit ? 'w-1/2 border-r border-slate-200 dark:border-slate-700' : 'w-full'}`}
                        data-testid="preview-source-panel"
                    >
                        <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50">
                            Source • {format}
                        </div>
                        <div className="flex-1 min-h-0" data-testid="preview-source-canvas">
                            <DiagramViewer content={renderSourceContent()} svgContent={sourceSvg} />
                        </div>
                    </div>
                )}
                {(isSplit || viewMode === 'output') && (
                    <div
                        className={`flex flex-col ${isSplit ? 'w-1/2' : 'w-full'}`}
                        data-testid="preview-output-panel"
                    >
                        <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50">
                            Output • {outputFormat}
                        </div>
                        <div className="flex-1 min-h-0" data-testid="preview-output-canvas">
                            <DiagramViewer content={renderOutputContent()} svgContent={outputSvg} />
                        </div>
                    </div>
                )}
            </div>

            {/* Fullscreen Modal */}
            <FullscreenModal
                isOpen={fullscreenPanel !== null}
                onClose={() => setFullscreenPanel(null)}
                title={
                    fullscreenPanel === 'source' ? `Source (${format})` : `Output (${outputFormat})`
                }
            >
                <DiagramViewer
                    content={
                        fullscreenPanel === 'source' ? renderSourceContent() : renderOutputContent()
                    }
                    svgContent={fullscreenPanel === 'source' ? sourceSvg : outputSvg}
                    className="h-full"
                />
            </FullscreenModal>
        </div>
    );
}

function renderViaIR(source: string, format: InputFormat): string {
    const parser = getParser(format);
    if (!parser) {
        throw new Error(`Preview is not supported for format: ${format}`);
    }

    const diagram = parser(source);
    return renderDiagramToSvg(diagram);
}

function getParser(format: InputFormat): ((source: string) => Diagram) | null {
    switch (format) {
        case 'mermaid':
            return parseMermaid;
        case 'drawio':
            return parseDrawio;
        case 'excalidraw':
            return parseExcalidraw;
        case 'plantuml':
            return parsePlantUML;
        case 'dot':
            return parseDot;
        case 'd2':
            return parseD2;
        case 'structurizr':
            return parseStructurizr;
        case 'bpmn':
            return parseBpmn;
        case 'graphml':
            return parseGraphml;
        case 'lucidchart':
            return parseLucidchart;
        default:
            return null;
    }
}

function renderDiagramToSvg(diagram: Diagram): string {
    const padding = 40;
    const defaultNodeWidth = 140;
    const defaultNodeHeight = 64;

    const positions = new Map<
        string,
        { x: number; y: number; width: number; height: number; label: string; shape: string }
    >();

    diagram.nodes.forEach((node, index) => {
        const col = index % 4;
        const row = Math.floor(index / 4);
        const width = node.size?.width ?? defaultNodeWidth;
        const height = node.size?.height ?? defaultNodeHeight;
        const x = node.position?.x ?? 60 + col * 200;
        const y = node.position?.y ?? 60 + row * 120;

        positions.set(node.id, {
            x,
            y,
            width,
            height,
            label: node.label || node.id,
            shape: node.shape,
        });
    });

    const allNodes = [...positions.values()];
    const minX = allNodes.length ? Math.min(...allNodes.map(n => n.x)) : 0;
    const minY = allNodes.length ? Math.min(...allNodes.map(n => n.y)) : 0;
    const maxX = allNodes.length ? Math.max(...allNodes.map(n => n.x + n.width)) : 400;
    const maxY = allNodes.length ? Math.max(...allNodes.map(n => n.y + n.height)) : 240;
    const viewWidth = Math.max(maxX - minX + padding * 2, 360);
    const viewHeight = Math.max(maxY - minY + padding * 2, 220);
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    let svg = `<svg viewBox="0 0 ${viewWidth} ${viewHeight}" width="${viewWidth}" height="${viewHeight}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs>
        <filter id="irshadow"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.12"/></filter>
        <marker id="irarrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#64748b"/></marker>
    </defs>`;

    // edges first
    for (const edge of diagram.edges) {
        const src = positions.get(edge.source);
        const tgt = positions.get(edge.target);
        if (!src || !tgt) continue;

        const sx = src.x + offsetX + src.width;
        const sy = src.y + offsetY + src.height / 2;
        const tx = tgt.x + offsetX;
        const ty = tgt.y + offsetY + tgt.height / 2;
        const mx = (sx + tx) / 2;

        svg += `<path d="M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#irarrow)"/>`;

        if (edge.label) {
            svg += `<text x="${mx}" y="${(sy + ty) / 2 - 8}" text-anchor="middle" fill="#64748b" font-size="10" font-family="system-ui">${escapeHtml(edge.label)}</text>`;
        }
    }

    for (const node of positions.values()) {
        const x = node.x + offsetX;
        const y = node.y + offsetY;
        const { width: w, height: h, label, shape } = node;

        if (shape === 'ellipse' || shape === 'circle') {
            svg += `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="#dbeafe" stroke="#3b82f6" stroke-width="2" filter="url(#irshadow)"/>`;
        } else if (shape === 'diamond') {
            svg += `<polygon points="${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}" fill="#fef3c7" stroke="#f59e0b" stroke-width="2" filter="url(#irshadow)"/>`;
        } else if (shape === 'actor') {
            svg += `<circle cx="${x + w / 2}" cy="${y + 16}" r="12" fill="#dbeafe" stroke="#3b82f6" stroke-width="2"/>`;
            svg += `<path d="M ${x + w / 2 - 18} ${y + h - 10} Q ${x + w / 2} ${y + 36} ${x + w / 2 + 18} ${y + h - 10}" fill="#dbeafe" stroke="#3b82f6" stroke-width="2"/>`;
        } else {
            svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#e0e7ff" stroke="#6366f1" stroke-width="2" filter="url(#irshadow)"/>`;
        }

        svg += `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="central" fill="#1e293b" font-size="12" font-family="system-ui">${escapeHtml(label)}</text>`;
    }

    return svg + '</svg>';
}

// =============================================================================
// SVG Renderers
// =============================================================================

interface ExcalidrawEl {
    id: string;
    type: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    points?: number[][];
    backgroundColor?: string;
    strokeColor?: string;
    text?: string;
    containerId?: string | null;
    fontSize?: number;
}

function renderExcalidrawSvg(elements: ExcalidrawEl[]): string {
    const elementMap = new Map<string, ExcalidrawEl>();
    elements.forEach(el => elementMap.set(el.id, el));

    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
    elements.forEach(el => {
        if (el.type === 'text' && el.containerId) return;
        if (el.x !== undefined && el.y !== undefined) {
            const w = el.width || 100;
            const h = el.height || 60;
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + w);
            maxY = Math.max(maxY, el.y + h);
            if (el.type === 'arrow' && el.points) {
                el.points.forEach(p => {
                    maxX = Math.max(maxX, el.x + p[0]);
                    maxY = Math.max(maxY, el.y + p[1]);
                    minX = Math.min(minX, el.x + p[0]);
                    minY = Math.min(minY, el.y + p[1]);
                });
            }
        }
    });

    if (!isFinite(minX)) {
        minX = 0;
        minY = 0;
        maxX = 400;
        maxY = 300;
    }

    const padding = 40;
    const viewWidth = Math.max(maxX - minX + padding * 2, 300);
    const viewHeight = Math.max(maxY - minY + padding * 2, 200);
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    let svg = `<svg viewBox="0 0 ${viewWidth} ${viewHeight}" width="${viewWidth}" height="${viewHeight}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs>
        <filter id="shadow"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.1"/></filter>
        <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#475569"/></marker>
    </defs>`;

    const findText = (id: string) =>
        elements.find(el => el.type === 'text' && el.containerId === id)?.text || null;

    // Shapes
    elements.forEach(el => {
        if (['text', 'arrow', 'line'].includes(el.type)) return;
        const x = el.x + offsetX,
            y = el.y + offsetY;
        const w = el.width || 100,
            h = el.height || 60;
        const label = findText(el.id);
        const fill =
            el.backgroundColor && el.backgroundColor !== 'transparent'
                ? el.backgroundColor
                : el.type === 'ellipse'
                  ? '#d1fae5'
                  : el.type === 'diamond'
                    ? '#fef3c7'
                    : '#e0e7ff';
        const stroke =
            el.strokeColor ||
            (el.type === 'ellipse' ? '#10b981' : el.type === 'diamond' ? '#f59e0b' : '#6366f1');

        if (el.type === 'rectangle')
            svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="2" rx="6" filter="url(#shadow)"/>`;
        else if (el.type === 'ellipse')
            svg += `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2" filter="url(#shadow)"/>`;
        else if (el.type === 'diamond')
            svg += `<polygon points="${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2" filter="url(#shadow)"/>`;

        if (label)
            svg += `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="central" fill="#1e293b" font-size="13" font-family="system-ui">${label.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c] || c)}</text>`;
    });

    // Arrows
    elements.forEach(el => {
        if (el.type !== 'arrow' && el.type !== 'line') return;
        const x = el.x + offsetX,
            y = el.y + offsetY;
        const pts = el.points || [
            [0, 0],
            [100, 0],
        ];
        if (pts.length < 2) return;
        svg += `<line x1="${x + pts[0][0]}" y1="${y + pts[0][1]}" x2="${x + pts[pts.length - 1][0]}" y2="${y + pts[pts.length - 1][1]}" stroke="${el.strokeColor || '#64748b'}" stroke-width="2" marker-end="url(#arrow)"/>`;
    });

    // Standalone text
    elements.forEach(el => {
        if (el.type !== 'text' || el.containerId) return;
        if (el.text)
            svg += `<text x="${el.x + offsetX}" y="${el.y + offsetY}" fill="#1e293b" font-size="${el.fontSize || 14}" font-family="system-ui">${el.text.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c] || c)}</text>`;
    });

    return svg + '</svg>';
}

interface DrawioNode {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    style: string;
}

function renderDrawioSvg(xmlString: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const cells = doc.querySelectorAll('mxCell[vertex="1"], mxCell[edge="1"]');
    if (cells.length === 0) throw new Error('No cells');

    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
    const nodeMap = new Map<string, DrawioNode>();

    cells.forEach(cell => {
        const geo = cell.querySelector('mxGeometry');
        if (geo && cell.getAttribute('vertex') === '1') {
            const x = parseFloat(geo.getAttribute('x') || '0');
            const y = parseFloat(geo.getAttribute('y') || '0');
            const w = parseFloat(geo.getAttribute('width') || '120');
            const h = parseFloat(geo.getAttribute('height') || '60');
            if (!isNaN(x) && !isNaN(y)) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x + w);
                maxY = Math.max(maxY, y + h);
                nodeMap.set(cell.getAttribute('id') || '', {
                    x,
                    y,
                    width: w,
                    height: h,
                    label: cell.getAttribute('value') || '',
                    style: cell.getAttribute('style') || '',
                });
            }
        }
    });

    const padding = 40;
    const viewWidth = Math.max(maxX - minX + padding * 2, 300);
    const viewHeight = Math.max(maxY - minY + padding * 2, 200);
    const offsetX = -minX + padding,
        offsetY = -minY + padding;

    let svg = `<svg viewBox="0 0 ${viewWidth} ${viewHeight}" width="${viewWidth}" height="${viewHeight}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs><filter id="ds"><feDropShadow dx="1" dy="2" stdDeviation="3" flood-opacity="0.1"/></filter><marker id="da" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#6366f1"/></marker></defs>`;

    // Edges
    cells.forEach(cell => {
        if (cell.getAttribute('edge') !== '1') return;
        const src = nodeMap.get(cell.getAttribute('source') || '');
        const tgt = nodeMap.get(cell.getAttribute('target') || '');
        if (!src || !tgt) return;
        const sx = src.x + offsetX + src.width,
            sy = src.y + offsetY + src.height / 2;
        const tx = tgt.x + offsetX,
            ty = tgt.y + offsetY + tgt.height / 2;
        const mx = (sx + tx) / 2;
        svg += `<path d="M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#da)"/>`;
        const label = cell.getAttribute('value');
        if (label)
            svg += `<text x="${mx}" y="${(sy + ty) / 2 - 8}" text-anchor="middle" fill="#64748b" font-size="10" font-family="system-ui">${label}</text>`;
    });

    // Nodes
    nodeMap.forEach(node => {
        const x = node.x + offsetX,
            y = node.y + offsetY;
        const { width: w, height: h, label, style } = node;
        const isRhombus = style.includes('rhombus'),
            isEllipse = style.includes('ellipse'),
            isRounded = style.includes('rounded=1');
        let fill = '#e0e7ff',
            stroke = '#6366f1';
        if (isRhombus) {
            fill = '#fef3c7';
            stroke = '#f59e0b';
        } else if (isEllipse) {
            fill = '#d1fae5';
            stroke = '#10b981';
        }

        if (isRhombus)
            svg += `<polygon points="${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2" filter="url(#ds)"/>`;
        else if (isEllipse)
            svg += `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2" filter="url(#ds)"/>`;
        else
            svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="2" rx="${isRounded ? 8 : 4}" filter="url(#ds)"/>`;

        if (label)
            svg += `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="central" fill="#1e293b" font-size="12" font-family="system-ui">${label}</text>`;
    });

    return svg + '</svg>';
}

// PlantUML rendering via public API
async function renderPlantUmlSvg(code: string): Promise<string> {
    // Encode PlantUML code for URL
    const encoded = plantumlEncode(code);
    const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('PlantUML render failed');
    return await response.text();
}

// PlantUML encoding (deflate + base64)
function plantumlEncode(text: string): string {
    // Simple encoding for PlantUML server
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // Use pako for deflate if available, otherwise use simple base64
    // For now, use the ~h hex encoding which is simpler
    const hex = Array.from(data)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return '~h' + hex;
}

// DOT/Graphviz rendering via viz.js
async function renderDotSvg(code: string): Promise<string> {
    // Dynamic import of viz.js
    const { instance } = await import('@viz-js/viz');
    const viz = await instance();
    return viz.renderString(code, { format: 'svg', engine: 'dot' });
}

// Kroki API for D2, Structurizr, BPMN rendering
// Kroki requires: deflate -> base64url encoding
async function renderViaKroki(code: string, format: string): Promise<string> {
    // Encode text to UTF-8 bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(code);

    // Deflate compress
    const compressed = pako.deflate(data, { level: 9 });

    // Convert to base64url (URL-safe base64)
    const base64 = btoa(String.fromCharCode(...compressed));
    const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const url = `https://kroki.io/${format}/svg/${base64url}`;

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Kroki render failed: ${response.status} - ${text.slice(0, 100)}`);
        }
        return await response.text();
    } catch (err) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === 'AbortError') {
            throw new Error('Kroki request timed out');
        }
        throw err;
    }
}

// GraphML simple SVG renderer (since Kroki doesn't support GraphML)
function renderGraphmlSvg(xmlString: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');

    interface GraphNode {
        id: string;
        label: string;
        x: number;
        y: number;
        width: number;
        height: number;
    }

    interface GraphEdge {
        source: string;
        target: string;
        label?: string;
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Parse nodes
    const nodeElements = doc.querySelectorAll('node');
    let idx = 0;
    nodeElements.forEach(node => {
        const id = node.getAttribute('id') || `n${idx}`;
        // Try to get label from data element or NodeLabel
        let label = id;
        const labelEl = node.querySelector('NodeLabel, data[key="label"], data[key="d2"]');
        if (labelEl?.textContent) label = labelEl.textContent.trim();

        // Simple grid layout
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        nodes.push({
            id,
            label,
            x: 50 + col * 180,
            y: 50 + row * 100,
            width: 140,
            height: 60,
        });
        idx++;
    });

    // Parse edges
    const edgeElements = doc.querySelectorAll('edge');
    edgeElements.forEach(edge => {
        const source = edge.getAttribute('source') || '';
        const target = edge.getAttribute('target') || '';
        const labelEl = edge.querySelector('EdgeLabel, data[key="label"], data[key="d3"]');
        edges.push({
            source,
            target,
            label: labelEl?.textContent?.trim(),
        });
    });

    // Calculate bounds
    const padding = 40;
    const maxX = Math.max(...nodes.map(n => n.x + n.width), 400);
    const maxY = Math.max(...nodes.map(n => n.y + n.height), 200);
    const viewWidth = maxX + padding;
    const viewHeight = maxY + padding;

    // Build SVG
    let svg = `<svg viewBox="0 0 ${viewWidth} ${viewHeight}" width="${viewWidth}" height="${viewHeight}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs>
        <filter id="gshadow"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.1"/></filter>
        <marker id="garrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1"/>
        </marker>
    </defs>`;

    // Create node map for edge drawing
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Draw edges
    edges.forEach(edge => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return;

        const sx = src.x + src.width;
        const sy = src.y + src.height / 2;
        const tx = tgt.x;
        const ty = tgt.y + tgt.height / 2;
        const mx = (sx + tx) / 2;

        svg += `<path d="M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#garrow)"/>`;

        if (edge.label) {
            svg += `<text x="${mx}" y="${(sy + ty) / 2 - 8}" text-anchor="middle" fill="#64748b" font-size="10" font-family="system-ui">${escapeHtml(edge.label)}</text>`;
        }
    });

    // Draw nodes
    nodes.forEach(node => {
        const { x, y, width: w, height: h, label } = node;
        svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e0e7ff" stroke="#6366f1" stroke-width="2" rx="6" filter="url(#gshadow)"/>`;
        svg += `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="central" fill="#1e293b" font-size="12" font-family="system-ui">${escapeHtml(label)}</text>`;
    });

    return svg + '</svg>';
}

function escapeHtml(str: string): string {
    return str.replace(
        /[<>&"']/g,
        c =>
            ({
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;',
                '"': '&quot;',
                "'": '&#39;',
            })[c] || c
    );
}

// Lucidchart JSON simple SVG renderer
function renderLucidchartSvg(jsonString: string): string {
    interface LucidNode {
        id: string;
        text?: string;
        boundingBox?: { x: number; y: number; w: number; h: number };
        class?: string;
    }
    interface LucidLine {
        id: string;
        endpoint1?: { connectedShapeId?: string };
        endpoint2?: { connectedShapeId?: string };
        text?: string;
    }
    interface LucidData {
        shapes?: LucidNode[];
        lines?: LucidLine[];
    }

    let data: LucidData;
    try {
        data = JSON.parse(jsonString);
    } catch {
        throw new Error('Invalid Lucidchart JSON');
    }

    const shapes = data.shapes || [];
    const lines = data.lines || [];

    interface NodeInfo {
        id: string;
        label: string;
        x: number;
        y: number;
        width: number;
        height: number;
    }

    const nodes: NodeInfo[] = [];
    let idx = 0;

    shapes.forEach(shape => {
        const bb = shape.boundingBox;
        const x = bb?.x ?? 50 + (idx % 4) * 180;
        const y = bb?.y ?? 50 + Math.floor(idx / 4) * 100;
        const w = bb?.w ?? 140;
        const h = bb?.h ?? 60;

        nodes.push({
            id: shape.id,
            label: shape.text || shape.id,
            x,
            y,
            width: w,
            height: h,
        });
        idx++;
    });

    // Calculate bounds
    const padding = 40;
    const maxX = Math.max(...nodes.map(n => n.x + n.width), 400);
    const maxY = Math.max(...nodes.map(n => n.y + n.height), 200);
    const viewWidth = maxX + padding;
    const viewHeight = maxY + padding;

    let svg = `<svg viewBox="0 0 ${viewWidth} ${viewHeight}" width="${viewWidth}" height="${viewHeight}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs>
        <filter id="lshadow"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.1"/></filter>
        <marker id="larrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1"/>
        </marker>
    </defs>`;

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Draw lines
    lines.forEach(line => {
        const srcId = line.endpoint1?.connectedShapeId;
        const tgtId = line.endpoint2?.connectedShapeId;
        if (!srcId || !tgtId) return;

        const src = nodeMap.get(srcId);
        const tgt = nodeMap.get(tgtId);
        if (!src || !tgt) return;

        const sx = src.x + src.width;
        const sy = src.y + src.height / 2;
        const tx = tgt.x;
        const ty = tgt.y + tgt.height / 2;
        const mx = (sx + tx) / 2;

        svg += `<path d="M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#larrow)"/>`;

        if (line.text) {
            svg += `<text x="${mx}" y="${(sy + ty) / 2 - 8}" text-anchor="middle" fill="#64748b" font-size="10" font-family="system-ui">${escapeHtml(line.text)}</text>`;
        }
    });

    // Draw nodes
    nodes.forEach(node => {
        const { x, y, width: w, height: h, label } = node;
        svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fef3c7" stroke="#f59e0b" stroke-width="2" rx="6" filter="url(#lshadow)"/>`;
        svg += `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="central" fill="#1e293b" font-size="12" font-family="system-ui">${escapeHtml(label)}</text>`;
    });

    return svg + '</svg>';
}

// D2 simple SVG renderer (fallback when Kroki fails)
function renderD2Svg(code: string): string {
    interface D2Node {
        id: string;
        label: string;
        x: number;
        y: number;
        width: number;
        height: number;
        shape?: string;
    }
    interface D2Edge {
        source: string;
        target: string;
        label?: string;
    }

    const nodes: D2Node[] = [];
    const edges: D2Edge[] = [];
    const nodeMap = new Map<string, D2Node>();

    // Parse D2 code - simple line-by-line parsing
    const lines = code.split('\n');
    let nodeIdx = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        // Edge pattern: A -> B or A -- B or A <-> B
        const edgeMatch = trimmed.match(
            /^([a-zA-Z0-9_]+)\s*(->|--|<->|<-)\s*([a-zA-Z0-9_]+)(?:\s*:\s*(.+))?$/
        );
        if (edgeMatch) {
            const [, src, , tgt, label] = edgeMatch;

            // Ensure nodes exist
            if (!nodeMap.has(src)) {
                const col = nodeIdx % 4;
                const row = Math.floor(nodeIdx / 4);
                const node: D2Node = {
                    id: src,
                    label: src,
                    x: 50 + col * 180,
                    y: 50 + row * 100,
                    width: 140,
                    height: 60,
                };
                nodes.push(node);
                nodeMap.set(src, node);
                nodeIdx++;
            }
            if (!nodeMap.has(tgt)) {
                const col = nodeIdx % 4;
                const row = Math.floor(nodeIdx / 4);
                const node: D2Node = {
                    id: tgt,
                    label: tgt,
                    x: 50 + col * 180,
                    y: 50 + row * 100,
                    width: 140,
                    height: 60,
                };
                nodes.push(node);
                nodeMap.set(tgt, node);
                nodeIdx++;
            }

            edges.push({ source: src, target: tgt, label: label?.trim() });
            continue;
        }

        // Node definition: A: "Label" or A.shape: oval
        const nodeMatch = trimmed.match(/^([a-zA-Z0-9_]+)(?:\.shape)?\s*:\s*(.+)$/);
        if (nodeMatch) {
            const [, id, value] = nodeMatch;
            if (!nodeMap.has(id)) {
                const col = nodeIdx % 4;
                const row = Math.floor(nodeIdx / 4);
                const label = value.replace(/^["']|["']$/g, '');
                const node: D2Node = {
                    id,
                    label,
                    x: 50 + col * 180,
                    y: 50 + row * 100,
                    width: 140,
                    height: 60,
                };
                nodes.push(node);
                nodeMap.set(id, node);
                nodeIdx++;
            } else {
                const node = nodeMap.get(id)!;
                if (trimmed.includes('.shape')) {
                    node.shape = value;
                } else {
                    node.label = value.replace(/^["']|["']$/g, '');
                }
            }
            continue;
        }

        // Simple node: just an identifier
        const simpleMatch = trimmed.match(/^([a-zA-Z0-9_]+)$/);
        if (simpleMatch && !nodeMap.has(simpleMatch[1])) {
            const id = simpleMatch[1];
            const col = nodeIdx % 4;
            const row = Math.floor(nodeIdx / 4);
            const node: D2Node = {
                id,
                label: id,
                x: 50 + col * 180,
                y: 50 + row * 100,
                width: 140,
                height: 60,
            };
            nodes.push(node);
            nodeMap.set(id, node);
            nodeIdx++;
        }
    }

    // Calculate bounds
    const padding = 40;
    const maxX = Math.max(...nodes.map(n => n.x + n.width), 400);
    const maxY = Math.max(...nodes.map(n => n.y + n.height), 200);
    const viewWidth = maxX + padding;
    const viewHeight = maxY + padding;

    let svg = `<svg viewBox="0 0 ${viewWidth} ${viewHeight}" width="${viewWidth}" height="${viewHeight}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs>
        <filter id="d2shadow"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.1"/></filter>
        <marker id="d2arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#0ea5e9"/>
        </marker>
    </defs>`;

    // Draw edges
    edges.forEach(edge => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return;

        const sx = src.x + src.width;
        const sy = src.y + src.height / 2;
        const tx = tgt.x;
        const ty = tgt.y + tgt.height / 2;
        const mx = (sx + tx) / 2;

        svg += `<path d="M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}" fill="none" stroke="#0ea5e9" stroke-width="2" marker-end="url(#d2arrow)"/>`;

        if (edge.label) {
            svg += `<text x="${mx}" y="${(sy + ty) / 2 - 8}" text-anchor="middle" fill="#64748b" font-size="10" font-family="system-ui">${escapeHtml(edge.label)}</text>`;
        }
    });

    // Draw nodes
    nodes.forEach(node => {
        const { x, y, width: w, height: h, label, shape } = node;

        if (shape === 'oval' || shape === 'circle') {
            svg += `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="#e0f2fe" stroke="#0ea5e9" stroke-width="2" filter="url(#d2shadow)"/>`;
        } else if (shape === 'diamond') {
            svg += `<polygon points="${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}" fill="#fef3c7" stroke="#f59e0b" stroke-width="2" filter="url(#d2shadow)"/>`;
        } else {
            svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#e0f2fe" stroke="#0ea5e9" stroke-width="2" rx="6" filter="url(#d2shadow)"/>`;
        }

        svg += `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="central" fill="#0c4a6e" font-size="12" font-family="system-ui">${escapeHtml(label)}</text>`;
    });

    return svg + '</svg>';
}

// Structurizr DSL simple SVG renderer (fallback when Kroki fails)
function renderStructurizrSvg(code: string): string {
    interface StructNode {
        id: string;
        label: string;
        description?: string;
        x: number;
        y: number;
        width: number;
        height: number;
        type: 'person' | 'softwaresystem' | 'container' | 'component';
    }
    interface StructEdge {
        source: string;
        target: string;
        label?: string;
    }

    const nodes: StructNode[] = [];
    const edges: StructEdge[] = [];
    const nodeMap = new Map<string, StructNode>();

    // Parse Structurizr DSL
    const lines = code.split('\n');
    let nodeIdx = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

        // Person/SoftwareSystem/Container/Component definition
        const elementMatch = trimmed.match(
            /^(person|softwareSystem|container|component)\s+([a-zA-Z0-9_]+)\s*=?\s*"([^"]+)"(?:\s+"([^"]+)")?/i
        );
        if (elementMatch) {
            const [, type, id, label, desc] = elementMatch;
            const col = nodeIdx % 3;
            const row = Math.floor(nodeIdx / 3);
            const node: StructNode = {
                id,
                label,
                description: desc,
                x: 50 + col * 200,
                y: 50 + row * 120,
                width: 160,
                height: 80,
                type: type.toLowerCase() as StructNode['type'],
            };
            nodes.push(node);
            nodeMap.set(id, node);
            nodeIdx++;
            continue;
        }

        // Relationship: source -> target "label"
        const relMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*->\s*([a-zA-Z0-9_]+)(?:\s+"([^"]+)")?/);
        if (relMatch) {
            const [, src, tgt, label] = relMatch;
            edges.push({ source: src, target: tgt, label });
        }
    }

    // Calculate bounds
    const padding = 40;
    const maxX = Math.max(...nodes.map(n => n.x + n.width), 400);
    const maxY = Math.max(...nodes.map(n => n.y + n.height), 200);
    const viewWidth = maxX + padding;
    const viewHeight = maxY + padding;

    let svg = `<svg viewBox="0 0 ${viewWidth} ${viewHeight}" width="${viewWidth}" height="${viewHeight}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs>
        <filter id="sshadow"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.1"/></filter>
        <marker id="sarrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b"/>
        </marker>
    </defs>`;

    // Draw edges
    edges.forEach(edge => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return;

        const sx = src.x + src.width;
        const sy = src.y + src.height / 2;
        const tx = tgt.x;
        const ty = tgt.y + tgt.height / 2;
        const mx = (sx + tx) / 2;

        svg += `<path d="M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="5,3" marker-end="url(#sarrow)"/>`;

        if (edge.label) {
            svg += `<text x="${mx}" y="${(sy + ty) / 2 - 8}" text-anchor="middle" fill="#64748b" font-size="10" font-family="system-ui">${escapeHtml(edge.label)}</text>`;
        }
    });

    // Draw nodes with type-specific styling
    nodes.forEach(node => {
        const { x, y, width: w, height: h, label, description, type } = node;

        let fill = '#e0e7ff';
        let stroke = '#6366f1';

        if (type === 'person') {
            fill = '#dbeafe';
            stroke = '#3b82f6';
            // Draw person icon (circle head + body)
            svg += `<circle cx="${x + w / 2}" cy="${y + 15}" r="12" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
            svg += `<path d="M ${x + w / 2 - 20} ${y + h - 10} Q ${x + w / 2} ${y + 35} ${x + w / 2 + 20} ${y + h - 10}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
        } else if (type === 'softwaresystem') {
            fill = '#dbeafe';
            stroke = '#2563eb';
            svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="2" rx="4" filter="url(#sshadow)"/>`;
        } else if (type === 'container') {
            fill = '#e0f2fe';
            stroke = '#0284c7';
            svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="2" rx="4" filter="url(#sshadow)"/>`;
        } else {
            fill = '#f0f9ff';
            stroke = '#0ea5e9';
            svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="2" rx="4" filter="url(#sshadow)"/>`;
        }

        // Label
        const labelY = type === 'person' ? y + h - 25 : y + h / 2 - (description ? 8 : 0);
        svg += `<text x="${x + w / 2}" y="${labelY}" text-anchor="middle" dominant-baseline="central" fill="#1e3a5f" font-size="12" font-weight="600" font-family="system-ui">${escapeHtml(label)}</text>`;

        // Description
        if (description && type !== 'person') {
            svg += `<text x="${x + w / 2}" y="${y + h / 2 + 12}" text-anchor="middle" dominant-baseline="central" fill="#64748b" font-size="9" font-family="system-ui">${escapeHtml(description.slice(0, 25))}</text>`;
        }
    });

    return svg + '</svg>';
}
