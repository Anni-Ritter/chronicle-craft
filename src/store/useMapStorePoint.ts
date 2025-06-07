import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MapPoint } from '../types/mapPoint';

interface MapStorePoint {
    mapPoints: MapPoint[];
    fetchMapPoints: (userId: string, supabase: SupabaseClient) => Promise<void>;
    addMapPoint: (point: MapPoint, supabase: SupabaseClient) => Promise<void>;
    updateMapPoint: (point: MapPoint, supabase: SupabaseClient) => Promise<void>;
    deleteMapPoint: (id: string, supabase: SupabaseClient) => Promise<void>;
    clearMap: () => void;
}

export const useMapStorePoint = create<MapStorePoint>()(
    persist(
        (set, get) => ({
            mapPoints: [],

            fetchMapPoints: async (mapId, supabase) => {
                const { data, error } = await supabase
                    .from('map_points')
                    .select('*')
                    .eq('map_id', mapId);

                if (!error && data) {
                    set({ mapPoints: data as MapPoint[] });
                } else {
                    console.error('Ошибка загрузки точек карты:', error);
                }
            },

            addMapPoint: async (point, supabase) => {
                const { data, error } = await supabase
                    .from('map_points')
                    .insert([point])
                    .select();
                if (!error && data) {
                    set({ mapPoints: [...get().mapPoints, data[0]] });
                } else {
                    console.error('Ошибка добавления точки:', error);
                }
            },

            updateMapPoint: async (point, supabase) => {
                const { data, error } = await supabase
                    .from('map_points')
                    .update(point)
                    .eq('id', point.id)
                    .select();
                if (!error && data) {
                    set({
                        mapPoints: get().mapPoints.map((p) => (p.id === point.id ? data[0] : p)),
                    });
                } else {
                    console.error('Ошибка обновления точки:', error);
                }
            },

            deleteMapPoint: async (id, supabase) => {
                const { error } = await supabase
                    .from('map_points')
                    .delete()
                    .eq('id', id);
                if (!error) {
                    set({
                        mapPoints: get().mapPoints.filter((p) => p.id !== id),
                    });
                } else {
                    console.error('Ошибка удаления точки:', error);
                }
            },

            clearMap: () => set({ mapPoints: [] }),
        }),
        { name: 'map-points-store' }
    )
);
