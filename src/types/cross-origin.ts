/**
 * Cross-origin message types for wb-diagram-converter-web <-> wb-diagram-board.
 *
 * NOTE: These types are intentionally duplicated here to avoid depending on
 * unpublished/unstable exports from @whitebite/diagram-converter.
 */

import type { Diagram } from '@whitebite/diagram-converter';

export type DiagramFormat = 'mermaid' | 'plantuml' | 'dot' | 'drawio' | 'excalidraw';

export interface EditSessionStartMessage {
    readonly type: 'wb-edit-session-start';
    readonly sessionId: string;
    readonly diagram: Diagram;
    readonly sourceFormat: DiagramFormat;
    readonly returnFormat?: DiagramFormat;
    readonly timestamp: number;
}

export interface EditSessionResultMessage {
    readonly type: 'wb-edit-session-result';
    readonly sessionId: string;
    readonly diagram: Diagram;
    readonly code: string;
    readonly format: DiagramFormat;
    readonly timestamp: number;
}

export interface EditSessionCancelMessage {
    readonly type: 'wb-edit-session-cancel';
    readonly sessionId: string;
    readonly timestamp: number;
}

export interface EditSessionReadyMessage {
    readonly type: 'wb-edit-session-ready';
    readonly sessionId: string;
    readonly timestamp: number;
}

export type CrossOriginMessage =
    | EditSessionStartMessage
    | EditSessionResultMessage
    | EditSessionCancelMessage
    | EditSessionReadyMessage;

export function isCrossOriginMessage(data: unknown): data is CrossOriginMessage {
    if (typeof data !== 'object' || data === null) return false;
    const msg = data as Record<string, unknown>;
    return (
        typeof msg.type === 'string' &&
        msg.type.startsWith('wb-edit-session-') &&
        typeof msg.sessionId === 'string'
    );
}

export function isEditSessionReady(msg: CrossOriginMessage): msg is EditSessionReadyMessage {
    return msg.type === 'wb-edit-session-ready';
}

export function isEditSessionResult(msg: CrossOriginMessage): msg is EditSessionResultMessage {
    return msg.type === 'wb-edit-session-result';
}

export function isEditSessionCancel(msg: CrossOriginMessage): msg is EditSessionCancelMessage {
    return msg.type === 'wb-edit-session-cancel';
}

export function createEditSessionStart(
    sessionId: string,
    diagram: Diagram,
    sourceFormat: DiagramFormat,
    returnFormat?: DiagramFormat
): EditSessionStartMessage {
    return {
        type: 'wb-edit-session-start',
        sessionId,
        diagram,
        sourceFormat,
        returnFormat: returnFormat ?? sourceFormat,
        timestamp: Date.now(),
    };
}
