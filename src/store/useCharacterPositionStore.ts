import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';

interface CharacterPosition {
    id?: string;
    user_id: string;
    character_id: string;
    graph_type: string;
    position_x: number;
    position_y: number;
    updated_at?: string;
}

interface CharacterPositionStore {
    positions: Record<string, { x: number; y: number }>;

    fetchPositions: (
        userId: string,
        graphType: string,
        supabase: SupabaseClient
    ) => Promise<{ error: PostgrestError | null }>;

    savePosition: (
        characterId: string,
        pos: { x: number; y: number },
        userId: string,
        graphType: string,
        supabase: SupabaseClient
    ) => Promise<{ error: PostgrestError | null }>;

    setPosition: (characterId: string, pos: { x: number; y: number }) => void;

    clearPositions: () => void;
}

export const useCharacterPositionStore = create<CharacterPositionStore>()(
    persist(
        (set) => ({
            positions: {},

            fetchPositions: async (userId, graphType, supabase) => {
                const { data, error } = await supabase
                    .from('character_positions')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('graph_type', graphType);

                if (!error && data) {
                    const mapped = Object.fromEntries(
                        data.map((item) => [
                            item.character_id,
                            { x: item.position_x, y: item.position_y }
                        ])
                    );
                    set({ positions: mapped });
                }

                return { error };
            },

            savePosition: async (characterId, pos, userId, graphType, supabase) => {
                const payload: CharacterPosition = {
                    character_id: characterId,
                    user_id: userId,
                    graph_type: graphType,
                    position_x: pos.x,
                    position_y: pos.y
                };

                const { error } = await supabase
                    .from('character_positions')
                    .upsert(payload, {
                        onConflict: 'user_id,character_id,graph_type'
                    });

                return { error };
            },

            setPosition: (characterId, pos) => {
                set((state) => ({
                    positions: {
                        ...state.positions,
                        [characterId]: pos
                    }
                }));
            },

            clearPositions: () => set({ positions: {} })
        }),
        {
            name: 'cc-character-positions-store'
        }
    )
);
