import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { Chronicle } from '../types/chronicle';

interface ChronicleStore {
    chronicles: Chronicle[];
    fetchChronicles: (supabase: SupabaseClient) => Promise<{ error: PostgrestError | null }>;
    addChronicle: (entry: Chronicle, supabase: SupabaseClient) => Promise<{ error: PostgrestError | null }>;
    updateChronicle: (updated: Chronicle, supabase: SupabaseClient) => Promise<{ error: PostgrestError | null }>;
    removeChronicle: (id: string, supabase: SupabaseClient) => Promise<{ error: PostgrestError | null }>;
    clearChronicles: () => void;
}

export const useChronicleStore = create<ChronicleStore>()(
    persist(
        (set, get) => ({
            chronicles: [],

            fetchChronicles: async (supabase) => {
                const { data, error } = await supabase.from('chronicles').select('*');
                if (!error && data) {
                    set({ chronicles: data as Chronicle[] });
                }
                return { error };
            },

            addChronicle: async (entry, supabase) => {
                const { data, error } = await supabase.from('chronicles').insert([entry]).select();
                if (!error && data) {
                    set({ chronicles: [...get().chronicles, data[0]] });
                }
                return { error };
            },

            updateChronicle: async (updated, supabase) => {
                const { data, error } = await supabase
                    .from('chronicles')
                    .update(updated)
                    .eq('id', updated.id)
                    .select();
                if (!error && data) {
                    set({
                        chronicles: get().chronicles.map((c) => (c.id === updated.id ? data[0] : c)),
                    });
                }
                return { error };
            },

            removeChronicle: async (id, supabase) => {
                const { error } = await supabase.from('chronicles').delete().eq('id', id);
                if (!error) {
                    set({
                        chronicles: get().chronicles.filter((c) => c.id !== id),
                    });
                }
                return { error };
            },

            clearChronicles: () => set({ chronicles: [] }),
        }),
        {
            name: 'cc-chronicles-store',
        }
    )
);
