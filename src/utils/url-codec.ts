import pako from 'pako';

/**
 * Maximum URL length (browser limitation)
 */
export const MAX_URL_LENGTH = 2000;

/**
 * Encode diagram code for URL using gzip + base64
 */
export function encodeForUrl(code: string): string {
  const compressed = pako.deflate(code);
  const base64 = btoa(String.fromCharCode(...compressed));
  return encodeURIComponent(base64);
}

/**
 * Decode diagram code from URL
 */
export function decodeFromUrl(encoded: string): string {
  const base64 = decodeURIComponent(encoded);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decompressed = pako.inflate(bytes);
  return new TextDecoder().decode(decompressed);
}

/**
 * Build share URL with encoded diagram
 */
export function buildShareUrl(params: {
  code: string;
  from: string;
  to: string;
}): string {
  const url = new URL(window.location.origin);
  url.searchParams.set('code', encodeForUrl(params.code));
  url.searchParams.set('from', params.from);
  url.searchParams.set('to', params.to);
  return url.toString();
}

/**
 * Parse share URL and extract diagram data
 */
export function parseShareUrl(url: string): {
  code: string;
  from: string;
  to: string;
} | null {
  try {
    const parsed = new URL(url);
    const encodedCode = parsed.searchParams.get('code');
    const from = parsed.searchParams.get('from');
    const to = parsed.searchParams.get('to');

    if (!encodedCode || !from || !to) return null;

    return {
      code: decodeFromUrl(encodedCode),
      from,
      to,
    };
  } catch {
    return null;
  }
}

/**
 * Check if URL would exceed browser length limit
 */
export function isUrlTooLong(code: string, from: string, to: string): boolean {
  const url = buildShareUrl({ code, from, to });
  return url.length > MAX_URL_LENGTH;
}
