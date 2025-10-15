"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  getRoleCatalog,
  updateAdminUser,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/_client";
import type {
  AdminUser,
  PermissionEntry,
  Resource,
  RoleCatalogEntry,
} from "@/types/admin";
import PermissionMatrix from "@/app/ui/admin/PermissionMatrix";
import ConfirmDialog from "@/app/ui/admin/ConfirmDialog";

const RESOURCES: Resource[] = ["forms", "actions", "archive"];

interface CreateFormState {
  username: string;
  password: string;
  email: string;
  role_slug: string;
  reports_to_id: number | null;
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

function ensurePermissions(
  permissions?: PermissionEntry[],
): PermissionEntry[] {
  if (!permissions?.length) {
    return defaultPermissions();
  }
  const map = new Map<Resource, PermissionEntry>();
  permissions.forEach((entry) => map.set(entry.resource, entry));
  return RESOURCES.map((resource) => ({
    resource,
    can_create: map.get(resource)?.can_create ?? false,
    can_read: map.get(resource)?.can_read ?? false,
    can_update: map.get(resource)?.can_update ?? false,
    can_delete: map.get(resource)?.can_delete ?? false,
  }));
}

function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 500);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>({
    username: "",
    password: "",
    email: "",
    role_slug: "",
    reports_to_id: null,
  });
  const [createPermissions, setCreatePermissions] = useState<
    PermissionEntry[]
  >(defaultPermissions);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editRoleSlug, setEditRoleSlug] = useState("");
  const [editPermissions, setEditPermissions] = useState<PermissionEntry[]>(
    defaultPermissions,
  );
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [roles, setRoles] = useState<RoleCatalogEntry[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [deleteUserState, setDeleteUserState] = useState<AdminUser | null>(
    null,
  );
  const [deleteHard, setDeleteHard] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const managerLookup = useMemo(() => {
    const map = new Map<number, AdminUser>();
    users.forEach((user) => map.set(user.id, user));
    return map;
  }, [users]);

  const assignedUniqueRoles = useMemo(() => {
    const set = new Set<string>();
    users.forEach((user) => {
      if (user.role?.slug && user.role.is_unique) {
        set.add(user.role.slug);
      }
    });
    return set;
  }, [users]);

  const roleLookup = useMemo(() => {
    const map = new Map<string, RoleCatalogEntry>();
    roles.forEach((role) => map.set(role.slug, role));
    return map;
  }, [roles]);

  const selectedCreateRole = createForm.role_slug
    ? roleLookup.get(createForm.role_slug) ?? null
    : null;

  const requiredParentRole = selectedCreateRole?.parent_slug
    ? roleLookup.get(selectedCreateRole.parent_slug) ?? null
    : null;

  const createParentOptions = useMemo(() => {
    if (!selectedCreateRole) {
      return [];
    }
    const parentSlug = selectedCreateRole.parent_slug;
    if (!parentSlug) {
      return [];
    }
    return users.filter(
      (user) =>
        user.is_active &&
        user.role?.slug === parentSlug,
    );
  }, [users, selectedCreateRole]);

  const requiresParentSelection = Boolean(selectedCreateRole?.parent_slug);
  const createParentDisabled =
    rolesLoading ||
    !selectedCreateRole ||
    !requiresParentSelection ||
    createParentOptions.length === 0;

  useEffect(() => {
    if (!selectedCreateRole || !selectedCreateRole.parent_slug) {
      if (createForm.reports_to_id !== null) {
        setCreateForm((prev) => ({ ...prev, reports_to_id: null }));
      }
      return;
    }
    if (createParentOptions.length === 0) {
      if (createForm.reports_to_id !== null) {
        setCreateForm((prev) => ({ ...prev, reports_to_id: null }));
      }
      return;
    }
    if (
      createParentOptions.length > 0 &&
      !createParentOptions.some((option) => option.id === createForm.reports_to_id)
    ) {
      setCreateForm((prev) => ({ ...prev, reports_to_id: null }));
    }
    if (
      createParentOptions.length === 1 &&
      createParentOptions[0].id !== createForm.reports_to_id
    ) {
      setCreateForm((prev) => ({
        ...prev,
        reports_to_id: createParentOptions[0].id,
      }));
    }
  }, [
    selectedCreateRole,
    createParentOptions,
    createForm.reports_to_id,
    setCreateForm,
  ]);

  const createParentValue =
    createForm.reports_to_id === null ? "" : String(createForm.reports_to_id);

  const formatError = (err: unknown, fallback: string) => {
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

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers(
        debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
      );
      setUsers(data);
    } catch (err) {
      setError(formatError(err, "دریافت لیست کاربران با خطا مواجه شد."));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const data = await getRoleCatalog();
        setRoles(data);
        setRolesError(null);
      } catch (err) {
        setRolesError(formatError(err, "دریافت نقش‌ها با خطا مواجه شد."));
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const handleOpenCreate = () => {
    setCreateForm({
      username: "",
      password: "",
      email: "",
      role_slug: "",
      reports_to_id: null,
    });
    setCreatePermissions(defaultPermissions());
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleUsernameChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { value } = event.target;
    setCreateForm((prev) => ({ ...prev, username: value }));
  };

  const handlePasswordChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { value } = event.target;
    setCreateForm((prev) => ({ ...prev, password: value }));
  };

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    setCreateForm((prev) => ({
      ...prev,
      role_slug: value,
      reports_to_id: null,
    }));
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setCreateForm((prev) => ({ ...prev, email: value }));
  };

  const handleReportsToChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const { value } = event.target;
    setCreateForm((prev) => ({
      ...prev,
      reports_to_id: value ? Number(value) : null,
    }));
  };

  const handleSubmitCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);

    const selectedRole = createForm.role_slug
      ? roleLookup.get(createForm.role_slug) ?? null
      : null;

    if (!selectedRole) {
      setCreateError("برای افزودن کاربر باید یک نقش معتبر انتخاب کنید.");
      return;
    }

    if (selectedRole.is_unique && assignedUniqueRoles.has(selectedRole.slug)) {
      const uniqueMessage =
        selectedRole.slug === "hse_manager"
          ? "مدیر HSE فقط یک بار مجاز است."
          : "این نقش تنها برای یک کاربر قابل تخصیص است.";
      setCreateError(uniqueMessage);
      return;
    }

    if (selectedRole.parent_slug) {
      if (createParentOptions.length === 0) {
        const expectedLabel =
          roleLookup.get(selectedRole.parent_slug)?.label ??
          selectedRole.parent_slug;
        setCreateError(
          `ابتدا باید مدیری با نقش «${expectedLabel}» در ساختار وجود داشته باشد.`,
        );
        return;
      }
      if (
        createForm.reports_to_id === null ||
        !createParentOptions.some(
          (candidate) => candidate.id === createForm.reports_to_id,
        )
      ) {
        const expectedLabel =
          roleLookup.get(selectedRole.parent_slug)?.label ??
          selectedRole.parent_slug;
        setCreateError(
          `لطفاً مدیری با نقش «${expectedLabel}» را برای این کاربر انتخاب کنید.`,
        );
        return;
      }
    } else if (createForm.reports_to_id !== null) {
      setCreateForm((prev) => ({ ...prev, reports_to_id: null }));
    }

    setCreateLoading(true);
    try {
      await createAdminUser({
        username: createForm.username.trim(),
        password: createForm.password,
        role_slug: createForm.role_slug,
        email: createForm.email.trim() || undefined,
        reports_to_id: createForm.reports_to_id ?? undefined,
        permissions: createPermissions,
      });
      setIsCreateOpen(false);
      await loadUsers();
    } catch (err) {
      setCreateError(formatError(err, "افزودن کاربر جدید با خطا مواجه شد."));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditUser(user);
    setEditRoleSlug(user.role?.slug ?? "");
    setEditPermissions(ensurePermissions(user.permissions));
    setEditError(null);
  };

  const handleEditRoleChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const { value } = event.target;
    setEditRoleSlug(value);
  };

  const handleSubmitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await updateAdminUser(editUser.id, {
        role_slug: editRoleSlug,
        permissions: editPermissions,
      });
      setEditUser(null);
      setEditRoleSlug("");
      await loadUsers();
    } catch (err) {
      setEditError(formatError(err, "به‌روزرسانی کاربر با خطا مواجه شد."));
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteUserState) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteAdminUser(deleteUserState.id, deleteHard);
      setDeleteUserState(null);
      setDeleteHard(false);
      await loadUsers();
    } catch (err) {
      setDeleteError(formatError(err, "حذف کاربر با خطا مواجه شد."));
    } finally {
      setDeleteLoading(false);
    }
  };

  const missingRequiredParent =
    requiresParentSelection && createForm.reports_to_id === null;

  const createDisabled =
    !createForm.username.trim() ||
    !createForm.password ||
    !createForm.role_slug ||
    missingRequiredParent ||
    createLoading;
  const editDisabled = editLoading || editUser === null || !editRoleSlug;

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            مدیریت کاربران
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            ایجاد، ویرایش و مدیریت دسترسی کاربران سامانه.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          کاربر جدید
        </button>
      </header>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <input
              type="search"
              placeholder="جست‌وجوی نام یا نام نمایشی..."
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
            />
          </div>
          {loading ? (
            <span className="text-xs text-slate-500">در حال بارگذاری...</span>
          ) : (
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-slate-700"
              onClick={() => loadUsers()}
            >
              بروزرسانی
            </button>
          )}
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  نام نمایشی
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  نقش
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  نام کاربری
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  وضعیت
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  مدیر
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">
                  اقدامات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    در حال دریافت داده‌ها...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    کاربری یافت نشد.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const manager = user.reports_to_id
                    ? managerLookup.get(user.reports_to_id)
                    : undefined;
                  return (
                    <tr key={user.id}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">
                        {user.display_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {user.role?.label ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {user.username}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                            user.is_active
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500",
                          ].join(" ")}
                        >
                          {user.is_active ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {manager ? manager.display_name : "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
                          >
                            ویرایش
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteUserState(user);
                              setDeleteHard(false);
                              setDeleteError(null);
                            }}
                            className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-[95vw] rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10 sm:max-w-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  کاربر جدید
                </h3>
                <p className="text-sm text-slate-600">
                  اطلاعات کاربر و دسترسی‌ها را مشخص کنید.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-sm text-slate-500 hover:text-slate-700"
                disabled={createLoading}
              >
                بستن
              </button>
            </div>
            <form onSubmit={handleSubmitCreate} className="px-4 py-4 sm:px-6 sm:py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    نام کاربری *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={createForm.username ?? ""}
                    onChange={handleUsernameChange}
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
                    value={createForm.password ?? ""}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    نقش *
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={createForm.role_slug}
                    onChange={handleRoleChange}
                    disabled={rolesLoading}
                    required
                  >
                    <option value="">
                      {rolesLoading ? "در حال بارگذاری نقش‌ها..." : "انتخاب نقش"}
                    </option>
                {roles.map((role) => {
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
                    value={createForm.email ?? ""}
                    onChange={handleEmailChange}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">
                    مدیر مستقیم
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={createParentValue}
                    onChange={handleReportsToChange}
                    disabled={createParentDisabled}
                  >
                    <option value="">
                      {rolesLoading
                        ? "در حال بارگذاری مدیران..."
                        : !selectedCreateRole
                        ? "ابتدا نقش را انتخاب کنید"
                        : requiresParentSelection
                        ? "یک مدیر مجاز را انتخاب کنید"
                        : "این نقش مدیر مستقیم نیاز ندارد"}
                    </option>
                    {createParentOptions.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.display_name} ({user.username})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    نام نمایش به‌صورت خودکار توسط سرور ساخته می‌شود.
                  </p>
                  {requiresParentSelection ? (
                    createParentOptions.length === 0 ? (
                      <p className="text-xs text-amber-600">
                        هیچ مدیری با نقش{" "}
                        {requiredParentRole?.label ??
                          selectedCreateRole?.parent_slug ??
                          "-"}
                        در دسترس نیست.
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        فقط کاربرانی با نقش{" "}
                        {requiredParentRole?.label ??
                          selectedCreateRole?.parent_slug ??
                          "-"}
                        نمایش داده می‌شوند.
                      </p>
                    )
                  ) : selectedCreateRole ? (
                    <p className="text-xs text-slate-500">
                      این نقش نیازی به انتخاب مدیر ندارد.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">
                    مجوزها
                  </h4>
                  <span className="text-xs text-slate-500">
                    با فعال‌کردن هر ستون، دسترسی متناسب اعطا می‌شود.
                  </span>
                </div>
                <PermissionMatrix
                  value={createPermissions}
                  onChange={setCreatePermissions}
                />
              </div>

              {createError ? (
                <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {createError}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="min-h-[44px] rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  disabled={createLoading}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={createDisabled}
                >
                  {createLoading ? "در حال ذخیره..." : "افزودن کاربر"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editUser ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-[95vw] rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10 sm:max-w-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  ویرایش کاربر
                </h3>
                <p className="text-sm text-slate-600">
                  نقش و مجوزها را می‌توانید تغییر دهید؛ نام نمایشی به‌صورت خودکار بر اساس نقش و مدیر تعیین می‌شود.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditUser(null);
                  setEditRoleSlug("");
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
                disabled={editLoading}
              >
                بستن
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} className="px-4 py-4 sm:px-6 sm:py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">
                    نقش
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={editRoleSlug}
                    onChange={handleEditRoleChange}
                    disabled={rolesLoading}
                    required
                  >
                    <option value="">
                      {rolesLoading ? "در حال بارگذاری نقش‌ها..." : "انتخاب نقش"}
                    </option>
                    {roles.map((role) => {
                      const disabled =
                        role.is_unique &&
                        assignedUniqueRoles.has(role.slug) &&
                        role.slug !== (editUser?.role?.slug ?? "");
                      return (
                        <option key={role.slug} value={role.slug} disabled={disabled}>
                          {role.label}
                          {role.is_unique ? " (یکتا)" : ""}
                        </option>
                      );
                    })}
                  </select>
                  {rolesError ? (
                    <p className="text-sm text-rose-600">{rolesError}</p>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">
                  با ذخیره نقش جدید، نام نمایشی به‌صورت خودکار بر اساس ساختار سازمانی بازتولید می‌شود.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">
                    مجوزها
                  </h4>
                  <span className="text-xs text-slate-500">
                    تغییرات روی منابع انتخاب‌شده اعمال می‌شود.
                  </span>
                </div>
                <PermissionMatrix
                  value={editPermissions}
                  onChange={setEditPermissions}
                />
              </div>

              {editError ? (
                <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {editError}
                </div>
              ) : null}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditUser(null);
                    setEditRoleSlug("");
                  }}
                  className="min-h-[44px] rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  disabled={editLoading}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={editDisabled}
                >
                  {editLoading ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteUserState)}
        title="حذف کاربر"
        description="در صورت حذف نرم، کاربر غیرفعال می‌شود. با فعال کردن گزینه حذف کامل، کاربر و سوابق مرتبط به‌صورت کامل حذف می‌شوند."
        confirmLabel="حذف"
        cancelLabel="بازگشت"
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteUserState(null);
          setDeleteHard(false);
          setDeleteError(null);
        }}
      >
        {deleteUserState ? (
          <div className="space-y-4">
            <p>
              آیا از حذف{" "}
              <span className="font-semibold text-slate-900">
                {deleteUserState.display_name}
              </span>{" "}
              اطمینان دارید؟
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                checked={deleteHard}
                onChange={(event) => setDeleteHard(event.currentTarget.checked)}
                disabled={deleteLoading}
              />
              حذف کامل (Hard Delete)
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
