export type ExtraField = {
  id: string;
  key: string;
  value: string;
};

export type Character = {
    id: string;
    user_id: string;
    name: string;
    avatar?: string;
    bio: string;
    attributes: {
        strength: number;
        intelligence: number;
        magic: number;
        charisma: number;
        dexterity: number;
        endurance: number;
    };
    status: string;
    species: string;
    gender: string;
    origin: {
        name: string;
    };
    location: {
        name: string;
    };
    episode?: string[];
    created_at?: string;
    extra?: ExtraField[];
};