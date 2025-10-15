export interface ArchiveUserSummary {
  id: number;
  username: string;
  display_name: string;
}

export interface ArchiveListItem {
  id: string;
  entry_id: number;
  form_type: string;
  form_code: string;
  form_title: string;
  form_number: string;
  project: string | null;
  created_at: string;
  created_by: ArchiveUserSummary | null;
  status: string;
  data: Record<string, unknown>;
}

export interface ArchiveFilters {
  project?: string;
  form_type?: string;
}
