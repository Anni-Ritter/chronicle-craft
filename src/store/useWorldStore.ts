import { create } from 'zustand';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { World } from '../types/world';

interface WorldStore {
    worlds: World[];
    fetchWorlds: (userId: string, supabase: SupabaseClient) => Promise<void>;
    addWorld: (world: Omit<World, 'id' | 'created_at'>, supabase: SupabaseClient) => Promise<void>;
    updateWorld: (world: World, supabase: SupabaseClient) => Promise<void>;
    removeWorld: (worldId: string, supabase: SupabaseClient) => Promise<void>;
}

export const useWorldStore = create<WorldStore>((set) => ({
    worlds: [],

    fetchWorlds: async (userId, supabase) => {
        const { data, error } = await supabase
            .from('worlds')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (!error && data) {
            set({ worlds: data });
        }
    },

    addWorld: async (worldData, supabase) => {
        const { data, error } = await supabase
            .from('worlds')
            .insert([worldData])
            .select();

        if (!error && data) {
            set((s) => ({ worlds: [...s.worlds, ...data] }));
        }
    },
    updateWorld: async (updatedWorld, supabase) => {
        const { data, error } = await supabase
            .from('worlds')
            .update({
                name: updatedWorld.name,
                description: updatedWorld.description,
                calendar: updatedWorld.calendar,
                details: updatedWorld.details,
            })
            .eq('id', updatedWorld.id)
            .select();

        if (!error && data?.[0]) {
            set((s) => ({
                worlds: s.worlds.map((w) =>
                    w.id === updatedWorld.id ? data[0] : w
                ),
            }));
        }
    },

    removeWorld: async (worldId, supabase) => {
        const { error } = await supabase
            .from('worlds')
            .delete()
            .eq('id', worldId);

        if (!error) {
            set((s) => ({
                worlds: s.worlds.filter((w) => w.id !== worldId),
            }));
        }
    },
}));
