export interface Chronicle {
    id: string;
    title: string;
    content: string;
    created_at: string;
    event_date: string;      
    mood?: string;
    tags: string[];
    linked_characters: string[];
    linked_locations: string[];
}
