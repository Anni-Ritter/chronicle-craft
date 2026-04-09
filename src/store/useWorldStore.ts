import { create } from 'zustand';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { World, WorldMemberRole, WorldMemberStatus, WorldMemberView } from '../types/world';

interface WorldStore {
    worlds: World[];
    membersByWorld: Record<string, WorldMemberView[]>;
    invitedWorlds: World[];
    error: string | null;
    fetchWorlds: (userId: string, supabase: SupabaseClient) => Promise<void>;
    fetchWorldMembers: (worldId: string, supabase: SupabaseClient) => Promise<WorldMemberView[]>;
    inviteUserToWorld: (
        worldId: string,
        inviterId: string,
        email: string,
        supabase: SupabaseClient
    ) => Promise<{ ok: boolean; error?: string }>;
    respondToWorldInvite: (
        worldId: string,
        userId: string,
        action: 'accept' | 'decline',
        supabase: SupabaseClient
    ) => Promise<boolean>;
    updateWorldMemberRole: (
        worldId: string,
        targetUserId: string,
        role: WorldMemberRole,
        supabase: SupabaseClient
    ) => Promise<boolean>;
    addWorld: (world: Omit<World, 'id' | 'created_at'>, supabase: SupabaseClient) => Promise<void>;
    updateWorld: (world: World, supabase: SupabaseClient) => Promise<void>;
    removeWorld: (worldId: string, supabase: SupabaseClient) => Promise<void>;
}

export const useWorldStore = create<WorldStore>((set, get) => ({
    worlds: [],
    membersByWorld: {},
    invitedWorlds: [],
    error: null,

    fetchWorlds: async (userId, supabase) => {
        const { data: memberships, error: membershipError } = await supabase
            .from('world_members')
            .select('world_id, status')
            .eq('user_id', userId)
            .neq('status', 'blocked');

        if (membershipError) {
            set({ error: membershipError.message });
            return;
        }

        const rows = memberships ?? [];
        const worldIds = Array.from(new Set(rows.map((row) => row.world_id)));
        if (worldIds.length === 0) {
            set({ worlds: [], invitedWorlds: [], error: null });
            return;
        }

        const { data: worldsData, error } = await supabase
            .from('worlds')
            .select('*')
            .in('id', worldIds)
            .order('created_at', { ascending: true });

        if (error || !worldsData) {
            set({ error: error?.message ?? 'Не удалось загрузить миры' });
            return;
        }

        const invitedIds = new Set(
            rows.filter((row) => row.status === 'invited').map((row) => row.world_id)
        );
        const active = worldsData.filter((world) => !invitedIds.has(world.id)) as World[];
        const invited = worldsData.filter((world) => invitedIds.has(world.id)) as World[];
        set({ worlds: active, invitedWorlds: invited, error: null });
    },

    fetchWorldMembers: async (worldId, supabase) => {
        const { data, error } = await supabase
            .from('world_members')
            .select('id, world_id, user_id, role, status, joined_at')
            .eq('world_id', worldId)
            .order('joined_at', { ascending: true });

        if (error) {
            set({ error: error.message });
            return [];
        }

        const memberRows = (data ?? []) as Array<{
            id: string;
            world_id: string;
            user_id: string;
            role: WorldMemberRole;
            status: WorldMemberStatus;
            joined_at: string;
        }>;
        const userIds = Array.from(new Set(memberRows.map((row) => row.user_id)));
        const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, email')
            .in('id', userIds);
        const profilesMap = new Map((profilesData ?? []).map((profile) => [profile.id, profile]));

        const members = memberRows.map((row) => ({
            member: row,
            profile: profilesMap.get(row.user_id) ?? null,
        })) as WorldMemberView[];

        set((s) => ({
            membersByWorld: {
                ...s.membersByWorld,
                [worldId]: members,
            },
        }));
        return members;
    },

    inviteUserToWorld: async (worldId, inviterId, email, supabase) => {
        const normalized = email.trim().toLowerCase();
        if (!normalized) {
            const message = 'Укажите email для приглашения';
            set({ error: message });
            return { ok: false, error: message };
        }

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', normalized)
            .maybeSingle();

        if (profileError || !profile) {
            const message = 'Пользователь с таким email не найден';
            set({ error: message });
            return { ok: false, error: message };
        }

        if (profile.id === inviterId) {
            const message = 'Нельзя пригласить самого себя';
            set({ error: message });
            return { ok: false, error: message };
        }

        const { data: existing } = await supabase
            .from('world_members')
            .select('id, status')
            .eq('world_id', worldId)
            .eq('user_id', profile.id)
            .maybeSingle();

        if (existing?.id) {
            if (existing.status === 'active') {
                const message = 'Пользователь уже состоит в мире';
                set({ error: message });
                return { ok: false, error: message };
            }
            const { error: updateError } = await supabase
                .from('world_members')
                .update({ status: 'invited', role: 'member' })
                .eq('id', existing.id);
            if (updateError) {
                set({ error: updateError.message });
                return { ok: false, error: updateError.message };
            }
            await get().fetchWorldMembers(worldId, supabase);
            return { ok: true };
        }

        const { error: insertError } = await supabase
            .from('world_members')
            .insert([{ world_id: worldId, user_id: profile.id, role: 'member', status: 'invited' }]);

        if (insertError) {
            set({ error: insertError.message });
            return { ok: false, error: insertError.message };
        }
        await get().fetchWorldMembers(worldId, supabase);
        return { ok: true };
    },

    respondToWorldInvite: async (worldId, userId, action, supabase) => {
        const nextStatus: WorldMemberStatus = action === 'accept' ? 'active' : 'blocked';
        const { error } = await supabase
            .from('world_members')
            .update({ status: nextStatus })
            .eq('world_id', worldId)
            .eq('user_id', userId);
        if (error) {
            set({ error: error.message });
            return false;
        }
        await get().fetchWorlds(userId, supabase);
        return true;
    },

    updateWorldMemberRole: async (worldId, targetUserId, role, supabase) => {
        const { data, error } = await supabase
            .from('world_members')
            .update({ role })
            .eq('world_id', worldId)
            .eq('user_id', targetUserId)
            .select('id, role')
            .maybeSingle();
        if (error) {
            set({ error: error.message });
            return false;
        }
        if (!data || data.role !== role) {
            set({ error: 'Не удалось применить роль (доступ ограничен политикой)' });
            return false;
        }
        await get().fetchWorldMembers(worldId, supabase);
        return true;
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
