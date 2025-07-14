import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Relationship } from '../types/relationshipType';

interface DraftRelationshipStore {
    draftRelationships: Relationship[];
    setDraftRelationships: (rels: Relationship[]) => void;
}

export const useDraftRelationshipStore = create<DraftRelationshipStore>()(
    persist(
        (set) => ({
            draftRelationships: [],
            setDraftRelationships: (rels) => set({ draftRelationships: rels })
        }),
        {
            name: 'cc-draft-relationships',
        }
    )
);
