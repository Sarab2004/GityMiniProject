"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
} from "@/lib/api/admin";
import type { AdminUser, PermissionEntry, Resource } from "@/types/admin";
import PermissionMatrix from "@/app/ui/admin/PermissionMatrix";
import ConfirmDialog from "@/app/ui/admin/ConfirmDialog";

const RESOURCES: Resource[] = ["forms", "actions", "archive"];

interface CreateFormState {
  username: string;
  password: string;
  email: string;
  display_name: string;
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
    display_name: "",
    reports_to_id: null,
  });
  const [createPermissions, setCreatePermissions] = useState<
    PermissionEntry[]
  >(defaultPermissions);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editPermissions, setEditPermissions] = useState<PermissionEntry[]>(
    defaultPermissions,
  );
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

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

  const formatError = (err: unknown, fallback: string) => {
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

  const handleOpenCreate = () => {
    setCreateForm({
      username: "",
      password: "",
      email: "",
      display_name: "",
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

  const handleDisplayNameChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { value } = event.target;
    setCreateForm((prev) => ({ ...prev, display_name: value }));
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
    setCreateLoading(true);
    setCreateError(null);
    try {
      await createAdminUser({
        username: createForm.username.trim(),
        password: createForm.password,
        display_name: createForm.display_name.trim(),
        email: createForm.email.trim() || undefined,
        reports_to_id: createForm.reports_to_id ?? undefined,
        permissions: createPermissions,
      });
      setIsCreateOpen(false);
      await loadUsers();
    } catch (err) {
      setCreateError(formatError(err, "ایجاد کاربر جدید با خطا مواجه شد."));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditUser(user);
    setEditDisplayName(user.display_name);
    setEditPermissions(ensurePermissions(user.permissions));
    setEditError(null);
  };

  const handleSubmitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await updateAdminUser(editUser.id, {
        display_name: editDisplayName.trim(),
        permissions: editPermissions,
      });
      setEditUser(null);
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

  const createDisabled =
    !createForm.username.trim() ||
    !createForm.password ||
    !createForm.display_name.trim() ||
    createLoading;
  const editDisabled =
    !editDisplayName.trim() || editLoading || editUser === null;

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

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Display Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Username
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Active?
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Manager
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    در حال دریافت داده‌ها...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
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
                        {manager ? manager.display_name : "—"}
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
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
            <form onSubmit={handleSubmitCreate} className="px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Username *
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
                    Display Name *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={createForm.display_name ?? ""}
                    onChange={handleDisplayNameChange}
                    required
                  />
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
                    value={
                      createForm.reports_to_id === null
                        ? ""
                        : String(createForm.reports_to_id)
                    }
                    onChange={handleReportsToChange}
                  >
                    <option value="">— بدون مدیر —</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.display_name} ({user.username})
                      </option>
                    ))}
                  </select>
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

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  disabled={createLoading}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={createDisabled}
                >
                  {createLoading ? "در حال ذخیره..." : "ایجاد کاربر"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editUser ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  ویرایش کاربر
                </h3>
                <p className="text-sm text-slate-600">
                  فقط نام نمایشی و مجوزها قابل ویرایش هستند.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="text-sm text-slate-500 hover:text-slate-700"
                disabled={editLoading}
              >
                بستن
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} className="px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    value={editDisplayName}
                    onChange={(event) => setEditDisplayName(event.target.value)}
                    required
                  />
                </div>
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

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  disabled={editLoading}
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-400"
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
