'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type MainTabType = 'my-content' | 'public-gallery';
export type ContentType = 'all' | 'videos' | 'images' | 'characters';
export type SortType = 'recent' | 'popular' | 'likes';
export type GridSize = 'normal' | 'compact';

interface GalleryFilters {
  mainTab: MainTabType;
  contentType: ContentType;
  sortBy: SortType;
  gridSize: GridSize;
  searchQuery: string;
  showFilters: boolean;
  // Character-specific filters
  selectedType: string;
  selectedStyle: string;
}

interface GalleryState extends GalleryFilters {
  // Actions
  setMainTab: (tab: MainTabType) => void;
  setContentType: (type: ContentType) => void;
  setSortBy: (sort: SortType) => void;
  setGridSize: (size: GridSize) => void;
  setSearchQuery: (query: string) => void;
  setShowFilters: (show: boolean) => void;
  toggleFilters: () => void;
  setSelectedType: (type: string) => void;
  setSelectedStyle: (style: string) => void;
  resetFilters: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialFilters: GalleryFilters = {
  mainTab: 'my-content',
  contentType: 'all',
  sortBy: 'recent',
  gridSize: 'normal',
  searchQuery: '',
  showFilters: false,
  selectedType: 'all',
  selectedStyle: 'all',
};

// ============================================================================
// STORE
// ============================================================================

export const useGalleryStore = create<GalleryState>()(
  persist(
    (set) => ({
      ...initialFilters,

      setMainTab: (mainTab) => set({ mainTab }),

      setContentType: (contentType) => set({ contentType }),

      setSortBy: (sortBy) => set({ sortBy }),

      setGridSize: (gridSize) => set({ gridSize }),

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      setShowFilters: (showFilters) => set({ showFilters }),

      toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),

      setSelectedType: (selectedType) => set({ selectedType }),

      setSelectedStyle: (selectedStyle) => set({ selectedStyle }),

      resetFilters: () => set({
        searchQuery: '',
        showFilters: false,
        selectedType: 'all',
        selectedStyle: 'all',
        sortBy: 'recent',
      }),
    }),
    {
      name: 'gallery-filters',
      partialize: (state) => ({
        // Only persist these values
        gridSize: state.gridSize,
        mainTab: state.mainTab,
      }),
    }
  )
);

// ============================================================================
// SELECTORS (for optimized re-renders)
// ============================================================================

export const useMainTab = () => useGalleryStore((s) => s.mainTab);
export const useContentType = () => useGalleryStore((s) => s.contentType);
export const useSortBy = () => useGalleryStore((s) => s.sortBy);
export const useGridSize = () => useGalleryStore((s) => s.gridSize);
export const useSearchQuery = () => useGalleryStore((s) => s.searchQuery);
export const useShowFilters = () => useGalleryStore((s) => s.showFilters);
export const useSelectedType = () => useGalleryStore((s) => s.selectedType);
export const useSelectedStyle = () => useGalleryStore((s) => s.selectedStyle);

// Combined selectors
export const useGalleryFilters = () => useGalleryStore((s) => ({
  mainTab: s.mainTab,
  contentType: s.contentType,
  sortBy: s.sortBy,
  searchQuery: s.searchQuery,
  selectedType: s.selectedType,
  selectedStyle: s.selectedStyle,
}));

export const useGalleryActions = () => useGalleryStore((s) => ({
  setMainTab: s.setMainTab,
  setContentType: s.setContentType,
  setSortBy: s.setSortBy,
  setGridSize: s.setGridSize,
  setSearchQuery: s.setSearchQuery,
  setShowFilters: s.setShowFilters,
  toggleFilters: s.toggleFilters,
  setSelectedType: s.setSelectedType,
  setSelectedStyle: s.setSelectedStyle,
  resetFilters: s.resetFilters,
}));
