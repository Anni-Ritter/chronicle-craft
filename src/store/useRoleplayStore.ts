import { create } from 'zustand';
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { Character } from '../types/character';
import type { Chronicle } from '../types/chronicle';
import type {
    CharacterEmotion,
    RoleplayMemberRole,
    RoleplayMemberStatus,
    RoleplayScene,
    RoleplaySpace,
    RoleplaySpaceCharacterView,
    RoleplaySpaceMemberView,
    RoleplaySpaceWithMemberMeta,
    SceneMessage,
    SceneMessageView,
    SceneParticipantView,
} from '../types/roleplay';

interface CreateRoleplaySpaceInput {
    title: string;
    description: string | null;
    world_id: string | null;
}

interface CreateRoleplaySceneInput {
    title: string;
    description: string | null;
    world_id: string | null;
    chronicle_id: string | null;
    background_image: string | null;
    status: string;
    settings: Record<string, unknown> | null;
}

interface CreateSceneMessageInput {
    scene_id: string;
    user_id: string;
    character_id: string | null;
    emotion_id: string | null;
    type: SceneMessage['type'];
    content: string;
    reply_to_message_id: string | null;
    metadata: Record<string, unknown> | null;
}

interface SpaceMembershipRow {
    id: string;
    space_id: string;
    user_id: string;
    role: RoleplayMemberRole;
    status: RoleplayMemberStatus;
    joined_at: string;
    roleplay_spaces: RoleplaySpace[] | null;
}

interface SpaceMemberRow {
    id: string;
    space_id: string;
    user_id: string;
    role: RoleplayMemberRole;
    status: RoleplayMemberStatus;
    joined_at: string;
}

interface SceneParticipantRow {
    id: string;
    scene_id: string;
    character_id: string;
    is_active: boolean;
    sort_order: number;
    joined_at: string;
    characters: Array<{
        id: string;
        user_id: string;
        name: string;
        avatar: string | null;
    }> | null;
}

interface SceneMessageRow {
    id: string;
    scene_id: string;
    user_id: string;
    character_id: string | null;
    emotion_id: string | null;
    type: SceneMessage['type'];
    content: string;
    reply_to_message_id: string | null;
    metadata: Record<string, unknown> | null;
    edited: boolean;
    created_at: string;
    updated_at: string;
}

interface RoleplayState {
    spaces: RoleplaySpaceWithMemberMeta[];
    membersBySpace: Record<string, RoleplaySpaceMemberView[]>;
    spaceCharactersBySpace: Record<string, RoleplaySpaceCharacterView[]>;
    scenesBySpace: Record<string, RoleplayScene[]>;
    sceneParticipantsByScene: Record<string, SceneParticipantView[]>;
    sceneMessagesByScene: Record<string, SceneMessageView[]>;
    emotionsByCharacter: Record<string, CharacterEmotion[]>;
    loading: boolean;
    error: string | null;
    setError: (error: string | null) => void;
    getRoleplaySpacesForCurrentUser: (userId: string, supabase: SupabaseClient) => Promise<void>;
    inviteUserToRoleplaySpace: (
        spaceId: string,
        inviterId: string,
        email: string,
        supabase: SupabaseClient
    ) => Promise<{ ok: boolean; error?: string }>;
    respondToRoleplayInvite: (
        spaceId: string,
        userId: string,
        action: 'accept' | 'decline',
        supabase: SupabaseClient
    ) => Promise<boolean>;
    updateRoleplayMemberRole: (
        spaceId: string,
        targetUserId: string,
        role: RoleplayMemberRole,
        supabase: SupabaseClient
    ) => Promise<boolean>;
    createRoleplaySpace: (input: CreateRoleplaySpaceInput, userId: string, supabase: SupabaseClient) => Promise<RoleplaySpace | null>;
    updateRoleplaySpace: (spaceId: string, input: Partial<CreateRoleplaySpaceInput>, supabase: SupabaseClient) => Promise<RoleplaySpace | null>;
    deleteRoleplaySpace: (spaceId: string, userId: string, supabase: SupabaseClient) => Promise<boolean>;
    getRoleplaySpaceById: (spaceId: string, supabase: SupabaseClient) => Promise<RoleplaySpace | null>;
    getRoleplaySpaceMembers: (spaceId: string, supabase: SupabaseClient) => Promise<RoleplaySpaceMemberView[]>;
    getRoleplaySpaceCharacters: (
        spaceId: string,
        supabase: SupabaseClient,
        worldIdOverride?: string | null
    ) => Promise<RoleplaySpaceCharacterView[]>;
    addOwnCharacterToSpace: (spaceId: string, characterId: string, userId: string, supabase: SupabaseClient) => Promise<boolean>;
    getRoleplayScenesBySpace: (spaceId: string, supabase: SupabaseClient) => Promise<RoleplayScene[]>;
    createRoleplayScene: (spaceId: string, userId: string, input: CreateRoleplaySceneInput, supabase: SupabaseClient) => Promise<RoleplayScene | null>;
    updateRoleplayScene: (sceneId: string, input: Partial<CreateRoleplaySceneInput>, supabase: SupabaseClient) => Promise<RoleplayScene | null>;
    deleteRoleplayScene: (sceneId: string, spaceId: string, supabase: SupabaseClient) => Promise<boolean>;
    getSceneParticipants: (sceneId: string, supabase: SupabaseClient) => Promise<SceneParticipantView[]>;
    addSceneParticipant: (sceneId: string, characterId: string, supabase: SupabaseClient) => Promise<boolean>;
    getSceneMessages: (sceneId: string, supabase: SupabaseClient) => Promise<SceneMessageView[]>;
    createSceneMessage: (input: CreateSceneMessageInput, supabase: SupabaseClient) => Promise<SceneMessage | null>;
    updateSceneMessage: (messageId: string, updates: Partial<Pick<SceneMessage, 'content' | 'edited' | 'emotion_id' | 'metadata'>>, supabase: SupabaseClient) => Promise<SceneMessage | null>;
    deleteSceneMessage: (messageId: string, supabase: SupabaseClient) => Promise<boolean>;
    getCharacterEmotions: (characterId: string, supabase: SupabaseClient) => Promise<CharacterEmotion[]>;
    createCharacterEmotion: (
        input: {
            character_id: string;
            name: string;
            image_url: string | null;
            thumbnail_url: string | null;
            sort_order: number;
            is_default: boolean;
        },
        supabase: SupabaseClient
    ) => Promise<CharacterEmotion | null>;
    deleteCharacterEmotion: (emotionId: string, characterId: string, supabase: SupabaseClient) => Promise<boolean>;
    subscribeToSceneMessages: (
        sceneId: string,
        supabase: SupabaseClient,
        onIncoming: (messages: SceneMessageView[]) => void
    ) => () => void;
}

export const useRoleplayStore = create<RoleplayState>((set, get) => ({
    spaces: [],
    membersBySpace: {},
    spaceCharactersBySpace: {},
    scenesBySpace: {},
    sceneParticipantsByScene: {},
    sceneMessagesByScene: {},
    emotionsByCharacter: {},
    loading: false,
    error: null,
    setError: (error) => set({ error }),

    getRoleplaySpacesForCurrentUser: async (userId, supabase) => {
        set({ loading: true, error: null });
        const { data, error } = await supabase
            .from('roleplay_space_members')
            .select('id, space_id, user_id, role, status, joined_at')
            .eq('user_id', userId)
            .neq('status', 'blocked');

        if (error) {
            set({ error: error.message, loading: false });
            return;
        }

        const memberRows = (data ?? []) as Array<Pick<SpaceMembershipRow, 'id' | 'space_id' | 'user_id' | 'role' | 'status' | 'joined_at'>>;
        const spaceIds = memberRows.map((row) => row.space_id);

        if (spaceIds.length === 0) {
            set({ spaces: [], loading: false });
            return;
        }

        const { data: spacesData, error: spacesError } = await supabase
            .from('roleplay_spaces')
            .select('id, owner_id, world_id, title, description, created_at, updated_at')
            .in('id', spaceIds);

        if (spacesError) {
            set({ error: spacesError.message, loading: false });
            return;
        }

        const spacesMap = new Map((spacesData ?? []).map((space) => [space.id, space as RoleplaySpace]));
        const mapped = memberRows
            .map((row) => {
                const space = spacesMap.get(row.space_id);
                if (!space) return null;
                return {
                    ...space,
                    membership: {
                        id: row.id,
                        space_id: row.space_id,
                        user_id: row.user_id,
                        role: row.role as RoleplayMemberRole,
                        status: row.status as RoleplayMemberStatus,
                        joined_at: row.joined_at,
                    },
                } as RoleplaySpaceWithMemberMeta;
            })
            .filter(Boolean) as RoleplaySpaceWithMemberMeta[];

        mapped.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        set({ spaces: mapped, loading: false });
    },

    inviteUserToRoleplaySpace: async (spaceId, inviterId, email, supabase) => {
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
            const message = 'Пользователь с таким email не найден или недоступен по политике доступа';
            set({ error: message });
            return { ok: false, error: message };
        }

        if (profile.id === inviterId) {
            const message = 'Нельзя пригласить самого себя';
            set({ error: message });
            return { ok: false, error: message };
        }

        const { data: existing } = await supabase
            .from('roleplay_space_members')
            .select('id, status')
            .eq('space_id', spaceId)
            .eq('user_id', profile.id)
            .maybeSingle();

        if (existing?.id) {
            if (existing.status === 'active') {
                const message = 'Пользователь уже состоит в пространстве';
                set({ error: message });
                return { ok: false, error: message };
            }
            const { error: updateError } = await supabase
                .from('roleplay_space_members')
                .update({ status: 'invited', role: 'member' })
                .eq('id', existing.id);
            if (updateError) {
                set({ error: updateError.message });
                return { ok: false, error: updateError.message };
            }
            return { ok: true };
        }

        const { error } = await supabase
            .from('roleplay_space_members')
            .insert([{ space_id: spaceId, user_id: profile.id, role: 'member', status: 'invited' }]);

        if (error) {
            set({ error: error.message });
            return { ok: false, error: error.message };
        }
        return { ok: true };
    },

    respondToRoleplayInvite: async (spaceId, userId, action, supabase) => {
        const nextStatus = action === 'accept' ? 'active' : 'blocked';
        const { error } = await supabase
            .from('roleplay_space_members')
            .update({ status: nextStatus })
            .eq('space_id', spaceId)
            .eq('user_id', userId);
        if (error) {
            set({ error: error.message });
            return false;
        }
        return true;
    },

    updateRoleplayMemberRole: async (spaceId, targetUserId, role, supabase) => {
        const { error } = await supabase
            .from('roleplay_space_members')
            .update({ role })
            .eq('space_id', spaceId)
            .eq('user_id', targetUserId);
        if (error) {
            set({ error: error.message });
            return false;
        }
        await get().getRoleplaySpaceMembers(spaceId, supabase);
        return true;
    },

    createRoleplaySpace: async (input, userId, supabase) => {
        set({ loading: true, error: null });
        const { data, error } = await supabase
            .from('roleplay_spaces')
            .insert([{ ...input, owner_id: userId }])
            .select('*')
            .single();

        if (error || !data) {
            set({ error: error?.message ?? 'Не удалось создать пространство', loading: false });
            return null;
        }

        const { error: memberError } = await supabase.from('roleplay_space_members').insert([
            {
                space_id: data.id,
                user_id: userId,
                role: 'owner',
                status: 'active',
            },
        ]);

        if (memberError) {
            set({ error: memberError.message, loading: false });
            return null;
        }

        set({ loading: false });
        await get().getRoleplaySpacesForCurrentUser(userId, supabase);
        return data as RoleplaySpace;
    },

    updateRoleplaySpace: async (spaceId, input, supabase) => {
        const payload: Partial<CreateRoleplaySpaceInput> = {};
        if (typeof input.title === 'string') payload.title = input.title;
        if (input.description !== undefined) payload.description = input.description;
        if (input.world_id !== undefined) payload.world_id = input.world_id;

        const { data, error } = await supabase
            .from('roleplay_spaces')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', spaceId)
            .select('*')
            .single();

        if (error || !data) {
            set({ error: error?.message ?? 'Не удалось обновить пространство' });
            return null;
        }
        return data as RoleplaySpace;
    },

    deleteRoleplaySpace: async (spaceId, userId, supabase) => {
        const { error } = await supabase.from('roleplay_spaces').delete().eq('id', spaceId);
        if (error) {
            set({ error: error.message });
            return false;
        }
        await get().getRoleplaySpacesForCurrentUser(userId, supabase);
        return true;
    },

    getRoleplaySpaceById: async (spaceId, supabase) => {
        const { data, error } = await supabase
            .from('roleplay_spaces')
            .select('*')
            .eq('id', spaceId)
            .single();
        if (error) {
            set({ error: error.message });
            return null;
        }
        return data as RoleplaySpace;
    },

    getRoleplaySpaceMembers: async (spaceId, supabase) => {
        const { data, error } = await supabase
            .from('roleplay_space_members')
            .select('id, space_id, user_id, role, status, joined_at')
            .eq('space_id', spaceId)
            .order('joined_at', { ascending: true });

        if (error) {
            set({ error: error.message });
            return [];
        }

        const memberRows = (data ?? []) as SpaceMemberRow[];
        const userIds = Array.from(new Set(memberRows.map((row) => row.user_id)));
        const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);
        const profilesMap = new Map((profilesData ?? []).map((profile) => [profile.id, profile]));

        const members = memberRows.map((row) => ({
            member: {
                id: row.id,
                space_id: row.space_id,
                user_id: row.user_id,
                role: row.role as RoleplayMemberRole,
                status: row.status as RoleplayMemberStatus,
                joined_at: row.joined_at,
            },
            profile: profilesMap.get(row.user_id) ?? null,
        })) as RoleplaySpaceMemberView[];

        set((s) => ({
            membersBySpace: {
                ...s.membersBySpace,
                [spaceId]: members,
            },
        }));
        return members;
    },

    getRoleplaySpaceCharacters: async (spaceId, supabase, worldIdOverride) => {
        const { data: spaceRow, error: spaceError } = await supabase
            .from('roleplay_spaces')
            .select('world_id')
            .eq('id', spaceId)
            .maybeSingle();
        if (spaceError) {
            set({ error: spaceError.message });
            return [];
        }

        let charactersQuery = supabase
            .from('characters')
            .select('id, user_id, name, avatar, created_at, world_id')
            .order('name', { ascending: true });

        const effectiveWorldId = worldIdOverride !== undefined ? worldIdOverride : (spaceRow?.world_id ?? null);

        if (effectiveWorldId) {
            charactersQuery = charactersQuery.eq('world_id', effectiveWorldId);
        }

        const { data: charactersData, error: charactersError } = await charactersQuery;
        if (charactersError) {
            set({ error: charactersError.message });
            return [];
        }

        const ownerIds = Array.from(new Set((charactersData ?? []).map((character) => character.user_id)));
        const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', ownerIds);
        const profilesMap = new Map((profilesData ?? []).map((profile) => [profile.id, profile]));

        const characters = (charactersData ?? []).map((rowCharacter) => {
            const syntheticId = `space:${spaceId}:character:${rowCharacter.id}`;
            return {
                spaceCharacter: {
                    id: syntheticId,
                    space_id: spaceId,
                    character_id: rowCharacter.id,
                    added_by: rowCharacter.user_id,
                    created_at: rowCharacter.created_at ?? new Date().toISOString(),
                },
                character: {
                    id: rowCharacter.id,
                    user_id: rowCharacter.user_id,
                    name: rowCharacter.name,
                    avatar: rowCharacter.avatar ?? null,
                },
                owner: profilesMap.get(rowCharacter.user_id) ?? null,
            };
        }) as RoleplaySpaceCharacterView[];

        set((s) => ({
            spaceCharactersBySpace: {
                ...s.spaceCharactersBySpace,
                [spaceId]: characters,
            },
        }));
        return characters;
    },

    addOwnCharacterToSpace: async (spaceId, characterId, userId, supabase) => {
        const { data: characterData, error: charError } = await supabase
            .from('characters')
            .select('id, user_id')
            .eq('id', characterId)
            .single();
        if (charError || !characterData || characterData.user_id !== userId) {
            set({ error: 'Можно добавлять только своих персонажей' });
            return false;
        }

        const { error } = await supabase.from('roleplay_space_characters').insert([
            {
                space_id: spaceId,
                character_id: characterId,
                added_by: userId,
            },
        ]);
        if (error) {
            set({ error: error.message });
            return false;
        }

        await get().getRoleplaySpaceCharacters(spaceId, supabase);
        return true;
    },

    getRoleplayScenesBySpace: async (spaceId, supabase) => {
        const { data, error } = await supabase
            .from('roleplay_scenes')
            .select('*')
            .eq('space_id', spaceId)
            .order('updated_at', { ascending: false });

        if (error) {
            set({ error: error.message });
            return [];
        }

        const scenes = (data ?? []) as RoleplayScene[];
        set((s) => ({
            scenesBySpace: {
                ...s.scenesBySpace,
                [spaceId]: scenes,
            },
        }));
        return scenes;
    },

    createRoleplayScene: async (spaceId, userId, input, supabase) => {
        const now = new Date().toISOString();
        const payload: Record<string, unknown> = {
            space_id: spaceId,
            user_id: userId,
            created_by: userId,
            title: input.title,
            status: input.status,
            created_at: now,
            updated_at: now,
        };

        if (input.description !== null) payload.description = input.description;
        if (input.world_id !== null) payload.world_id = input.world_id;
        if (input.chronicle_id !== null) payload.chronicle_id = input.chronicle_id;
        if (input.background_image !== null) payload.background_image = input.background_image;
        payload.settings = input.settings ?? {};

        const { data, error } = await supabase
            .from('roleplay_scenes')
            .insert([payload])
            .select('*')
            .single();
        if (error || !data) {
            const details = [error?.message, error?.details, error?.hint]
                .filter(Boolean)
                .join(' | ');
            set({ error: details || 'Не удалось создать сцену' });
            return null;
        }

        await get().getRoleplayScenesBySpace(spaceId, supabase);
        return data as RoleplayScene;
    },

    updateRoleplayScene: async (sceneId, input, supabase) => {
        const payload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (input.title !== undefined) payload.title = input.title;
        if (input.description !== undefined) payload.description = input.description;
        if (input.world_id !== undefined) payload.world_id = input.world_id;
        if (input.chronicle_id !== undefined) payload.chronicle_id = input.chronicle_id;
        if (input.background_image !== undefined) payload.background_image = input.background_image;
        if (input.status !== undefined) payload.status = input.status;
        if (input.settings !== undefined) payload.settings = input.settings ?? {};

        const { data, error } = await supabase
            .from('roleplay_scenes')
            .update(payload)
            .eq('id', sceneId)
            .select('*')
            .single();

        if (error || !data) {
            const details = [error?.message, error?.details, error?.hint]
                .filter(Boolean)
                .join(' | ');
            set({ error: details || 'Не удалось обновить сцену' });
            return null;
        }

        const spaceId = (data as RoleplayScene).space_id;
        await get().getRoleplayScenesBySpace(spaceId, supabase);
        return data as RoleplayScene;
    },

    deleteRoleplayScene: async (sceneId, spaceId, supabase) => {
        const { error } = await supabase.from('roleplay_scenes').delete().eq('id', sceneId);
        if (error) {
            set({ error: error.message });
            return false;
        }
        await get().getRoleplayScenesBySpace(spaceId, supabase);
        return true;
    },

    getSceneParticipants: async (sceneId, supabase) => {
        const { data, error } = await supabase
            .from('scene_participants')
            .select(`
                id, scene_id, character_id, is_active, sort_order, joined_at,
                characters:character_id(id, user_id, name, avatar)
            `)
            .eq('scene_id', sceneId)
            .order('sort_order', { ascending: true });

        if (error) {
            set({ error: error.message });
            return [];
        }

        const participants = ((data ?? []) as unknown as SceneParticipantRow[]).map((row) => {
            const rowCharacter = Array.isArray(row.characters) ? row.characters[0] : null;
            if (!rowCharacter) {
                return null;
            }
            return {
                participant: {
                    id: row.id,
                    scene_id: row.scene_id,
                    character_id: row.character_id,
                    is_active: row.is_active,
                    sort_order: row.sort_order ?? 0,
                    joined_at: row.joined_at,
                },
                character: {
                    id: rowCharacter.id,
                    user_id: rowCharacter.user_id,
                    name: rowCharacter.name,
                    avatar: rowCharacter.avatar ?? null,
                },
            };
        }).filter(Boolean) as SceneParticipantView[];

        set((s) => ({
            sceneParticipantsByScene: {
                ...s.sceneParticipantsByScene,
                [sceneId]: participants,
            },
        }));
        return participants;
    },

    addSceneParticipant: async (sceneId, characterId, supabase) => {
        const { data: sceneData, error: sceneError } = await supabase
            .from('roleplay_scenes')
            .select('id, space_id')
            .eq('id', sceneId)
            .single();
        if (sceneError || !sceneData) {
            set({ error: sceneError?.message ?? 'Сцена не найдена' });
            return false;
        }

        const { data: inSpace, error: inSpaceError } = await supabase
            .from('roleplay_space_characters')
            .select('id')
            .eq('space_id', sceneData.space_id)
            .eq('character_id', characterId)
            .single();
        if (inSpaceError || !inSpace) {
            set({ error: 'Можно добавлять только персонажей пространства' });
            return false;
        }

        const { error } = await supabase.from('scene_participants').insert([
            {
                scene_id: sceneId,
                character_id: characterId,
                is_active: true,
                sort_order: 0,
            },
        ]);

        if (error) {
            set({ error: error.message });
            return false;
        }

        await get().getSceneParticipants(sceneId, supabase);
        return true;
    },

    getSceneMessages: async (sceneId, supabase) => {
        const { data, error } = await supabase
            .from('scene_messages')
            .select('id, scene_id, user_id, character_id, emotion_id, type, content, reply_to_message_id, metadata, edited, created_at, updated_at')
            .eq('scene_id', sceneId)
            .order('created_at', { ascending: true });

        if (error) {
            set({ error: error.message });
            return [];
        }

        const rows = (data ?? []) as SceneMessageRow[];
        const authorIds = Array.from(new Set(rows.map((row) => row.user_id)));
        const characterIds = Array.from(new Set(rows.map((row) => row.character_id).filter(Boolean))) as string[];
        const emotionIds = Array.from(new Set(rows.map((row) => row.emotion_id).filter(Boolean))) as string[];

        const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', authorIds);
        const profilesMap = new Map((profilesData ?? []).map((profile) => [profile.id, profile]));

        const { data: charactersData } = await supabase
            .from('characters')
            .select('id, user_id, name, avatar')
            .in('id', characterIds);
        const charactersMap = new Map((charactersData ?? []).map((character) => [character.id, character]));

        const { data: emotionsData } = await supabase
            .from('character_emotions')
            .select('id, character_id, name, image_url, thumbnail_url, sort_order, is_default, created_at')
            .in('id', emotionIds);
        const emotionsMap = new Map((emotionsData ?? []).map((emotion) => [emotion.id, emotion]));

        const baseMessages = rows.map((row) => {
            const rowProfile = profilesMap.get(row.user_id) ?? null;
            const rowCharacter = row.character_id ? charactersMap.get(row.character_id) ?? null : null;
            const rowEmotion = row.emotion_id ? emotionsMap.get(row.emotion_id) ?? null : null;
            return {
            message: {
                id: row.id,
                scene_id: row.scene_id,
                user_id: row.user_id,
                character_id: row.character_id,
                emotion_id: row.emotion_id,
                type: row.type,
                content: row.content,
                reply_to_message_id: row.reply_to_message_id,
                metadata: row.metadata,
                edited: row.edited,
                created_at: row.created_at,
                updated_at: row.updated_at,
            } as SceneMessage,
            author: rowProfile
                ? {
                    id: rowProfile.id,
                    username: rowProfile.username,
                    avatar_url: rowProfile.avatar_url,
                }
                : null,
            character: rowCharacter
                ? {
                    id: rowCharacter.id,
                    user_id: rowCharacter.user_id,
                    name: rowCharacter.name,
                    avatar: rowCharacter.avatar ?? null,
                }
                : null,
            emotion: rowEmotion
                ? {
                    id: rowEmotion.id,
                    character_id: rowEmotion.character_id,
                    name: rowEmotion.name,
                    image_url: rowEmotion.image_url,
                    thumbnail_url: rowEmotion.thumbnail_url,
                    sort_order: rowEmotion.sort_order ?? 0,
                    is_default: !!rowEmotion.is_default,
                    created_at: rowEmotion.created_at,
                }
                : null,
        };
        });

        const byId = new Map(baseMessages.map((item) => [item.message.id, item]));
        const messages = baseMessages.map((item) => ({
            ...item,
            replyTo: item.message.reply_to_message_id
                ? byId.get(item.message.reply_to_message_id)?.message ?? null
                : null,
        })) as SceneMessageView[];

        set((s) => ({
            sceneMessagesByScene: {
                ...s.sceneMessagesByScene,
                [sceneId]: messages,
            },
        }));

        return messages;
    },

    createSceneMessage: async (input, supabase) => {
        const now = new Date().toISOString();
        const payload = {
            scene_id: input.scene_id,
            user_id: input.user_id,
            character_id: input.character_id,
            emotion_id: input.emotion_id,
            type: input.type,
            content: input.content,
            reply_to_message_id: input.reply_to_message_id,
            metadata: input.metadata ?? {},
            edited: false,
            created_at: now,
            updated_at: now,
        };

        const { data, error } = await supabase
            .from('scene_messages')
            .insert([payload])
            .select('*')
            .single();
        if (error || !data) {
            const details = [error?.message, error?.details, error?.hint]
                .filter(Boolean)
                .join(' | ');
            set({ error: details || 'Не удалось отправить сообщение' });
            return null;
        }
        return data as SceneMessage;
    },

    updateSceneMessage: async (messageId, updates, supabase) => {
        const { data, error } = await supabase
            .from('scene_messages')
            .update(updates)
            .eq('id', messageId)
            .select('*')
            .single();
        if (error || !data) {
            set({ error: error?.message ?? 'Не удалось обновить сообщение' });
            return null;
        }
        return data as SceneMessage;
    },

    deleteSceneMessage: async (messageId, supabase) => {
        const { error } = await supabase
            .from('scene_messages')
            .delete()
            .eq('id', messageId);
        if (error) {
            set({ error: error.message });
            return false;
        }
        return true;
    },

    getCharacterEmotions: async (characterId, supabase) => {
        const { data, error } = await supabase
            .from('character_emotions')
            .select('*')
            .eq('character_id', characterId)
            .order('sort_order', { ascending: true });
        if (error) {
            set({ error: error.message });
            return [];
        }
        const emotions = (data ?? []) as CharacterEmotion[];
        set((s) => ({
            emotionsByCharacter: {
                ...s.emotionsByCharacter,
                [characterId]: emotions,
            },
        }));
        return emotions;
    },

    createCharacterEmotion: async (input, supabase) => {
        const { data, error } = await supabase
            .from('character_emotions')
            .insert([input])
            .select('*')
            .single();
        if (error || !data) {
            set({ error: error?.message ?? 'Не удалось создать эмоцию' });
            return null;
        }
        await get().getCharacterEmotions(input.character_id, supabase);
        return data as CharacterEmotion;
    },

    deleteCharacterEmotion: async (emotionId, characterId, supabase) => {
        const { error } = await supabase
            .from('character_emotions')
            .delete()
            .eq('id', emotionId);
        if (error) {
            set({ error: error.message });
            return false;
        }
        await get().getCharacterEmotions(characterId, supabase);
        return true;
    },

    subscribeToSceneMessages: (sceneId, supabase, onIncoming) => {
        let channel: RealtimeChannel | null = supabase
            .channel(`roleplay-scene-${sceneId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'scene_messages', filter: `scene_id=eq.${sceneId}` },
                async () => {
                    const messages = await get().getSceneMessages(sceneId, supabase);
                    onIncoming(messages);
                }
            )
            .subscribe();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
                channel = null;
            }
        };
    },
}));

export const getOwnCharactersInSpace = (
    allCharactersInSpace: RoleplaySpaceCharacterView[],
    userId: string
): Character[] =>
    allCharactersInSpace
        .filter((item) => item.character.user_id === userId)
        .map((item) => ({
            id: item.character.id,
            user_id: item.character.user_id,
            name: item.character.name,
            avatar: item.character.avatar ?? undefined,
            bio: '',
            attributes: {
                strength: 0,
                intelligence: 0,
                magic: 0,
                charisma: 0,
                dexterity: 0,
                endurance: 0,
            },
            linked_characters: [],
            linked_locations: [],
            created_at: new Date().toISOString(),
            world_id: null,
        }));

export const buildSceneChronicleOptions = (chronicles: Chronicle[]) =>
    chronicles.map((chronicle) => ({
        value: chronicle.id,
        label: chronicle.title || 'Без названия',
    }));
