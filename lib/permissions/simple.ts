import type {
  PermissionEntry,
  SimplePermissionKey,
  SimplePermissions,
} from "@/types/admin";
import { SIMPLE_PERMISSION_KEYS } from "@/types/admin";

export const defaultSimplePermissions = (): SimplePermissions => ({
  can_submit_forms: false,
  can_view_archive: false,
  can_edit_archive_entries: false,
  can_delete_archive_entries: false,
});

export const mapPermissionsToSimple = (
  permissions?: PermissionEntry[] | null,
): SimplePermissions => {
  const simple = defaultSimplePermissions();
  if (!permissions?.length) {
    return simple;
  }

  for (const permission of permissions) {
    switch (permission.resource) {
      case "forms":
        if (permission.can_create) {
          simple.can_submit_forms = true;
        }
        break;
      case "archive":
        if (permission.can_read) {
          simple.can_view_archive = true;
        }
        if (permission.can_update) {
          simple.can_edit_archive_entries = true;
        }
        if (permission.can_delete) {
          simple.can_delete_archive_entries = true;
        }
        break;
      default:
        break;
    }
  }

  if (simple.can_edit_archive_entries || simple.can_delete_archive_entries) {
    simple.can_view_archive = true;
  }

  return simple;
};

export const mapSimplePermsToLegacy = (
  simple: SimplePermissions,
  existing?: PermissionEntry[] | null,
): PermissionEntry[] => {
  const entries = new Map<string, PermissionEntry>();

  if (existing?.length) {
    existing.forEach((perm) => entries.set(perm.resource, { ...perm }));
  }

  entries.delete("forms");
  entries.delete("archive");

  if (simple.can_submit_forms) {
    entries.set("forms", {
      resource: "forms",
      can_create: true,
      can_read: true,
      can_update: false,
      can_delete: false,
    });
  }

  if (simple.can_view_archive || simple.can_edit_archive_entries || simple.can_delete_archive_entries) {
    entries.set("archive", {
      resource: "archive",
      can_create: false,
      can_read: true,
      can_update: simple.can_edit_archive_entries,
      can_delete: simple.can_delete_archive_entries,
    });
  }

  return Array.from(entries.values());
};

export const allSimplePermissionKeys: SimplePermissionKey[] = [...SIMPLE_PERMISSION_KEYS];
