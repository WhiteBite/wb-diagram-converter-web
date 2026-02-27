/**
 * Hook for opening diagrams in wb-diagram-board visual editor
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Diagram } from '@whitebite/diagram-converter';
import {
    createEditSessionStart,
    isCrossOriginMessage,
    isEditSessionResult,
    isEditSessionReady,
    isEditSessionCancel,
    type DiagramFormat,
    type EditSessionResultMessage,
} from '../types/cross-origin';
import { CONFIG } from '../config';

/** Result from the board editor */
export interface BoardEditorResult {
    readonly code: string;
    readonly format: DiagramFormat;
    readonly diagram: Diagram;
}

/** Error from the board editor */
export interface BoardEditorError {
    readonly type: 'timeout' | 'closed' | 'unknown';
    readonly message: string;
}

/** Hook return type */
export interface UseBoardEditorResult {
    /** Open the board editor with the given diagram */
    readonly openEditor: (
        diagram: Diagram,
        sourceFormat: DiagramFormat,
        returnFormat?: DiagramFormat
    ) => void;
    /** Whether an editing session is in progress */
    readonly isEditing: boolean;
    /** Result from the last editing session */
    readonly result: BoardEditorResult | null;
    /** Error from the last editing session */
    readonly error: BoardEditorError | null;
    /** Clear the result and error */
    readonly reset: () => void;
}

/** Generate a unique session ID */
function generateSessionId(): string {
    return `edit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Timeout for waiting for the board to be ready (ms) */
const READY_TIMEOUT_MS = 30000;

export function useBoardEditor(): UseBoardEditorResult {
    const [isEditing, setIsEditing] = useState(false);
    const [result, setResult] = useState<BoardEditorResult | null>(null);
    const [error, setError] = useState<BoardEditorError | null>(null);

    // Refs for managing the editing session
    const sessionIdRef = useRef<string | null>(null);
    const windowRef = useRef<Window | null>(null);
    const pendingDiagramRef = useRef<{
        diagram: Diagram;
        sourceFormat: DiagramFormat;
        returnFormat?: DiagramFormat;
    } | null>(null);
    const readyTimeoutRef = useRef<number | null>(null);

    // Cleanup function
    const cleanup = useCallback(() => {
        if (readyTimeoutRef.current !== null) {
            clearTimeout(readyTimeoutRef.current);
            readyTimeoutRef.current = null;
        }
        sessionIdRef.current = null;
        windowRef.current = null;
        pendingDiagramRef.current = null;
        setIsEditing(false);
    }, []);

    // Handle messages from the board editor
    useEffect(() => {
        function handleMessage(event: MessageEvent): void {
            // Validate origin
            if (event.origin !== CONFIG.boardOrigin) {
                return;
            }

            // Validate message structure
            if (!isCrossOriginMessage(event.data)) {
                return;
            }

            const message = event.data;

            // Check session ID matches
            if (message.sessionId !== sessionIdRef.current) {
                return;
            }

            // Handle ready signal - send the diagram
            if (isEditSessionReady(message)) {
                console.log('[BoardEditor] Received ready signal from Board');
                if (pendingDiagramRef.current && windowRef.current) {
                    // Clear the ready timeout
                    if (readyTimeoutRef.current !== null) {
                        clearTimeout(readyTimeoutRef.current);
                        readyTimeoutRef.current = null;
                    }

                    const { diagram, sourceFormat, returnFormat } = pendingDiagramRef.current;
                    console.log('[BoardEditor] Sending diagram to Board:', {
                        sourceFormat,
                        returnFormat,
                        nodes: diagram.nodes.length,
                        edges: diagram.edges.length,
                    });
                    const startMessage = createEditSessionStart(
                        sessionIdRef.current!,
                        diagram,
                        sourceFormat,
                        returnFormat
                    );

                    windowRef.current.postMessage(startMessage, CONFIG.boardOrigin);
                    console.log('[BoardEditor] Sent EDIT_SESSION_START to', CONFIG.boardOrigin);
                    pendingDiagramRef.current = null;
                }
                return;
            }

            // Handle result
            if (isEditSessionResult(message)) {
                const resultMessage = message as EditSessionResultMessage;
                setResult({
                    code: resultMessage.code,
                    format: resultMessage.format,
                    diagram: resultMessage.diagram,
                });
                setError(null);
                cleanup();
                return;
            }

            // Handle cancel
            if (isEditSessionCancel(message)) {
                setError({
                    type: 'closed',
                    message: 'Editing session was cancelled',
                });
                cleanup();
                return;
            }
        }

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [cleanup]);

    // Monitor window close
    useEffect(() => {
        if (!isEditing) return;

        const checkWindowClosed = setInterval(() => {
            if (windowRef.current?.closed) {
                setError({
                    type: 'closed',
                    message: 'Editor window was closed',
                });
                cleanup();
            }
        }, 500);

        return () => clearInterval(checkWindowClosed);
    }, [isEditing, cleanup]);

    const openEditor = useCallback(
        (diagram: Diagram, sourceFormat: DiagramFormat, returnFormat?: DiagramFormat) => {
            // Reset previous state
            setResult(null);
            setError(null);

            // Generate session ID
            const sessionId = generateSessionId();
            sessionIdRef.current = sessionId;

            // Store pending diagram
            pendingDiagramRef.current = { diagram, sourceFormat, returnFormat };

            // Build URL with parameters
            const url = new URL(CONFIG.boardUrl);
            url.searchParams.set('mode', 'edit');
            url.searchParams.set('session', sessionId);
            url.searchParams.set('opener', CONFIG.converterOrigin);

            // Open the board editor
            const boardWindow = window.open(url.toString(), '_blank');

            if (!boardWindow) {
                setError({
                    type: 'unknown',
                    message: 'Failed to open editor window. Please allow popups.',
                });
                cleanup();
                return;
            }

            windowRef.current = boardWindow;
            setIsEditing(true);

            // Set timeout for ready signal
            readyTimeoutRef.current = window.setTimeout(() => {
                if (pendingDiagramRef.current) {
                    setError({
                        type: 'timeout',
                        message: 'Editor did not respond in time',
                    });
                    cleanup();
                }
            }, READY_TIMEOUT_MS);
        },
        [cleanup]
    );

    const reset = useCallback(() => {
        setResult(null);
        setError(null);
    }, []);

    return {
        openEditor,
        isEditing,
        result,
        error,
        reset,
    };
}
