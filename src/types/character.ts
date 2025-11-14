export interface ExtraField {
    id: string;
    key: string;
    value: string;
};

export interface Character {
    id: string;
    user_id: string;
    name: string;
    avatar?: string;
    age?: string;
    birthday?: string;
    occupation?: string;
    affiliation?: string;
    title?: string;
    bio: string;
    attributes: {
        strength: number;
        intelligence: number;
        magic: number;
        charisma: number;
        dexterity: number;
        endurance: number;
    };
    status?: string;
    species?: string;
    gender?: string;
    origin?: {
        name: string;
    };
    location?: {
        name: string;
    };
    episode?: string[];
    linked_chronicles?: string[];
    created_at?: string;
    extra?: ExtraField[];
    world_id?: string | null;
};