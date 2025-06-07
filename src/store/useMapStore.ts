import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DBMap } from '../types/DBMap';

interface MapDataStore {
    maps: DBMap[];
    activeMapId: string | null;
    fetchMaps: (userId: string, supabase: SupabaseClient) => Promise<void>;
    setActiveMap: (mapId: string) => void;
    deleteMap: (mapId: string, supabase: SupabaseClient) => Promise<void>;
}

export const useMapStore = create<MapDataStore>()(
    persist(
        (set, get) => ({
            maps: [],
            activeMapId: null,

            fetchMaps: async (userId, supabase) => {
                const { data, error } = await supabase
                    .from('maps')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (!error && data) {
                    set({ maps: data });
                } else {
                    console.error('Ошибка загрузки карт:', error);
                }
            },

            setActiveMap: (mapId) => {
                set({ activeMapId: mapId });
            },

            deleteMap: async (mapId, supabase) => {
                const { error } = await supabase.from('maps').delete().eq('id', mapId);
                if (!error) {
                    set({ maps: get().maps.filter((m) => m.id !== mapId) });
                } else {
                    console.error('Ошибка удаления карты:', error);
                }
            },
        }),
        { name: 'maps-store' }
    )
);
