"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import OrgTree from "@/app/ui/admin/OrgTree";
import PermissionMatrix from "@/app/ui/admin/PermissionMatrix";
import ConfirmDialog from "@/app/ui/admin/ConfirmDialog";
import type { OrgNode, PermissionEntry, Resource, RoleCatalogEntry } from "@/types/admin";
import {
  createChildUser,
  deleteUserFromOrg,
  getOrgTree,
  getRoleCatalog,
  moveUser,
  renameUser,
} from "@/lib/api/admin";

const RESOURCES: Resource[] = ["forms", "actions", "archive"];

interface CreateChildState {
  username: string;
  password: string;
  role_slug: string;
  email: string;
  permissions: PermissionEntry[];
}

function defaultPermissions(): PermissionEntry[] {
  return RESOURCES.map((resource) => ({
    resource,
    can_create: false,
    can_read: false,
    can_update: false,
    can_delete: false,
  }));
}

function ensureTreeArray(data: OrgNode[] | OrgNode | undefined): OrgNode[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

function flattenTree(
  nodes: OrgNode[],
  acc: Array<{ id: number; display_name: string; level: number; role_slug?: string | null }> = [],
): Array<{ id: number; display_name: string; level: number; role_slug?: string | null }> {
  nodes.forEach((node) => {
    acc.push({
      id: node.id,
      display_name: node.display_name,
      level: node.level ?? 0,
      role_slug: node.role_slug ?? null,
    });
    if (node.children?.length) {
      flattenTree(node.children, acc);
    }
  });
  return acc;
}

export default function AdminOrganizationPage() {
  const [treeData, setTreeData] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addParentNode, setAddParentNode] = useState<OrgNode | null>(null);
  const [addForm, setAddForm] = useState<CreateChildState>({
    username: "",
    password: "",
    role_slug: "",
    email: "",
    permissions: defaultPermissions(),
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [renameNodeState, setRenameNodeState] = useState<OrgNode | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const [moveNodeState, setMoveNodeState] = useState<OrgNode | null>(null);
  const [moveParentId, setMoveParentId] = useState<number | null>(null);
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  const [roles, setRoles] = useState<RoleCatalogEntry[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [deleteNodeState, setDeleteNodeState] = useState<OrgNode | null>(null);
  const [deleteForce, setDeleteForce] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const actionPending =
    addLoading || renameLoading || moveLoading || deleteLoading;

  const flattenedNodes = useMemo(
    () => flattenTree(treeData),
    [treeData],
  );

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrgTree();
      setTreeData(ensureTreeArray(data));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load organization tree.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  useEffect(() => {
    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const data = await getRoleCatalog();
        setRoles(data);
        setRolesError(null);
      } catch (err) {
        setRolesError(
          err instanceof Error ? err.message : "Failed to load role catalog.",
        );
      } finally {
        setRolesLoading(false);
      }
    };
    loadRoles();
  }, []);

  const roleLookup = useMemo(() => {
    const map = new Map<string, RoleCatalogEntry>();
    roles.forEach((role) => map.set(role.slug, role));
    return map;
  }, [roles]);

  const assignedUniqueRoles = useMemo(() => {
    const result = new Set<string>();
    const traverse = (nodes: OrgNode[]) => {
      nodes.forEach((node) => {
        if (node.role_slug) {
          const role = roleLookup.get(node.role_slug);
          if (role?.is_unique) {
            result.add(node.role_slug);
          }
        }
        if (node.children?.length) {
          traverse(node.children);
        }
      });
    };
    traverse(treeData);
    return result;
  }, [treeData, roleLookup]);

  const addAllowedRoles = useMemo(() => {
    if (!addParentNode) {
      return roles;
    }
    const parentSlug = addParentNode.role_slug ?? null;
    return roles.filter((role) => role.parent_slug === parentSlug);
  }, [roles, addParentNode]);

  const noAddRolesAvailable =
    Boolean(addParentNode) && addAllowedRoles.length === 0;

  useEffect(() => {
    if (!addParentNode) {
      return;
    }
    if (addAllowedRoles.length === 0) {
      if (addForm.role_slug !== "") {
        setAddForm((prev) => ({ ...prev, role_slug: "" }));
      }
      return;
    }
    if (!addAllowedRoles.some((role) => role.slug === addForm.role_slug)) {
      setAddForm((prev) => ({ ...prev, role_slug: addAllowedRoles[0].slug }));
    }
  }, [addParentNode, addAllowedRoles, addForm.role_slug]);

  const addRoleSelectDisabled =
    rolesLoading || !addParentNode || addAllowedRoles.length === 0;

  const addParentRoleDefinition = addParentNode?.role_slug
    ? roleLookup.get(addParentNode.role_slug) ?? null
    : null;

  const handleOpenAddChild = (node: OrgNode) => {
    setAddParentNode(node);
    setAddForm({
      username: "",
      password: "",
      role_slug: "",
      email: "",
      permissions: defaultPermissions(),
    });
    setAddError(null);
  };

  const handleAddUsernameChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setAddForm((prev) => ({ ...prev, username: event.target.value }));
  };

  const handleAddPasswordChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setAddForm((prev) => ({ ...prev, password: event.target.value }));
  };

  const handleAddRoleChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setAddForm((prev) => ({ ...prev, role_slug: event.target.value }));
  };

  const handleAddEmailChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setAddForm((prev) => ({ ...prev, email: event.target.value }));
  };

const handleAddPermissionsChange = (permissions: PermissionEntry[]) => {
  setAddForm((prev) => ({ ...prev, permissions }));
};

  const handleRenameValueChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRenameValue(event.target.value);
  };

  const handleMoveParentChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const { value } = event.target;
    setMoveParentId(value ? Number(value) : null);
  };

  const handleDeleteForceChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDeleteForce(event.target.checked);
  };

  const handleSubmitAddChild = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!addParentNode) return;
    setAddLoading(true);
    setAddError(null);
    try {
      await createChildUser({
        parent_id: addParentNode.id,
        username: addForm.username.trim(),
        password: addForm.password,
        role_slug: addForm.role_slug,
        email: addForm.email.trim() || undefined,
        permissions: addForm.permissions,
      });
      setAddParentNode(null);
      await fetchTree();
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Failed to create subordinate.",
      );
    } finally {
      setAddLoading(false);
    }
  };

  const moveTargetRoleDefinition = moveNodeState?.role_slug
    ? roleLookup.get(moveNodeState.role_slug) ?? null
    : null;

  const moveExpectedParentSlug = moveTargetRoleDefinition?.parent_slug ?? null;

  const moveAllowedParents = useMemo(() => {
    if (!moveNodeState) {
      return [];
    }
    if (moveExpectedParentSlug === null) {
      return [];
    }
    return flattenedNodes.filter(
      (node) =>
        node.id !== moveNodeState.id &&
        node.role_slug === moveExpectedParentSlug,
    );
  }, [moveNodeState, moveExpectedParentSlug, flattenedNodes]);

  const moveParentRoleDefinition = moveExpectedParentSlug
    ? roleLookup.get(moveExpectedParentSlug) ?? null
    : null;

  const moveNoParentsAvailable =
    Boolean(moveNodeState) &&
    moveExpectedParentSlug !== null &&
    moveAllowedParents.length === 0;

  useEffect(() => {
    if (!moveNodeState) {
      return;
    }
    if (moveExpectedParentSlug === null) {
      if (moveParentId !== null) {
        setMoveParentId(null);
      }
      return;
    }
    if (
      moveParentId !== null &&
      !moveAllowedParents.some((node) => node.id === moveParentId)
    ) {
      setMoveParentId(
        moveAllowedParents.length ? moveAllowedParents[0].id : null,
      );
    }
  }, [
    moveNodeState,
    moveExpectedParentSlug,
    moveAllowedParents,
    moveParentId,
  ]);

  const moveRequiresParentSelection = moveExpectedParentSlug !== null;

  const moveSubmitDisabled =
    moveLoading ||
    (moveRequiresParentSelection &&
      (moveParentId === null || moveAllowedParents.length === 0));

  const handleOpenRename = (node: OrgNode) => {
    setRenameNodeState(node);
    setRenameValue(node.display_name);
    setRenameError(null);
  };

  const handleSubmitRename = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!renameNodeState) return;
    setRenameLoading(true);
    setRenameError(null);
    try {
      await renameUser(renameNodeState.id, renameValue.trim());
      setRenameNodeState(null);
      await fetchTree();
    } catch (err) {
      setRenameError(
        err instanceof Error ? err.message : "Failed to rename node.",
      );
    } finally {
      setRenameLoading(false);
    }
  };

  const handleOpenMove = (node: OrgNode) => {
    setMoveNodeState(node);
    setMoveParentId(node.parent_id ?? null);
    setMoveError(null);
  };

  const handleSubmitMove = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!moveNodeState) return;
    setMoveLoading(true);
    setMoveError(null);
    try {
      await moveUser(moveNodeState.id, moveParentId);
      setMoveNodeState(null);
      await fetchTree();
    } catch (err) {
      setMoveError(
        err instanceof Error ? err.message : "Failed to move node.",
      );
    } finally {
      setMoveLoading(false);
    }
  };

  const handleOpenDelete = (node: OrgNode) => {
    setDeleteNodeState(node);
    setDeleteForce(false);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteNodeState) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteUserFromOrg(deleteNodeState.id, deleteForce);
      setDeleteNodeState(null);
      await fetchTree();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete node.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const addDisabled =
    !addForm.username.trim() ||
    !addForm.password ||
    !addForm.role_slug ||
    noAddRolesAvailable ||
    rolesLoading ||
    addLoading;
  const renameDisabled = !renameValue.trim() || renameLoading;

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Organization Structure
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Browse the hierarchy and manage subordinates, renames, moves, and
            deletions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchTree()}
          className="inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
          disabled={loading}
        >
          Refresh Tree
        </button>
      </header>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">
            Loading organization tree...
          </div>
        ) : error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : treeData.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">
            No nodes found. Create users first to populate the hierarchy.
          </div>
        ) : (
          <OrgTree
            nodes={treeData}
            disabled={actionPending}
            onAddChild={handleOpenAddChild}
            onRename={handleOpenRename}
            onMove={handleOpenMove}
            onDelete={handleOpenDelete}
          />
        )}
      </div>

      {addParentNode ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Add Subordinate
                </h3>
                <p className="text-sm text-slate-600">
                  Parent node:&nbsp;
                  <span className="font-semibold text-slate-900">
                    {addParentNode.display_name}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddParentNode(null)}
                className="text-sm text-slate-500 hover:text-slate-700"
                disabled={addLoading}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSubmitAddChild} className="px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Username *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={addForm.username ?? ""}
                    onChange={handleAddUsernameChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Password *
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={addForm.password ?? ""}
                    onChange={handleAddPasswordChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    نقش *
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={addForm.role_slug ?? ""}
                    onChange={handleAddRoleChange}
                    disabled={addRoleSelectDisabled}
                    required
                  >
                    <option value="">
                      {rolesLoading
                        ? "در حال بارگذاری نقش‌ها..."
                        : noAddRolesAvailable
                        ? "هیچ نقشی برای این والد تعریف نشده است"
                        : "انتخاب نقش"}
                    </option>
                    {addAllowedRoles.map((role) => {
                      const disabled =
                        role.is_unique && assignedUniqueRoles.has(role.slug);
                      return (
                        <option key={role.slug} value={role.slug} disabled={disabled}>
                          {role.label}
                          {role.is_unique ? " (یکتا)" : ""}
                        </option>
                      );
                    })}
                  </select>
                  {addParentNode ? (
                    <p className="text-xs text-slate-500">
                      فقط نقش‌هایی که والد آن‌ها{" "}
                      {addParentNode.role_label ??
                        addParentRoleDefinition?.label ??
                        "—"}
                      است نمایش داده می‌شوند.
                    </p>
                  ) : null}
                  <p className="text-xs text-slate-500">
                    نام نمایش به‌صورت خودکار توسط سرور ساخته می‌شود.
                  </p>
                  {noAddRolesAvailable ? (
                    <p className="text-xs text-amber-600">
                      برای این والد نقشی تعریف نشده است؛ ابتدا والد یا ساختار
                      بالادستی را تکمیل کنید.
                    </p>
                  ) : null}
                  {rolesError ? (
                    <p className="text-sm text-rose-600">{rolesError}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={addForm.email ?? ""}
                    onChange={handleAddEmailChange}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">
                    Initial Permissions
                  </h4>
                  <span className="text-xs text-slate-500">
                    Toggle CRUD rights for each resource.
                  </span>
                </div>
                <PermissionMatrix
                  value={addForm.permissions}
                  onChange={handleAddPermissionsChange}
                />
              </div>

              {addError ? (
                <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {addError}
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddParentNode(null)}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  disabled={addLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={addDisabled}
                >
                  {addLoading ? "Saving..." : "Create subordinate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {renameNodeState ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Rename Node
              </h3>
              <button
                type="button"
                onClick={() => setRenameNodeState(null)}
                className="text-sm text-slate-500 hover:text-slate-700"
                disabled={renameLoading}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSubmitRename} className="space-y-4 px-6 py-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Display Name *
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={renameValue ?? ""}
                  onChange={handleRenameValueChange}
                  required
                />
              </div>

              {renameError ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {renameError}
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameNodeState(null)}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  disabled={renameLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={renameDisabled}
                >
                  {renameLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {moveNodeState ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Move Node
              </h3>
              <button
                type="button"
                onClick={() => setMoveNodeState(null)}
                className="text-sm text-slate-500 hover:text-slate-700"
                disabled={moveLoading}
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSubmitMove} className="space-y-4 px-6 py-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  New parent
                </label>
                <select
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={moveParentId === null ? "" : String(moveParentId)}
                  onChange={handleMoveParentChange}
                >
                  <option value="">
                    {moveExpectedParentSlug === null
                      ? "No parent (root)"
                      : moveNoParentsAvailable
                      ? "No eligible parent available"
                      : "Select parent"}
                  </option>
                  {moveAllowedParents.map((node) => (
                    <option
                      key={node.id}
                      value={node.id}
                      disabled={node.id === moveNodeState.id}
                    >
                      {`${"• ".repeat(node.level)}${node.display_name}`}
                    </option>
                  ))}
                </select>
              </div>

              {moveError ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {moveError}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  {moveExpectedParentSlug === null
                    ? "This role is defined as a root-level position. Choose the root option to detach it from any manager."
                    : moveNoParentsAvailable
                    ? "No eligible parent with the required role exists yet. Create the parent first, then retry."
                    : `Only nodes with role ${
                        moveParentRoleDefinition?.label ??
                        moveExpectedParentSlug
                      } can be selected as the parent.`}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMoveNodeState(null)}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  disabled={moveLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={moveSubmitDisabled}
                >
                  {moveLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteNodeState)}
        title="Delete Node"
        description="Soft delete will deactivate the user. Enable force delete to remove the node even if it has active children."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteNodeState(null);
          setDeleteForce(false);
          setDeleteError(null);
        }}
      >
        {deleteNodeState ? (
          <div className="space-y-4">
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                {deleteNodeState.display_name}
              </span>
              ?
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                checked={deleteForce}
                onChange={handleDeleteForceChange}
                disabled={deleteLoading}
              />
              Force delete (remove even if children exist)
            </label>
            {deleteError ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                {deleteError}
              </div>
            ) : null}
          </div>
        ) : null}
      </ConfirmDialog>
    </section>
  );
}
