/**
 * Hook for real-time syntax checking
 */

import { useState, useEffect, useMemo } from 'react';
import { fixSyntax } from '@whitebite/diagram-converter';
import type { EditorMarker } from '../components/CodeEditor';

type Format = 'mermaid' | 'plantuml' | 'dot' | 'drawio' | 'excalidraw';

interface UseSyntaxCheckerResult {
    markers: EditorMarker[];
    hasErrors: boolean;
    errorCount: number;
}

export function useSyntaxChecker(code: string, format: Format): UseSyntaxCheckerResult {
    const [markers, setMarkers] = useState<EditorMarker[]>([]);

    useEffect(() => {
        if (!code.trim()) {
            setMarkers([]);
            return;
        }

        // Debounce syntax checking
        const timeout = setTimeout(() => {
            try {
                const result = fixSyntax(code, format);

                const newMarkers: EditorMarker[] = [
                    ...result.errors.map(e => ({
                        line: e.line,
                        column: e.column,
                        message: e.message,
                        severity: 'error' as const,
                    })),
                    ...result.suggestions.map(s => ({
                        line: s.line,
                        message: s.description,
                        severity: 'warning' as const,
                    })),
                ];

                setMarkers(newMarkers);
            } catch {
                // Format doesn't support syntax checking
                setMarkers([]);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [code, format]);

    const hasErrors = useMemo(() => markers.some(m => m.severity === 'error'), [markers]);
    const errorCount = useMemo(() => markers.filter(m => m.severity === 'error').length, [markers]);

    return { markers, hasErrors, errorCount };
}
