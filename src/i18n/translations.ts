/**
 * Translations for WB Diagrams
 */

export type Language = 'en' | 'ru';

export interface Translations {
    // Header
    appName: string;
    appDescription: string;
    shareLink: string;
    darkMode: string;
    lightMode: string;

    // Format Selector
    from: string;
    to: string;
    examples: string;
    soon: string;

    // Editor
    input: string;
    output: string;
    lines: string;
    fixSyntax: string;
    copyToClipboard: string;
    downloadFile: string;

    // Fix Results
    fixedIssues: string;
    issuesFound: string;
    noIssuesFound: string;
    cantAutoFix: string;
    lineNumber: string;
    andMore: string;

    // Preview
    preview: string;
    source: string;
    sourcePreview: string;
    outputPreview: string;
    failedToRender: string;
    downloadToView: string;
    xmlGenerated: string;

    // Examples Gallery
    exampleDiagrams: string;

    // Output Panel
    conversionError: string;
    converting: string;

    // Convert Options
    convertOptions: string;
    textOptions: string;
    transliterate: string;
    transliterateHint: string;
    truncateLabels: string;
    layoutOptions: string;
    autoLayout: string;
    direction: string;

    // Toast messages
    linkCopied: string;
    fileSaved: string;
    conversionComplete: string;
    fileLoaded: string;
    dropFileHere: string;

    // Footer
    madeWith: string;

    // Errors
    unsupportedFormat: string;
    parseError: string;
    generatorError: string;

    // Formats
    formats: {
        mermaid: string;
        drawio: string;
        excalidraw: string;
        plantuml: string;
        dot: string;
        svg: string;
        png: string;
    };

    // Categories
    categories: {
        flowchart: string;
        sequence: string;
        class: string;
        state: string;
        er: string;
        basic: string;
    };
}

export const translations: Record<Language, Translations> = {
    en: {
        // Header
        appName: 'WB Diagrams',
        appDescription: 'Universal Diagram Converter',
        shareLink: 'Share link',
        darkMode: 'Dark mode',
        lightMode: 'Light mode',

        // Format Selector
        from: 'From',
        to: 'To',
        examples: 'Examples',
        soon: 'soon',

        // Editor
        input: 'Input',
        output: 'Output',
        lines: 'lines',
        fixSyntax: 'Fix syntax errors',
        copyToClipboard: 'Copy to clipboard',
        downloadFile: 'Download file',

        // Fix Results
        fixedIssues: 'Fixed {count} issue(s)',
        issuesFound: '{count} issue(s) found',
        noIssuesFound: 'No syntax issues found',
        cantAutoFix: "can't auto-fix",
        lineNumber: 'Line {line}',
        andMore: '...and {count} more',

        // Preview
        preview: 'Preview',
        source: 'Source',
        sourcePreview: 'Source ({format})',
        outputPreview: 'Output ({format})',
        failedToRender: 'Failed to render',
        downloadToView: 'Download the file and open in draw.io to view',
        xmlGenerated: 'Draw.io XML Generated',

        // Examples Gallery
        exampleDiagrams: 'Example Diagrams',

        // Output Panel
        conversionError: 'Conversion Error',
        converting: 'Converting...',

        // Convert Options
        convertOptions: 'Conversion Options',
        textOptions: 'Text Options',
        transliterate: 'Transliterate Cyrillic',
        transliterateHint: 'Convert Cyrillic to Latin (for formats with poor Unicode support)',
        truncateLabels: 'Truncate long labels',
        layoutOptions: 'Layout Options',
        autoLayout: 'Auto-layout nodes',
        direction: 'Direction',

        // Toast messages
        linkCopied: 'Link copied to clipboard',
        fileSaved: 'File saved',
        conversionComplete: 'Conversion complete',
        fileLoaded: 'File loaded',
        dropFileHere: 'Drop file here to load',

        // Footer
        madeWith: 'Made with ❤️ by',

        // Errors
        unsupportedFormat: 'Unsupported format',
        parseError: 'Parse error',
        generatorError: 'Generator error',

        // Formats
        formats: {
            mermaid: 'Mermaid',
            drawio: 'Draw.io',
            excalidraw: 'Excalidraw',
            plantuml: 'PlantUML',
            dot: 'Graphviz DOT',
            svg: 'SVG',
            png: 'PNG',
        },

        // Categories
        categories: {
            flowchart: 'Flowchart',
            sequence: 'Sequence',
            class: 'Class',
            state: 'State',
            er: 'ER Diagram',
            basic: 'Basic',
        },
    },

    ru: {
        // Header
        appName: 'WB Diagrams',
        appDescription: 'Универсальный конвертер диаграмм',
        shareLink: 'Поделиться ссылкой',
        darkMode: 'Тёмная тема',
        lightMode: 'Светлая тема',

        // Format Selector
        from: 'Из',
        to: 'В',
        examples: 'Примеры',
        soon: 'скоро',

        // Editor
        input: 'Ввод',
        output: 'Вывод',
        lines: 'строк',
        fixSyntax: 'Исправить синтаксис',
        copyToClipboard: 'Копировать',
        downloadFile: 'Скачать файл',

        // Fix Results
        fixedIssues: 'Исправлено {count} ошибок',
        issuesFound: 'Найдено {count} ошибок',
        noIssuesFound: 'Ошибок синтаксиса не найдено',
        cantAutoFix: 'нельзя исправить автоматически',
        lineNumber: 'Строка {line}',
        andMore: '...и ещё {count}',

        // Preview
        preview: 'Предпросмотр',
        source: 'Исходник',
        sourcePreview: 'Исходник ({format})',
        outputPreview: 'Результат ({format})',
        failedToRender: 'Ошибка рендеринга',
        downloadToView: 'Скачайте файл и откройте в draw.io для просмотра',
        xmlGenerated: 'Draw.io XML сгенерирован',

        // Examples Gallery
        exampleDiagrams: 'Примеры диаграмм',

        // Output Panel
        conversionError: 'Ошибка конвертации',
        converting: 'Конвертация...',

        // Convert Options
        convertOptions: 'Настройки конвертации',
        textOptions: 'Настройки текста',
        transliterate: 'Транслитерация кириллицы',
        transliterateHint: 'Конвертировать кириллицу в латиницу (для форматов с плохой поддержкой Unicode)',
        truncateLabels: 'Обрезать длинные подписи',
        layoutOptions: 'Настройки раскладки',
        autoLayout: 'Авто-раскладка узлов',
        direction: 'Направление',

        // Toast messages
        linkCopied: 'Ссылка скопирована',
        fileSaved: 'Файл сохранён',
        conversionComplete: 'Конвертация завершена',
        fileLoaded: 'Файл загружен',
        dropFileHere: 'Перетащите файл сюда',

        // Footer
        madeWith: 'Сделано с ❤️',

        // Errors
        unsupportedFormat: 'Неподдерживаемый формат',
        parseError: 'Ошибка парсинга',
        generatorError: 'Ошибка генератора',

        // Formats
        formats: {
            mermaid: 'Mermaid',
            drawio: 'Draw.io',
            excalidraw: 'Excalidraw',
            plantuml: 'PlantUML',
            dot: 'Graphviz DOT',
            svg: 'SVG',
            png: 'PNG',
        },

        // Categories
        categories: {
            flowchart: 'Блок-схема',
            sequence: 'Последовательность',
            class: 'Классы',
            state: 'Состояния',
            er: 'ER-диаграмма',
            basic: 'Базовый',
        },
    },
};

/** Get browser language or default to English */
export function detectLanguage(): Language {
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'ru' ? 'ru' : 'en';
}

/** Format string with placeholders */
export function t(template: string, params?: Record<string, string | number>): string {
    if (!params) return template;

    return template.replace(/\{(\w+)\}/g, (_, key) => {
        return params[key]?.toString() ?? `{${key}}`;
    });
}
