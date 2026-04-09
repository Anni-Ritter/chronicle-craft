export type RoleplayMemberRole = 'owner' | 'member';
export type RoleplayMemberStatus = 'active' | 'invited' | 'blocked';
export type RoleplayMessageType = 'speech' | 'action' | 'narration' | 'system';

export interface RoleplaySpace {
    id: string;
    owner_id: string;
    world_id: string | null;
    title: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface RoleplaySpaceMember {
    id: string;
    space_id: string;
    user_id: string;
    role: RoleplayMemberRole;
    status: RoleplayMemberStatus;
    joined_at: string;
}

export interface RoleplaySpaceCharacter {
    id: string;
    space_id: string;
    character_id: string;
    added_by: string;
    created_at: string;
}

export interface RoleplayScene {
    id: string;
    user_id: string;
    space_id: string;
    created_by: string;
    world_id: string | null;
    chronicle_id: string | null;
    title: string;
    description: string | null;
    background_image: string | null;
    status: string;
    settings: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export interface SceneParticipant {
    id: string;
    scene_id: string;
    character_id: string;
    is_active: boolean;
    sort_order: number;
    joined_at: string;
}

export interface CharacterEmotion {
    id: string;
    character_id: string;
    name: string;
    image_url: string | null;
    thumbnail_url: string | null;
    sort_order: number;
    is_default: boolean;
    created_at: string;
}

export interface SceneMessage {
    id: string;
    scene_id: string;
    user_id: string;
    character_id: string | null;
    emotion_id: string | null;
    type: RoleplayMessageType;
    content: string;
    reply_to_message_id: string | null;
    metadata: Record<string, unknown> | null;
    edited: boolean;
    created_at: string;
    updated_at: string;
}

export interface RoleplayProfileLite {
    id: string;
    username: string | null;
    avatar_url: string | null;
}

export interface RoleplaySpaceWithMemberMeta extends RoleplaySpace {
    membership: RoleplaySpaceMember;
}

export interface RoleplaySpaceMemberView {
    member: RoleplaySpaceMember;
    profile: RoleplayProfileLite | null;
}

export interface RoleplaySpaceCharacterView {
    spaceCharacter: RoleplaySpaceCharacter;
    character: {
        id: string;
        user_id: string;
        name: string;
        avatar: string | null;
    };
    owner: RoleplayProfileLite | null;
}

export interface SceneParticipantView {
    participant: SceneParticipant;
    character: {
        id: string;
        user_id: string;
        name: string;
        avatar: string | null;
    };
}

export interface SceneMessageView {
    message: SceneMessage;
    author: RoleplayProfileLite | null;
    character: {
        id: string;
        user_id: string;
        name: string;
        avatar: string | null;
    } | null;
    emotion: CharacterEmotion | null;
    replyTo: Pick<SceneMessage, 'id' | 'content' | 'character_id' | 'type'> | null;
}
