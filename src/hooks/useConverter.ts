import { useState, useEffect, useCallback } from 'react';
import { convert } from '@whitebite/diagram-converter';

type InputFormat = 'mermaid' | 'drawio' | 'excalidraw' | 'plantuml' | 'dot';
type OutputFormat = 'drawio' | 'excalidraw' | 'mermaid' | 'plantuml' | 'dot' | 'svg' | 'png';

interface ConvertOptionsValue {
    transliterate: boolean;
    maxLength: number | null;
    autoLayout: boolean;
    layoutDirection: 'TB' | 'LR' | 'BT' | 'RL';
}

interface UseConverterResult {
    output: string;
    error: string | null;
    isConverting: boolean;
    convertNow: () => void;
}

export function useConverter(
    code: string,
    inputFormat: InputFormat,
    outputFormat: OutputFormat,
    options?: ConvertOptionsValue
): UseConverterResult {
    const [output, setOutput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isConverting, setIsConverting] = useState(false);

    const doConvert = useCallback(() => {
        if (!code.trim()) {
            setOutput('');
            setError(null);
            return;
        }

        setIsConverting(true);
        setError(null);

        try {
            const result = convert(code, {
                from: inputFormat,
                to: outputFormat,
                layout: options?.autoLayout !== false ? {
                    algorithm: 'dagre',
                    direction: options?.layoutDirection || 'LR',
                } : {
                    algorithm: 'none',
                },
                text: {
                    transliterate: options?.transliterate,
                    maxLength: options?.maxLength ?? undefined,
                },
            });

            setOutput(result.output);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Conversion failed');
            setOutput('');
        } finally {
            setIsConverting(false);
        }
    }, [code, inputFormat, outputFormat, options]);

    // Debounced conversion
    useEffect(() => {
        const timeout = setTimeout(doConvert, 500);
        return () => clearTimeout(timeout);
    }, [doConvert]);

    return {
        output,
        error,
        isConverting,
        convertNow: doConvert,
    };
}
