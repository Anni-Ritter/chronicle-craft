export interface DBMap {
    id: string;
    user_id: string;
    name: string;
    territory: string;
    image_path: string;
    created_at: string;
    world_id?: string | null;
}
