/**
 * Hook for drag & drop file upload
 */

import { useState, useCallback, DragEvent } from 'react';

interface UseFileDropzoneOptions {
    onFileDrop: (content: string, filename: string) => void;
    accept?: string[];
}

interface UseFileDropzoneResult {
    isDragging: boolean;
    handleDragOver: (e: DragEvent) => void;
    handleDragLeave: (e: DragEvent) => void;
    handleDrop: (e: DragEvent) => void;
}

const DEFAULT_ACCEPT = ['.md', '.mmd', '.puml', '.plantuml', '.dot', '.gv', '.drawio', '.excalidraw'];

export function useFileDropzone({
    onFileDrop,
    accept = DEFAULT_ACCEPT,
}: UseFileDropzoneOptions): UseFileDropzoneResult {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const file = files[0];

        if (!file) return;

        // Check extension
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!accept.includes(ext)) {
            console.warn(`File type ${ext} not accepted`);
            return;
        }

        try {
            const content = await file.text();
            onFileDrop(content, file.name);
        } catch (err) {
            console.error('Failed to read file:', err);
        }
    }, [onFileDrop, accept]);

    return {
        isDragging,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    };
}

/**
 * Detect format from filename
 */
export function detectFormatFromFilename(filename: string): string | null {
    const ext = filename.split('.').pop()?.toLowerCase();

    const formatMap: Record<string, string> = {
        'md': 'mermaid',
        'mmd': 'mermaid',
        'puml': 'plantuml',
        'plantuml': 'plantuml',
        'dot': 'dot',
        'gv': 'dot',
        'drawio': 'drawio',
        'excalidraw': 'excalidraw',
    };

    return ext ? formatMap[ext] || null : null;
}
