import { useState } from 'react';
import Editor from '@monaco-editor/react';
import styles from './SideBySideLayout.module.css';

interface SideBySideLayoutProps {
  inputCode: string;
  outputCode: string;
  inputFormat: string;
  outputFormat: string;
  inputPreview?: React.ReactNode;
  outputPreview?: React.ReactNode;
  onInputChange: (code: string) => void;
  readOnly?: boolean;
}

export function SideBySideLayout({
  inputCode,
  outputCode,
  inputFormat,
  outputFormat,
  inputPreview,
  outputPreview,
  onInputChange,
  readOnly = false,
}: SideBySideLayoutProps) {
  const [showPreview, setShowPreview] = useState(true);

  const getLanguage = (format: string): string => {
    const languageMap: Record<string, string> = {
      mermaid: 'markdown',
      plantuml: 'plaintext',
      drawio: 'xml',
      excalidraw: 'json',
      dot: 'plaintext',
      d2: 'plaintext',
      svg: 'xml',
      json: 'json',
    };
    return languageMap[format] || 'plaintext';
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={showPreview}
            onChange={(e) => setShowPreview(e.target.checked)}
          />
          Show Preview
        </label>
      </div>

      {/* Main content */}
      <div className={styles.content}>
        {/* Left side - Input */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>Input ({inputFormat})</span>
          </div>
          <div className={styles.editor}>
            <Editor
              value={inputCode}
              language={getLanguage(inputFormat)}
              onChange={(value) => onInputChange(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                readOnly,
              }}
            />
          </div>
          {showPreview && inputPreview && (
            <div className={styles.preview}>
              <div className={styles.previewHeader}>Preview</div>
              <div className={styles.previewContent}>{inputPreview}</div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Right side - Output */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>Output ({outputFormat})</span>
          </div>
          <div className={styles.editor}>
            <Editor
              value={outputCode}
              language={getLanguage(outputFormat)}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                readOnly: true,
              }}
            />
          </div>
          {showPreview && outputPreview && (
            <div className={styles.preview}>
              <div className={styles.previewHeader}>Preview</div>
              <div className={styles.previewContent}>{outputPreview}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
