import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { Character } from '../types/character';

interface CharacterStore {
    characters: Character[];
    fetchCharacters: (
        userId: string,
        supabase: SupabaseClient
    ) => Promise<{ error: PostgrestError | null }>;

    addCharacter: (
        char: Character,
        supabase: SupabaseClient
    ) => Promise<{ error: PostgrestError | null }>;

    removeCharacter: (
        id: string,
        supabase: SupabaseClient
    ) => Promise<{ error: PostgrestError | null }>;

    updateCharacter: (
        updated: Character,
        supabase: SupabaseClient
    ) => Promise<{ error: PostgrestError | null }>;

    clearCharacters: () => void;
}

export const useCharacterStore = create<CharacterStore>()(
    persist(
        (set, get) => ({
            characters: [],

            fetchCharacters: async (userId, supabase) => {
                const { data, error } = await supabase
                    .from('characters')
                    .select('*')
                    .eq('user_id', userId);

                if (!error) {
                    set({ characters: data as Character[] });
                }

                return { error };
            },

            addCharacter: async (char, supabase) => {
                const { data, error } = await supabase
                    .from('characters')
                    .insert([char])
                    .select();

                if (!error && data) {
                    set({ characters: [...get().characters, data[0]] });
                }

                return { error };
            },

            removeCharacter: async (id, supabase) => {
                const { error } = await supabase
                    .from('characters')
                    .delete()
                    .eq('id', id);

                if (!error) {
                    set({ characters: get().characters.filter((c) => c.id !== id) });
                }

                return { error };
            },

            updateCharacter: async (updated, supabase) => {
                const { data, error } = await supabase
                    .from('characters')
                    .update(updated)
                    .eq('id', updated.id)
                    .select();

                if (!error && data) {
                    set({
                        characters: get().characters.map((c) =>
                            c.id === updated.id ? data[0] : c
                        ),
                    });
                }

                return { error };
            },

            clearCharacters: () => set({ characters: [] }),
        }),
        {
            name: 'cc-characters-store',
        }
    )
);
