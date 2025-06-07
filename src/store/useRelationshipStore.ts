import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import type { Relationship } from '../types/relationshipType';

interface RelationshipStore {
    relationships: Relationship[];
    fetchRelationships: (
        supabase: SupabaseClient
    ) => Promise<{ error: PostgrestError | null }>;

    addRelationship: (
        relationship: Relationship,
        supabase: SupabaseClient
    ) => Promise<{ error: PostgrestError | null }>;

    removeRelationship: (
        id: string,
        supabase: SupabaseClient
    ) => Promise<{ error: PostgrestError | null }>;

    updateRelationship: (
        updated: Relationship,
        supabase: SupabaseClient
    ) => Promise<{ error: PostgrestError | null }>;

    clearRelationships: () => void;
}

export const useRelationshipStore = create<RelationshipStore>()(
    persist(
        (set, get) => ({
            relationships: [],

            fetchRelationships: async (supabase) => {
                const { data, error } = await supabase
                    .from('relationships')
                    .select('*');

                if (!error && data) {
                    set({ relationships: data as Relationship[] });
                }

                return { error };
            },

            addRelationship: async (relationship, supabase) => {
                const { data, error } = await supabase
                    .from('relationships')
                    .insert([relationship])
                    .select();

                if (!error && data) {
                    set({ relationships: [...get().relationships, data[0]] });
                }

                return { error };
            },

            removeRelationship: async (id, supabase) => {
                const { error } = await supabase
                    .from('relationships')
                    .delete()
                    .eq('id', id);

                if (!error) {
                    set({
                        relationships: get().relationships.filter((rel) => rel.id !== id),
                    });
                }

                return { error };
            },

            updateRelationship: async (updated, supabase) => {
                const { data, error } = await supabase
                    .from('relationships')
                    .update(updated)
                    .eq('id', updated.id)
                    .select();

                if (!error && data) {
                    set({
                        relationships: get().relationships.map((rel) =>
                            rel.id === updated.id ? data[0] : rel
                        ),
                    });
                }

                return { error };
            },

            clearRelationships: () => set({ relationships: [] }),
        }),
        {
            name: 'cc-relationships-store',
        }
    )
);
