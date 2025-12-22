/**
 * Main application hook
 * 
 * Manages app state, keyboard shortcuts, drag & drop, and persistence
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useConverter } from './useConverter';
import { useFixer } from './useFixer';
import { EXAMPLES } from '../data/examples';

type InputFormat = 'mermaid' | 'drawio' | 'excalidraw' | 'plantuml' | 'dot';
type OutputFormat = 'drawio' | 'excalidraw' | 'mermaid' | 'plantuml' | 'dot' | 'svg' | 'png';

const DEFAULT_CODE = `flowchart LR
    A[Start] --> B{Decision}
    B -->|Yes| C[Process]
    B -->|No| D[End]
    C --> E((Result))
    E --> D`;

const STORAGE_KEY = 'wb-diagrams-state';

interface SavedState {
    code: string;
    inputFormat: InputFormat;
    outputFormat: OutputFormat;
}

export function useApp() {
    const [inputFormat, setInputFormat] = useState<InputFormat>('mermaid');
    const [outputFormat, setOutputFormat] = useState<OutputFormat>('drawio');
    const [code, setCode] = useState(DEFAULT_CODE);
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });
    const [showExamples, setShowExamples] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { output, error, isConverting } = useConverter(code, inputFormat, outputFormat);
    const { fix, fixResult, isFixerAvailable, clearResult } = useFixer(code, inputFormat, setCode);

    // Load saved state from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const state: SavedState = JSON.parse(saved);
                if (state.code) setCode(state.code);
                if (state.inputFormat) setInputFormat(state.inputFormat);
                if (state.outputFormat) setOutputFormat(state.outputFormat);
            }
        } catch {
            // Ignore parse errors
        }
    }, []);

    // Save state to localStorage (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            const state: SavedState = { code, inputFormat, outputFormat };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }, 1000);
        return () => clearTimeout(timer);
    }, [code, inputFormat, outputFormat]);

    // Clear fix result when code changes
    useEffect(() => {
        if (fixResult && code !== fixResult.fixed) {
            clearResult();
        }
    }, [code, fixResult, clearResult]);

    // Dark mode
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    // Load from URL params
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

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
                e.preventDefault();
                if (isFixerAvailable) fix();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                setShowShortcuts(s => !s);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                fileInputRef.current?.click();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFixerAvailable, fix]);

    // File handling
    const handleFileLoad = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setCode(content);

            // Auto-detect format
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (ext === 'mmd' || ext === 'mermaid') setInputFormat('mermaid');
            else if (ext === 'drawio' || ext === 'xml') setInputFormat('drawio');
            else if (ext === 'excalidraw') setInputFormat('excalidraw');
            else if (ext === 'puml' || ext === 'plantuml') setInputFormat('plantuml');
            else if (ext === 'dot' || ext === 'gv') setInputFormat('dot');
        };
        reader.readAsText(file);
    }, []);

    // Drag & Drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileLoad(file);
    }, [handleFileLoad]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileLoad(file);
    }, [handleFileLoad]);

    // Example selection
    const handleExampleSelect = useCallback((example: typeof EXAMPLES[0]) => {
        setCode(example.code);
        setInputFormat(example.format as InputFormat);
        setShowExamples(false);
    }, []);

    // Share URL
    const handleShare = useCallback(() => {
        const params = new URLSearchParams({
            from: inputFormat,
            to: outputFormat,
            code: btoa(code),
        });
        const url = `${window.location.origin}${window.location.pathname}?${params}`;
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    }, [code, inputFormat, outputFormat]);

    // Toggle functions
    const toggleDarkMode = useCallback(() => setDarkMode(d => !d), []);
    const toggleExamples = useCallback(() => setShowExamples(s => !s), []);
    const toggleShortcuts = useCallback(() => setShowShortcuts(s => !s), []);
    const closeExamples = useCallback(() => setShowExamples(false), []);
    const closeShortcuts = useCallback(() => setShowShortcuts(false), []);
    const openFileDialog = useCallback(() => fileInputRef.current?.click(), []);

    return {
        // State
        code,
        setCode,
        inputFormat,
        setInputFormat,
        outputFormat,
        setOutputFormat,
        darkMode,
        showExamples,
        showShortcuts,
        isDragging,
        fileInputRef,

        // Converter
        output,
        error,
        isConverting,

        // Fixer
        fix,
        fixResult,
        isFixerAvailable,
        clearResult,

        // Handlers
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleFileInput,
        handleExampleSelect,
        handleShare,

        // Toggles
        toggleDarkMode,
        toggleExamples,
        toggleShortcuts,
        closeExamples,
        closeShortcuts,
        openFileDialog,
    };
}
