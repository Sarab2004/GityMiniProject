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
import { ApiError } from "@/lib/api/_client";

const RESOURCES: Resource[] = ["forms", "actions", "archive"];

interface CreateChildState {
  username: string;
  password: string;
  role_slug: string;
  email: string;
  permissions: PermissionEntry[];
}

function defaultمجوزها(): PermissionEntry[] {
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
    permissions: defaultمجوزها(),
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

  const formatError = (err: unknown, fallback: string): string => {
    if (err instanceof ApiError) {
      if (err.messages.length > 0) {
        return err.messages.join(" / ");
      }
      return err.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return fallback;
  };

  const fetchTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrgTree();
      setTreeData(ensureTreeArray(data));
    } catch (err) {
      setError(formatError(err, "دریافت ساختار سازمانی با خطا مواجه شد."));
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
        setRolesError(formatError(err, "دریافت فهرست نقش‌ها با خطا مواجه شد."));
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
      return roles.filter(
        (role) =>
          role.parent_slug === null &&
          (!role.is_unique || !assignedUniqueRoles.has(role.slug)),
      );
    }
    const parentSlug = addParentNode.role_slug ?? null;
    return roles.filter(
      (role) =>
        role.parent_slug === parentSlug &&
        (!role.is_unique || !assignedUniqueRoles.has(role.slug)),
    );
  }, [roles, addParentNode, assignedUniqueRoles]);

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
      permissions: defaultمجوزها(),
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

const handleAddمجوزهاChange = (permissions: PermissionEntry[]) => {
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
    const selectedRole = addForm.role_slug
      ? roleLookup.get(addForm.role_slug) ?? null
      : null;
    if (!selectedRole) {
      setAddLoading(false);
      setAddError("ابتدا نقش معتبر برای کاربر انتخاب کنید.");
      return;
    }
    if (selectedRole.is_unique && assignedUniqueRoles.has(selectedRole.slug)) {
      const uniqueMessage =
        selectedRole.slug === "hse_manager"
          ? "مدیر HSE فقط یک بار مجاز است."
          : "این نقش تنها برای یک کاربر قابل تخصیص است.";
      setAddLoading(false);
      setAddError(uniqueMessage);
      return;
    }
    const parentSlug = addParentNode.role_slug ?? null;
    if ((selectedRole.parent_slug ?? null) !== parentSlug) {
      setAddLoading(false);
      const expectedParentLabel =
        selectedRole.parent_slug &&
        (roleLookup.get(selectedRole.parent_slug)?.label ??
          selectedRole.parent_slug);
      setAddError(
        expectedParentLabel
          ? `این نقش باید زیر مدیر با نقش «${expectedParentLabel}» قرار بگیرد.`
          : "این نقش در سطح ریشه قرار می‌گیرد و نباید مدیر انتخاب شود.",
      );
      return;
    }

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
      setAddError(formatError(err, "ایجاد کاربر زیرمجموعه با خطا روبه‌رو شد."));
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
      setRenameError(formatError(err, "تغییر نام گره با خطا روبه‌رو شد."));
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
    const expectedParent = moveExpectedParentSlug;
    if (expectedParent !== null && moveParentId === null) {
      const expectedLabel =
        moveParentRoleDefinition?.label ?? expectedParent;
      setMoveLoading(false);
      setMoveError(
        `لطفاً مدیری با نقش «${expectedLabel}» را انتخاب کنید.`,
      );
      return;
    }
    if (
      moveParentId !== null &&
      !moveAllowedParents.some((node) => node.id === moveParentId)
    ) {
      const expectedLabel =
        moveParentRoleDefinition?.label ?? expectedParent;
      setMoveLoading(false);
      setMoveError(
        `مدیر انتخاب‌شده قابل قبول نیست. نقش مجاز: «${expectedLabel}».`,
      );
      return;
    }
    try {
      await moveUser(moveNodeState.id, moveParentId);
      setMoveNodeState(null);
      await fetchTree();
    } catch (err) {
      setMoveError(formatError(err, "جابجایی کاربر با خطا روبه‌رو شد."));
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
      setDeleteError(formatError(err, "حذف کاربر از ساختار سازمانی با خطا مواجه شد."));
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
            ساختار سازمانی
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            ساختار سازمانی را مشاهده و کاربران را مدیریت کنید.
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
            در حال بارگذاری ساختار سازمانی...
          </div>
        ) : error ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : treeData.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">
            هیچ گره‌ای یافت نشد؛ ابتدا کاربرانی ایجاد کنید.
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-[95vw] rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10 sm:max-w-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  افزودن زیرمجموعه
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
                بستن
              </button>
            </div>
            <form onSubmit={handleSubmitAddChild} className="px-4 py-4 sm:px-6 sm:py-6">
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
                    Initial مجوزها
                  </h4>
                  <span className="text-xs text-slate-500">
                    دسترسی‌های هر منبع را تنظیم کنید.
                  </span>
                </div>
                <PermissionMatrix
                  value={addForm.permissions}
                  onChange={handleAddمجوزهاChange}
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
                  className="min-h-[44px] rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  disabled={addLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={addDisabled}
                >
                  {addLoading ? "در حال ذخیره..." : "Create subordinate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {renameNodeState ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Rename Node
              </h3>
              <button
                type="button"
                onClick={() => setRenameNodeState(null)}
                className="text-sm text-slate-500 hover:text-slate-700"
                disabled={renameLoading}
              >
                بستن
              </button>
            </div>
            <form onSubmit={handleSubmitRename} className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
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
                  className="min-h-[44px] rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  disabled={renameLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={renameDisabled}
                >
                  {renameLoading ? "در حال ذخیره..." : "ذخیره"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {moveNodeState ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Move Node
              </h3>
              <button
                type="button"
                onClick={() => setMoveNodeState(null)}
                className="text-sm text-slate-500 hover:text-slate-700"
                disabled={moveLoading}
              >
                بستن
              </button>
            </div>
            <form onSubmit={handleSubmitMove} className="space-y-4 px-4 py-4 sm:px-6 sm:py-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  مدیر جدید
                </label>
                <select
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={moveParentId === null ? "" : String(moveParentId)}
                  onChange={handleMoveParentChange}
                >
                  <option value="">
                    {moveExpectedParentSlug === null
                      ? "بدون مدیر (سطح ریشه)"
                      : moveNoParentsAvailable
                      ? "مدیر سازگار موجود نیست"
                      : "انتخاب مدیر"}
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
                    ? "این نقش در سطح ریشه تعریف شده است؛ برای جدا کردن از هر مدیری، گزینه بدون مدیر را انتخاب کنید."
                    : moveNoParentsAvailable
                    ? "هنوز مدیری با نقش موردنیاز ایجاد نشده است. ابتدا مدیر مربوطه را بسازید و سپس دوباره تلاش کنید."
                    : `فقط کاربرانی با نقش «${
                        moveParentRoleDefinition?.label ??
                        moveExpectedParentSlug
                      }» می‌توانند به‌عنوان مدیر انتخاب شوند.`}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMoveNodeState(null)}
                  className="min-h-[44px] rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  disabled={moveLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={moveSubmitDisabled}
                >
                  {moveLoading ? "در حال ذخیره..." : "ذخیره"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteNodeState)}
        title="حذف کاربر سازمانی"
        description="حذف نرم کاربر را غیرفعال می‌کند. برای حذف کامل حتی با زیرمجموعه، گزینه حذف قطعی را فعال کنید."
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
              حذف قطعی (حتی در صورت وجود زیرمجموعه)
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
