/**
 * Hook for managing conversion history in localStorage
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'wb-converter-history';
const MAX_HISTORY_SIZE = 10;

export interface ConversionRecord {
    id: string;
    inputFormat: string;
    outputFormat: string;
    inputCode: string;
    timestamp: number;
}

interface UseConversionHistoryResult {
    history: ConversionRecord[];
    addToHistory: (record: Omit<ConversionRecord, 'id' | 'timestamp'>) => void;
    clearHistory: () => void;
    removeFromHistory: (id: string) => void;
}

/** Generate unique ID */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Load history from localStorage */
function loadHistory(): ConversionRecord[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }
    } catch {
        console.error('[ConversionHistory] Failed to load history');
    }
    return [];
}

/** Save history to localStorage */
function saveHistory(history: ConversionRecord[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
        console.error('[ConversionHistory] Failed to save history');
    }
}

export function useConversionHistory(): UseConversionHistoryResult {
    const [history, setHistory] = useState<ConversionRecord[]>(() => loadHistory());

    // Sync with localStorage on mount
    useEffect(() => {
        setHistory(loadHistory());
    }, []);

    const addToHistory = useCallback((record: Omit<ConversionRecord, 'id' | 'timestamp'>) => {
        setHistory(prev => {
            // Check for duplicate (same code and formats)
            const isDuplicate = prev.some(
                r => r.inputCode === record.inputCode &&
                    r.inputFormat === record.inputFormat &&
                    r.outputFormat === record.outputFormat
            );

            if (isDuplicate) {
                return prev;
            }

            const newRecord: ConversionRecord = {
                ...record,
                id: generateId(),
                timestamp: Date.now(),
            };

            // Add to beginning, limit to MAX_HISTORY_SIZE
            const updated = [newRecord, ...prev].slice(0, MAX_HISTORY_SIZE);
            saveHistory(updated);
            return updated;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        saveHistory([]);
    }, []);

    const removeFromHistory = useCallback((id: string) => {
        setHistory(prev => {
            const updated = prev.filter(r => r.id !== id);
            saveHistory(updated);
            return updated;
        });
    }, []);

    return {
        history,
        addToHistory,
        clearHistory,
        removeFromHistory,
    };
}
