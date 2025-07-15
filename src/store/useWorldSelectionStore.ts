import { create } from 'zustand';

interface WorldSelectionStore {
    selectedWorldId: string | null;
    setSelectedWorldId: (id: string | null) => void;
}

export const useWorldSelectionStore = create<WorldSelectionStore>((set) => ({
    selectedWorldId: null,
    setSelectedWorldId: (id) => set({ selectedWorldId: id }),
}));
