import { useState, useCallback } from 'react';
import { fixSyntax, hasFixerFor, type FixResult, type InputFormat } from '@whitebite/diagram-converter';

interface UseFixerResult {
    fix: () => void;
    fixResult: FixResult | null;
    isFixerAvailable: boolean;
    clearResult: () => void;
}

export function useFixer(
    code: string,
    format: InputFormat,
    onCodeChange: (code: string) => void
): UseFixerResult {
    const [fixResult, setFixResult] = useState<FixResult | null>(null);

    const isFixerAvailable = hasFixerFor(format);

    const fix = useCallback(() => {
        if (!isFixerAvailable) return;

        const result = fixSyntax(code, format);
        setFixResult(result);

        // Apply fixed code if there were changes
        if (result.fixed !== result.original) {
            onCodeChange(result.fixed);
        }
    }, [code, format, isFixerAvailable, onCodeChange]);

    const clearResult = useCallback(() => {
        setFixResult(null);
    }, []);

    return {
        fix,
        fixResult,
        isFixerAvailable,
        clearResult,
    };
}
