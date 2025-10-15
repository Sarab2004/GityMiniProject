export interface SimplePermissions {
  can_submit_forms: boolean;
  can_view_archive: boolean;
  can_edit_archive_entries: boolean;
  can_delete_archive_entries: boolean;
}

export type SimplePermissionKey = keyof SimplePermissions;

export const SIMPLE_PERMISSION_KEYS: SimplePermissionKey[] = [
  "can_submit_forms",
  "can_view_archive",
  "can_edit_archive_entries",
  "can_delete_archive_entries",
];

export type Resource = "forms" | "actions" | "archive";

export interface PermissionEntry {
  resource: Resource;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface AdminUser {
  id: number;
  username: string;
  email?: string;
  is_active: boolean;
  display_name: string;
  role?: RoleCatalogEntry | null;
  reports_to_id?: number | null;
  permissions?: PermissionEntry[];
  simple_permissions?: SimplePermissions | null;
}

export interface OrgNode {
  id: number;
  display_name: string;
  parent_id?: number | null;
  level: number;
  role_slug?: string | null;
  role_label?: string | null;
  children?: OrgNode[];
}

export interface RoleCatalogEntry {
  slug: string;
  label: string;
  parent_slug?: string | null;
  is_unique: boolean;
}
