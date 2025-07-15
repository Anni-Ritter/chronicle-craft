import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { DBMap } from '../types/DBMap';

interface MapDataStore {
    maps: DBMap[];
    activeMapId: string | null;
    fetchMaps: (userId: string, supabase: SupabaseClient, worldId?: string | null) => Promise<void>;
    setActiveMap: (mapId: string) => void;
    deleteMap: (mapId: string, supabase: SupabaseClient) => Promise<void>;
}

export const useMapStore = create<MapDataStore>()(
    persist(
        (set, get) => ({
            maps: [],
            activeMapId: null,

            fetchMaps: async (userId, supabase, worldId) => {
                let query = supabase
                    .from('maps')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (worldId) {
                    query = query.eq('world_id', worldId);
                }

                const { data, error } = await query;

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
                const map = get().maps.find((m) => m.id === mapId);
                if (!map) return;
                const { error: storageError } = await supabase
                    .storage
                    .from('map')
                    .remove([map.image_path]);

                const { error: dbError } = await supabase
                    .from('maps')
                    .delete()
                    .eq('id', mapId);

                if (!storageError && !dbError) {
                    set({ maps: get().maps.filter((m) => m.id !== mapId) });
                } else {
                    console.error('Ошибка удаления карты:', { storageError, dbError });
                }
            }
        }),
        { name: 'maps-store' }
    )
);
