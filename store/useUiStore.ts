'use client';

import { create } from "zustand";

type UiState = {
  isOpen: boolean;
  toggle: () => void;
  setIsOpen: (value: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsOpen: (value) => set({ isOpen: value }),
}));
