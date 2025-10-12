import { apiDelete, apiGet, apiPatch, apiPost, basePrefix } from "./_client";
import {
  AdminUser,
  OrgNode,
  PermissionEntry,
  Resource,
} from "../../types/admin";

export type PermissionMatrix = Record<
  Resource,
  {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  }
>;

const ensureLeadingSlash = (value: string) =>
  value.startsWith("/") ? value : `/${value}`;

function buildAdminPath(path: string): string {
  const base = basePrefix();
  const suffix = ensureLeadingSlash(path);
  if (base.endsWith("/admin")) {
    return suffix;
  }
  return `/admin${suffix}`;
}

function buildAuthPath(path: string): string {
  const base = basePrefix();
  const suffix = ensureLeadingSlash(path);
  if (base.endsWith("/auth")) {
    return suffix;
  }
  return `/auth${suffix}`;
}

export async function getAdminUsers(search?: string): Promise<AdminUser[]> {
  const params = search && search.trim().length > 0 ? { search: search.trim() } : undefined;
  return apiGet<AdminUser[]>(buildAdminPath("/users/"), params);
}

export interface CreateAdminUserPayload {
  username: string;
  password: string;
  display_name: string;
  email?: string;
  reports_to_id?: number | null;
  permissions?: PermissionEntry[];
}

export async function createAdminUser(
  payload: CreateAdminUserPayload,
): Promise<AdminUser> {
  const body: Record<string, unknown> = {
    username: payload.username,
    password: payload.password,
    display_name: payload.display_name,
  };

  if (payload.email !== undefined) {
    body.email = payload.email;
  }
  if (payload.reports_to_id !== undefined) {
    body.reports_to_id = payload.reports_to_id;
  }
  if (payload.permissions !== undefined) {
    body.permissions = payload.permissions;
  }

  return apiPost<AdminUser>(buildAdminPath("/users/"), body);
}

export type UpdateAdminUserPayload = Partial<{
  display_name: string;
  permissions: PermissionEntry[];
}>;

export async function updateAdminUser(
  id: number,
  payload: UpdateAdminUserPayload,
): Promise<AdminUser> {
  const body: Record<string, unknown> = {};
  if (payload.display_name !== undefined) {
    body.display_name = payload.display_name;
  }
  if (payload.permissions !== undefined) {
    body.permissions = payload.permissions;
  }

  return apiPatch<AdminUser>(buildAdminPath(`/users/${id}/`), body);
}

export async function deleteAdminUser(id: number, hard?: boolean): Promise<void> {
  const params = hard ? { hard: true } : undefined;
  await apiDelete<void>(buildAdminPath(`/users/${id}/`), params);
}

export async function getOrgTree(
  rootOnly?: boolean,
): Promise<OrgNode[] | OrgNode> {
  const params = rootOnly ? { root_only: true } : undefined;
  return apiGet<OrgNode[] | OrgNode>(buildAdminPath("/org/tree/"), params);
}

export interface CreateChildUserPayload {
  parent_id: number;
  username: string;
  password: string;
  display_name: string;
  email?: string;
  permissions?: PermissionEntry[];
}

export async function createChildUser(
  payload: CreateChildUserPayload,
): Promise<OrgNode> {
  const body: Record<string, unknown> = {
    parent_id: payload.parent_id,
    username: payload.username,
    password: payload.password,
    display_name: payload.display_name,
  };

  if (payload.email !== undefined) {
    body.email = payload.email;
  }
  if (payload.permissions !== undefined) {
    body.initial_permissions = payload.permissions;
  }

  return apiPost<OrgNode>(buildAdminPath("/org/children/"), body);
}

export async function moveUser(
  userId: number,
  newParentId: number | null,
): Promise<OrgNode> {
  const body = { parent_id: newParentId };
  return apiPatch<OrgNode>(buildAdminPath(`/org/${userId}/move/`), body);
}

export async function renameUser(
  userId: number,
  display_name: string,
): Promise<OrgNode> {
  return apiPatch<OrgNode>(buildAdminPath(`/org/${userId}/rename/`), {
    display_name,
  });
}

export async function deleteUserFromOrg(
  userId: number,
  force?: boolean,
): Promise<void> {
  const params = force ? { force: true } : undefined;
  await apiDelete<void>(buildAdminPath(`/org/${userId}/`), params);
}

export async function getMyPermissions(): Promise<PermissionMatrix> {
  return apiGet<PermissionMatrix>(buildAuthPath("/me/permissions/"));
}
