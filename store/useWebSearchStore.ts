'use client';

import { create } from 'zustand';
import type { WebSearchResult } from '@/types/websearch';

type WebSearchState = {
  enableWebSearch: boolean;
  isSearching: boolean;
  lastResults: WebSearchResult[] | null;
  lastError: string | null;
  setEnableWebSearch: (value: boolean) => void;
  setIsSearching: (value: boolean) => void;
  setLastResults: (results: WebSearchResult[] | null) => void;
  setLastError: (message: string | null) => void;
  reset: () => void;
};

export const useWebSearchStore = create<WebSearchState>((set) => ({
  enableWebSearch: false,
  isSearching: false,
  lastResults: null,
  lastError: null,
  setEnableWebSearch: (value) => set({ enableWebSearch: value }),
  setIsSearching: (value) => set({ isSearching: value }),
  setLastResults: (results) => set({ lastResults: results }),
  setLastError: (message) => set({ lastError: message }),
  reset: () =>
    set({
      enableWebSearch: false,
      isSearching: false,
      lastResults: null,
      lastError: null,
    }),
}));

