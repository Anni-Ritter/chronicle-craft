export interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  type: string;
  color: string;
  notes?: string;
  created_at: string;
}
