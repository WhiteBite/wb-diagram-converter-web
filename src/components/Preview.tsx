import { useEffect, useState, useRef, useCallback } from 'react';
import {
    Maximize2, ZoomIn, ZoomOut, RotateCcw, Crosshair,
    Columns, Grid3X3, Image
} from 'lucide-react';
import { FullscreenModal } from './FullscreenModal';

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
    onExportPng?: () => void;
}

// Improved DiagramViewer with grid, fit-to-view, better controls
function DiagramViewer({ content, svgContent, className = '', showGrid = true }: DiagramViewerProps) {
    const [state, setState] = useState<ZoomPanState>({ zoom: 1, pan: { x: 0, y: 0 } });
    const [isPanning, setIsPanning] = useState(false);
    const [gridEnabled, setGridEnabled] = useState(showGrid);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const lastPanPos = useRef({ x: 0, y: 0 });

    const handleZoomIn = () => setState(s => ({ ...s, zoom: Math.min(s.zoom * 1.25, 5) }));
    const handleZoomOut = () => setState(s => ({ ...s, zoom: Math.max(s.zoom / 1.25, 0.1) }));
    const handleReset = () => setState({ zoom: 1, pan: { x: 0, y: 0 } });

    // Fit content to container
    const handleFitToView = useCallback(() => {
        if (!containerRef.current || !contentRef.current) return;

        const container = containerRef.current.getBoundingClientRect();
        const contentEl = contentRef.current.querySelector('svg, div');
        if (!contentEl) return;

        const content = contentEl.getBoundingClientRect();
        if (content.width === 0 || content.height === 0) return;

        const scaleX = (container.width - 40) / content.width;
        const scaleY = (container.height - 40) / content.height;
        const scale = Math.min(scaleX, scaleY, 2);

        setState({ zoom: scale, pan: { x: 0, y: 0 } });
    }, []);

    // Auto fit on first render
    useEffect(() => {
        const timer = setTimeout(handleFitToView, 100);
        return () => clearTimeout(timer);
    }, [content, handleFitToView]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();

        // Shift+Scroll = pan horizontally, Ctrl+Scroll or regular scroll = zoom
        if (e.shiftKey) {
            // Pan horizontally with Shift+Scroll
            setState(s => ({
                ...s,
                pan: { x: s.pan.x - e.deltaY, y: s.pan.y }
            }));
        } else {
            // Zoom by default (no modifier needed)
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setState(s => ({ ...s, zoom: Math.max(0.1, Math.min(5, s.zoom * delta)) }));
        }
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && (e.altKey || e.shiftKey))) {
            e.preventDefault();
            setIsPanning(true);
            lastPanPos.current = { x: e.clientX, y: e.clientY };
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isPanning) return;
        const dx = e.clientX - lastPanPos.current.x;
        const dy = e.clientY - lastPanPos.current.y;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        setState(s => ({ ...s, pan: { x: s.pan.x + dx, y: s.pan.y + dy } }));
    }, [isPanning]);

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
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleZoomOut}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-mono min-w-[3rem] text-center">
                        {Math.round(state.zoom * 100)}%
                    </span>
                    <button
                        onClick={handleZoomIn}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleFitToView}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Fit to View"
                    >
                        <Crosshair className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Reset View"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setGridEnabled(!gridEnabled)}
                        className={`p-1.5 rounded transition-colors ${gridEnabled ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                        title="Toggle Grid"
                    >
                        <Grid3X3 className="w-4 h-4" />
                    </button>
                    {svgContent && (
                        <button
                            onClick={handleExportPng}
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Export as PNG"
                        >
                            <Image className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                className={`flex-1 overflow-hidden relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    background: gridEnabled
                        ? `
                            linear-gradient(to right, rgba(148, 163, 184, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
                        `
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
                        transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                    }}
                >
                    {content}
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

    // Render Mermaid source preview
    useEffect(() => {
        if (format !== 'mermaid') return;

        const renderMermaid = async () => {
            try {
                const mermaid = await import('mermaid');
                mermaid.default.initialize({
                    startOnLoad: false,
                    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
                    securityLevel: 'loose',
                });

                const id = `mermaid-source-${Date.now()}`;
                const { svg } = await mermaid.default.render(id, code);
                setSourceSvg(svg);
                setSourceError(null);
            } catch (err) {
                setSourceError(err instanceof Error ? err.message : 'Failed to render');
                setSourceSvg('');
            }
        };

        const timeout = setTimeout(renderMermaid, 300);
        return () => clearTimeout(timeout);
    }, [code, format]);

    // Render output preview
    useEffect(() => {
        if (!output) return;

        if (outputFormat === 'excalidraw') {
            try {
                const data = JSON.parse(output);
                const elements = data.elements || [];
                const svg = renderExcalidrawSvg(elements);
                setOutputSvg(svg);
                setOutputError(null);
            } catch {
                setOutputError('Failed to parse Excalidraw output');
                setOutputSvg('');
            }
        } else if (outputFormat === 'drawio') {
            try {
                const svg = renderDrawioSvg(output);
                setOutputSvg(svg);
                setOutputError(null);
            } catch {
                setOutputSvg('');
                setOutputError(null);
            }
        } else {
            setOutputSvg('');
            setOutputError(null);
        }
    }, [output, outputFormat]);

    const renderSourceContent = () => {
        if (sourceError) {
            return (
                <div className="text-red-500 text-sm p-6 bg-red-50 dark:bg-red-900/20 rounded-lg max-w-md">
                    <p className="font-medium mb-2">Render Error</p>
                    <p className="text-xs opacity-80">{sourceError}</p>
                </div>
            );
        }
        if (!sourceSvg) {
            return (
                <div className="text-slate-400 text-sm">
                    Enter valid {format} code to see preview
                </div>
            );
        }
        return <div dangerouslySetInnerHTML={{ __html: sourceSvg }} className="diagram-content" />;
    };

    const renderOutputContent = () => {
        if (outputError) {
            return (
                <div className="text-red-500 text-sm p-6 bg-red-50 dark:bg-red-900/20 rounded-lg max-w-md">
                    <p className="font-medium mb-2">Render Error</p>
                    <p className="text-xs opacity-80">{outputError}</p>
                </div>
            );
        }
        if (outputSvg) {
            return <div dangerouslySetInnerHTML={{ __html: outputSvg }} className="diagram-content" />;
        }
        return (
            <div className="text-center text-slate-400 p-8">
                <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Preview not available</p>
                <p className="text-sm mt-2 opacity-70">Download to view in {outputFormat}</p>
            </div>
        );
    };
    const isSplit = viewMode === 'split';


    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900">
            {/* View Mode Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-indigo-50 dark:bg-indigo-900/20">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('split')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${viewMode === 'split' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600'}`}
                    >
                        <Columns className="w-4 h-4" />
                        Split
                    </button>
                    <button
                        onClick={() => setViewMode('source')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'source' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600'}`}
                    >
                        Source
                    </button>
                    <button
                        onClick={() => setViewMode('output')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'output' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600'}`}
                    >
                        Output
                    </button>
                </div>
                <button
                    onClick={() => setFullscreenPanel(viewMode === 'source' ? 'source' : 'output')}
                    className="p-2 rounded-md hover:bg-white dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600"
                    title="Fullscreen"
                >
                    <Maximize2 className="w-4 h-4" />
                </button>
            </div>
            {/* Content */}
            <div className="flex-1 min-h-0 flex">
                {(isSplit || viewMode === 'source') && (
                    <div className={`flex flex-col ${isSplit ? 'w-1/2 border-r border-slate-200 dark:border-slate-700' : 'w-full'}`}>
                        <div className="px-2 py-1 text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
                            Source ({format.toUpperCase()})
                        </div>
                        <div className="flex-1 min-h-0">
                            <DiagramViewer content={renderSourceContent()} svgContent={sourceSvg} />
                        </div>
                    </div>
                )}
                {(isSplit || viewMode === 'output') && (
                    <div className={`flex flex-col ${isSplit ? 'w-1/2' : 'w-full'}`}>
                        <div className="px-2 py-1 text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
                            Output ({outputFormat.toUpperCase()})
                        </div>
                        <div className="flex-1 min-h-0">
                            <DiagramViewer content={renderOutputContent()} svgContent={outputSvg} />
                        </div>
                    </div>
                )}
            </div>

            {/* Fullscreen Modal */}
            <FullscreenModal
                isOpen={fullscreenPanel !== null}
                onClose={() => setFullscreenPanel(null)}
                title={fullscreenPanel === 'source' ? `Source (${format.toUpperCase()})` : `Output (${outputFormat.toUpperCase()})`}
            >
                <DiagramViewer
                    content={fullscreenPanel === 'source' ? renderSourceContent() : renderOutputContent()}
                    svgContent={fullscreenPanel === 'source' ? sourceSvg : outputSvg}
                    className="h-full"
                />
            </FullscreenModal>
        </div>
    );
}


// =============================================================================
// SVG Renderers
// =============================================================================

interface DrawioNode {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    style: string;
}

// Render Excalidraw elements to SVG with better styling
function renderExcalidrawSvg(elements: unknown[]): string {
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
        boundElements?: Array<{ id: string; type: string }>;
    }

    const typedElements = elements as ExcalidrawEl[];

    // Build element map for lookups
    const elementMap = new Map<string, ExcalidrawEl>();
    typedElements.forEach(el => elementMap.set(el.id, el));

    // Calculate bounds (exclude text elements that are bound to containers)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    typedElements.forEach(el => {
        // Skip text elements that are inside containers
        if (el.type === 'text' && el.containerId) return;

        if (el.x !== undefined && el.y !== undefined) {
            const w = el.width || 100;
            const h = el.height || 60;
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + w);
            maxY = Math.max(maxY, el.y + h);

            // For arrows, also consider end points
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

    // Handle empty or invalid bounds
    if (!isFinite(minX)) {
        minX = 0; minY = 0; maxX = 400; maxY = 300;
    }

    const padding = 60;
    const viewWidth = Math.max(maxX - minX + padding * 2, 400);
    const viewHeight = Math.max(maxY - minY + padding * 2, 300);
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    let svg = `<svg viewBox="0 0 ${viewWidth} ${viewHeight}" width="${viewWidth}" height="${viewHeight}" xmlns="http://www.w3.org/2000/svg">`;

    // Defs for shadows and markers
    svg += `<defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.15"/>
        </filter>
        <marker id="exc-arrow" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto">
            <polygon points="0 0, 12 4, 0 8" fill="#1e293b"/>
        </marker>
    </defs>`;

    // Helper to find text for a container element
    const findTextForContainer = (containerId: string): string | null => {
        const textEl = typedElements.find(el => el.type === 'text' && el.containerId === containerId);
        return textEl?.text || null;
    };

    // Render shapes first (rectangles, ellipses, diamonds)
    typedElements.forEach(el => {
        if (el.type === 'text' || el.type === 'arrow' || el.type === 'line') return;

        const x = el.x + offsetX;
        const y = el.y + offsetY;
        const w = el.width || 100;
        const h = el.height || 60;

        // Get text from bound text element
        const label = findTextForContainer(el.id);

        // Determine fill color - use provided or default based on type
        const fill = el.backgroundColor && el.backgroundColor !== 'transparent'
            ? el.backgroundColor
            : el.type === 'ellipse' ? '#d1fae5'
                : el.type === 'diamond' ? '#fef3c7'
                    : '#e0e7ff';

        const stroke = el.strokeColor ||
            (el.type === 'ellipse' ? '#10b981' : el.type === 'diamond' ? '#f59e0b' : '#6366f1');

        if (el.type === 'rectangle') {
            svg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" 
                fill="${fill}" stroke="${stroke}" stroke-width="2" rx="8" filter="url(#shadow)"/>`;
        } else if (el.type === 'ellipse') {
            svg += `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" 
                rx="${w / 2}" ry="${h / 2}"
                fill="${fill}" stroke="${stroke}" stroke-width="2" filter="url(#shadow)"/>`;
        } else if (el.type === 'diamond') {
            const cx = x + w / 2;
            const cy = y + h / 2;
            svg += `<polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}"
                fill="${fill}" stroke="${stroke}" stroke-width="2" filter="url(#shadow)"/>`;
        }

        // Render label text
        if (label) {
            const escapedLabel = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            svg += `<text x="${x + w / 2}" y="${y + h / 2}" 
                text-anchor="middle" dominant-baseline="central" 
                fill="#1e293b" font-size="14" font-family="system-ui, sans-serif" font-weight="500">${escapedLabel}</text>`;
        }
    });

    // Render arrows/lines
    typedElements.forEach(el => {
        if (el.type !== 'arrow' && el.type !== 'line') return;

        const x = el.x + offsetX;
        const y = el.y + offsetY;
        const points = el.points || [[0, 0], [100, 0]];

        if (points.length < 2) return;

        const startX = x + points[0][0];
        const startY = y + points[0][1];
        const endX = x + points[points.length - 1][0];
        const endY = y + points[points.length - 1][1];

        svg += `<line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" 
            stroke="${el.strokeColor || '#64748b'}" stroke-width="2" marker-end="url(#exc-arrow)"/>`;
    });

    // Render standalone text elements (not bound to containers)
    typedElements.forEach(el => {
        if (el.type !== 'text' || el.containerId) return;

        const x = el.x + offsetX;
        const y = el.y + offsetY;
        const text = el.text || '';
        const fontSize = el.fontSize || 16;

        if (text) {
            const escapedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            svg += `<text x="${x}" y="${y}" 
                fill="#1e293b" font-size="${fontSize}" font-family="system-ui, sans-serif">${escapedText}</text>`;
        }
    });

    svg += '</svg>';
    return svg;
}

// Render Draw.io XML to SVG with better styling
function renderDrawioSvg(xmlString: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const cells = doc.querySelectorAll('mxCell[vertex="1"], mxCell[edge="1"]');

    if (cells.length === 0) {
        throw new Error('No cells found');
    }

    // Calculate bounds and collect nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const nodeMap = new Map<string, DrawioNode>();

    cells.forEach(cell => {
        const geo = cell.querySelector('mxGeometry');
        if (geo && cell.getAttribute('vertex') === '1') {
            const x = parseFloat(geo.getAttribute('x') || '0');
            const y = parseFloat(geo.getAttribute('y') || '0');
            const width = parseFloat(geo.getAttribute('width') || '120');
            const height = parseFloat(geo.getAttribute('height') || '60');

            if (!isNaN(x) && !isNaN(y)) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x + width);
                maxY = Math.max(maxY, y + height);
                nodeMap.set(cell.getAttribute('id') || '', {
                    x, y, width, height,
                    label: cell.getAttribute('value') || '',
                    style: cell.getAttribute('style') || ''
                });
            }
        }
    });

    const padding = 60;
    const viewWidth = Math.max(maxX - minX + padding * 2, 400);
    const viewHeight = Math.max(maxY - minY + padding * 2, 300);
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    let svg = `<svg viewBox="0 0 ${viewWidth} ${viewHeight}" width="${viewWidth}" height="${viewHeight}" xmlns="http://www.w3.org/2000/svg">`;

    // Defs
    svg += `<defs>
        <filter id="drawio-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="3" stdDeviation="4" flood-opacity="0.12"/>
        </filter>
        <marker id="drawio-arrow" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto">
            <polygon points="0 0, 12 4, 0 8" fill="#6366f1"/>
        </marker>
    </defs>`;

    // Render edges first (behind nodes)
    cells.forEach(cell => {
        if (cell.getAttribute('edge') !== '1') return;

        const sourceId = cell.getAttribute('source');
        const targetId = cell.getAttribute('target');
        const label = cell.getAttribute('value') || '';

        if (!sourceId || !targetId) return;

        const source = nodeMap.get(sourceId);
        const target = nodeMap.get(targetId);

        if (!source || !target) return;

        // Calculate edge points (from right of source to left of target)
        const sx = source.x + offsetX + source.width;
        const sy = source.y + offsetY + source.height / 2;
        const tx = target.x + offsetX;
        const ty = target.y + offsetY + target.height / 2;

        // Draw curved path
        const midX = (sx + tx) / 2;
        svg += `<path d="M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}" 
            fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#drawio-arrow)"/>`;

        // Edge label
        if (label) {
            const mx = (sx + tx) / 2;
            const my = (sy + ty) / 2 - 12;
            svg += `<rect x="${mx - 20}" y="${my - 10}" width="40" height="20" fill="white" rx="4"/>`;
            svg += `<text x="${mx}" y="${my + 4}" text-anchor="middle" 
                fill="#64748b" font-size="11" font-family="system-ui, sans-serif">${label}</text>`;
        }
    });

    // Render nodes
    nodeMap.forEach((node) => {
        const x = node.x + offsetX;
        const y = node.y + offsetY;
        const { width, height, label, style } = node;

        const isRhombus = style.includes('rhombus');
        const isEllipse = style.includes('ellipse');
        const isRounded = style.includes('rounded=1');
        const isCylinder = style.includes('cylinder');

        // Color palette based on shape
        let fill = '#e0e7ff';
        let stroke = '#6366f1';
        let textColor = '#1e293b';

        if (isRhombus) {
            fill = '#fef3c7';
            stroke = '#f59e0b';
        } else if (isEllipse) {
            fill = '#d1fae5';
            stroke = '#10b981';
        } else if (isCylinder) {
            fill = '#e0f2fe';
            stroke = '#0ea5e9';
        }

        if (isRhombus) {
            const cx = x + width / 2;
            const cy = y + height / 2;
            svg += `<polygon points="${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}"
                fill="${fill}" stroke="${stroke}" stroke-width="2" filter="url(#drawio-shadow)"/>`;
        } else if (isEllipse) {
            svg += `<ellipse cx="${x + width / 2}" cy="${y + height / 2}" 
                rx="${width / 2}" ry="${height / 2}"
                fill="${fill}" stroke="${stroke}" stroke-width="2" filter="url(#drawio-shadow)"/>`;
        } else {
            const rx = isRounded ? 10 : 4;
            svg += `<rect x="${x}" y="${y}" width="${width}" height="${height}" 
                fill="${fill}" stroke="${stroke}" stroke-width="2" rx="${rx}" filter="url(#drawio-shadow)"/>`;
        }

        // Label
        if (label) {
            svg += `<text x="${x + width / 2}" y="${y + height / 2}" 
                text-anchor="middle" dominant-baseline="central" 
                fill="${textColor}" font-size="13" font-family="system-ui, sans-serif" font-weight="500">${label}</text>`;
        }
    });

    svg += '</svg>';
    return svg;
}
