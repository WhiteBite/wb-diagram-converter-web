import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, Move } from 'lucide-react';

interface ZoomablePreviewProps {
    children: ReactNode;
    title?: string;
    className?: string;
    onFullscreenChange?: (isFullscreen: boolean) => void;
}

export function ZoomablePreview({
    children,
    title,
    className = '',
    onFullscreenChange,
}: ZoomablePreviewProps) {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const lastPanPos = useRef({ x: 0, y: 0 });

    const handleZoomIn = useCallback(() => {
        setZoom(z => Math.min(z + 0.25, 3));
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(z => Math.max(z - 0.25, 0.25));
    }, []);

    const handleReset = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoom(z => Math.max(0.25, Math.min(3, z + delta)));
        }
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
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
        setPan(p => ({ x: p.x + dx, y: p.y + dy }));
    }, [isPanning]);

    const handleMouseUp = useCallback(() => {
        setIsPanning(false);
    }, []);

    const toggleFullscreen = useCallback(() => {
        const newState = !isFullscreen;
        setIsFullscreen(newState);
        onFullscreenChange?.(newState);
    }, [isFullscreen, onFullscreenChange]);

    // Handle Escape key to exit fullscreen
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
                onFullscreenChange?.(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen, onFullscreenChange]);

    const containerClass = isFullscreen
        ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900'
        : className;

    return (
        <div className={`flex flex-col ${containerClass}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0">
                <div className="flex items-center gap-2">
                    {title && (
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {title}
                        </span>
                    )}
                    <span className="text-xs text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                        {Math.round(zoom * 100)}%
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleZoomOut}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Zoom Out (Ctrl+Scroll)"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleZoomIn}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Zoom In (Ctrl+Scroll)"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Reset View"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                    <button
                        onClick={toggleFullscreen}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="w-4 h-4" />
                        ) : (
                            <Maximize2 className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div
                ref={containerRef}
                className={`flex-1 overflow-hidden relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    ref={contentRef}
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                    }}
                >
                    {children}
                </div>

                {/* Pan hint */}
                <div className="absolute bottom-2 left-2 text-xs text-slate-400 flex items-center gap-1 pointer-events-none">
                    <Move className="w-3 h-3" />
                    <span>Alt+Drag or Middle-click to pan</span>
                </div>
            </div>
        </div>
    );
}
