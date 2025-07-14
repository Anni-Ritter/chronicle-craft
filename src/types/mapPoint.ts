export type IconType = "default" | "camp" | "city" | "temple" | "treasure";

export interface MapPoint {
    id: string;
    name: string;
    x: number;
    y: number;
    linked_characters: string[];
    linked_chronicles: string[];
    created_at: string;
    user_id: string;
    map_id: string;
    description?: string;
    icon_type: IconType;
}

