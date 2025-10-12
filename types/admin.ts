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
  reports_to_id?: number | null;
  permissions: PermissionEntry[];
}

export interface OrgNode {
  id: number;
  display_name: string;
  parent_id?: number | null;
  level: number;
  children?: OrgNode[];
}
