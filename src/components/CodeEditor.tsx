import Editor, { OnMount } from '@monaco-editor/react';
import { useRef, useEffect } from 'react';
import type { editor } from 'monaco-editor';

export interface EditorMarker {
    line: number;
    column?: number;
    endLine?: number;
    endColumn?: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: string;
    readOnly?: boolean;
    wordWrap?: boolean;
    lineNumbers?: boolean;
    markers?: EditorMarker[];
}

export function CodeEditor({
    value,
    onChange,
    language = 'markdown',
    readOnly = false,
    wordWrap = true,
    lineNumbers = true,
    markers = [],
}: CodeEditorProps) {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<typeof import('monaco-editor') | null>(null);

    const handleEditorMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;
        updateMarkers(markers);
    };

    const updateMarkers = (newMarkers: EditorMarker[]) => {
        if (!editorRef.current || !monacoRef.current) return;

        const model = editorRef.current.getModel();
        if (!model) return;

        const monaco = monacoRef.current;
        const monacoMarkers: editor.IMarkerData[] = newMarkers.map(m => ({
            startLineNumber: m.line,
            startColumn: m.column || 1,
            endLineNumber: m.endLine || m.line,
            endColumn: m.endColumn || model.getLineMaxColumn(m.line),
            message: m.message,
            severity: m.severity === 'error'
                ? monaco.MarkerSeverity.Error
                : m.severity === 'warning'
                    ? monaco.MarkerSeverity.Warning
                    : monaco.MarkerSeverity.Info,
        }));

        monaco.editor.setModelMarkers(model, 'syntax-checker', monacoMarkers);
    };

    useEffect(() => {
        updateMarkers(markers);
    }, [markers]);

    return (
        <Editor
            height="100%"
            language={language}
            value={value}
            onChange={(val) => onChange(val || '')}
            theme="vs-dark"
            onMount={handleEditorMount}
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: lineNumbers ? 'on' : 'off',
                scrollBeyondLastLine: false,
                wordWrap: wordWrap ? 'on' : 'off',
                readOnly,
                automaticLayout: true,
                tabSize: 2,
                padding: { top: 12, bottom: 12 },
            }}
        />
    );
}
