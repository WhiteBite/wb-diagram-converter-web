import { useCallback, useEffect, useState } from 'react';
import { buildShareUrl, parseShareUrl, isUrlTooLong } from '../utils/url-codec';

interface ShareLinkState {
  code: string;
  from: string;
  to: string;
}

interface UseShareLinkResult {
  /** Current state */
  state: ShareLinkState;
  /** Generated share URL */
  shareUrl: string;
  /** Whether URL exceeds browser limit */
  isUrlTooLong: boolean;
  /** Generate share URL from current state */
  generateShareUrl: () => string;
  /** Copy share URL to clipboard */
  copyShareUrl: () => Promise<string>;
  /** Update state partially */
  updateState: (updates: Partial<ShareLinkState>) => void;
  /** Whether state was loaded from URL */
  loadedFromUrl: boolean;
}

/**
 * Hook for managing share links with URL encoding/decoding
 */
export function useShareLink(initialState: ShareLinkState): UseShareLinkResult {
  const [state, setState] = useState<ShareLinkState>(initialState);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [loadedFromUrl, setLoadedFromUrl] = useState<boolean>(false);

  // Load from URL on mount
  useEffect(() => {
    const parsed = parseShareUrl(window.location.href);
    if (parsed) {
      setState(parsed);
      setLoadedFromUrl(true);
    }
  }, []);

  // Generate share URL
  const generateShareUrl = useCallback(() => {
    const url = buildShareUrl(state);
    setShareUrl(url);
    return url;
  }, [state]);

  // Copy to clipboard
  const copyShareUrl = useCallback(async () => {
    const url = generateShareUrl();
    await navigator.clipboard.writeText(url);
    return url;
  }, [generateShareUrl]);

  // Update state
  const updateState = useCallback((updates: Partial<ShareLinkState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Check URL length
  const urlTooLong = isUrlTooLong(state.code, state.from, state.to);

  return {
    state,
    shareUrl,
    isUrlTooLong: urlTooLong,
    generateShareUrl,
    copyShareUrl,
    updateState,
    loadedFromUrl,
  };
}
