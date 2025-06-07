export interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  type: 'друг' | "возлюбленные" | 'враг' | 'родство' | 'союз' | 'бывший' | 'загадка' | 'ученик';
  notes?: string;
  created_at: string;
}
