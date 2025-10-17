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
  RoleCatalogEntry,
  SimplePermissionKey,
  SimplePermissions,
} from "@/types/admin";
import ConfirmDialog from "@/app/ui/admin/ConfirmDialog";
import {
  defaultSimplePermissions,
  mapPermissionsToSimple,
} from "@/lib/permissions/simple";

interface CreateFormState {
  username: string;
  password: string;
  email: string;
  role_slug: string;
  reports_to_id: number | null;
}

const ARCHIVE_DEPENDENCY_MESSAGE = "برای فعال‌سازی ویرایش یا حذف آرشیو، مشاهدهٔ آرشیو باید روشن باشد.";

const SIMPLE_PERMISSION_ORDER: SimplePermissionKey[] = [
  "can_submit_forms",
  "can_view_archive",
  "can_edit_archive_entries",
  "can_delete_archive_entries",
];

const SIMPLE_PERMISSION_META: Record<
  SimplePermissionKey,
  { label: string; description: string; badge: string }
> = {
  can_submit_forms: {
    label: "دسترسی ثبت فرم‌ها",
    description: "امکان ارسال و ثبت هر شش فرم فعال پنل.",
    badge: "ثبت",
  },
  can_view_archive: {
    label: "مشاهده آرشیو",
    description: "نمایش همه رکوردهای آرشیو و گزارش‌های بایگانی.",
    badge: "آرشیو",
  },
  can_edit_archive_entries: {
    label: "ویرایش آرشیو",
    description: "امکان ویرایش رکوردهای ثبت‌شده در آرشیو.",
    badge: "ویرایش",
  },
  can_delete_archive_entries: {
    label: "حذف آرشیو",
    description: "اجازهٔ حذف رکوردهای آرشیو پس از تأیید.",
    badge: "حذف",
  },
};

const applyArchiveDependency = (
  prev: SimplePermissions,
  key: SimplePermissionKey,
  value: boolean,
): SimplePermissions => {
  const next = { ...prev, [key]: value };
  if (key === "can_view_archive" && !value) {
    next.can_edit_archive_entries = false;
    next.can_delete_archive_entries = false;
  }
  if (
    (key === "can_edit_archive_entries" || key === "can_delete_archive_entries") &&
    value
  ) {
    next.can_view_archive = true;
  }
  return next;
};

const validateSimplePermissions = (simple: SimplePermissions): string | null => {
  if (
    (simple.can_edit_archive_entries || simple.can_delete_archive_entries) &&
    !simple.can_view_archive
  ) {
    return ARCHIVE_DEPENDENCY_MESSAGE;
  }
  return null;
};

const extractSimplePermissions = (
  user: AdminUser | null | undefined,
): SimplePermissions => {
  if (user?.simple_permissions) {
    return { ...user.simple_permissions };
  }
  if (user?.permissions?.length) {
    return mapPermissionsToSimple(user.permissions);
  }
  return defaultSimplePermissions();
};

const getPermissionBadges = (simple: SimplePermissions): Array<{
  key: SimplePermissionKey;
  active: boolean;
}> => [
    { key: "can_submit_forms", active: simple.can_submit_forms },
    { key: "can_view_archive", active: simple.can_view_archive },
    { key: "can_edit_archive_entries", active: simple.can_edit_archive_entries },
    {
      key: "can_delete_archive_entries",
      active: simple.can_delete_archive_entries,
    },
  ];

interface SimplePermissionCheckboxesProps {
  value: SimplePermissions;
  onChange: (value: SimplePermissions) => void;
  disabled?: boolean;
}

function SimplePermissionCheckboxes({
  value,
  onChange,
  disabled,
}: SimplePermissionCheckboxesProps) {
  return (
    <div className="grid gap-3">
      {SIMPLE_PERMISSION_ORDER.map((key) => {
        const meta = SIMPLE_PERMISSION_META[key];
        const checked = value[key];
        return (
          <label
            key={key}
            className="flex min-h-[44px] items-start gap-3 rounded-lg border border-slate-200 px-3 py-3 transition hover:border-slate-300"
            title={meta.description}
          >
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
              checked={checked}
              disabled={disabled}
              onChange={(event) =>
                onChange(
                  applyArchiveDependency(value, key, event.currentTarget.checked),
                )
              }
            />
            <div className="space-y-1">
              <span className="block text-sm font-medium text-slate-800">
                {meta.label}
              </span>
              <p className="text-xs text-slate-500">{meta.description}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
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
  const [createSimplePermissions, setCreateSimplePermissions] = useState(defaultSimplePermissions());
  const [createSimplePermissionsError, setCreateSimplePermissionsError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);

  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editRoleSlug, setEditRoleSlug] = useState("");
  const [editSimplePermissions, setEditSimplePermissions] = useState(defaultSimplePermissions());
  const [editSimplePermissionsError, setEditSimplePermissionsError] = useState<string | null>(null);
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

  const handleCreateSimplePermissionsChange = useCallback(
    (next: SimplePermissions) => {
      setCreateSimplePermissions(next);
      setCreateSimplePermissionsError(null);
    },
    [],
  );

  const handleEditSimplePermissionsChange = useCallback(
    (next: SimplePermissions) => {
      setEditSimplePermissions(next);
      setEditSimplePermissionsError(null);
    },
    [],
  );
  async function logUsersApiRequest<T>(
    action: string,
    payload: unknown,
    runner: () => Promise<T>,
  ): Promise<T> {
    const hasConsole =
      typeof window !== "undefined" && typeof console !== "undefined";
    const canGroup =
      hasConsole &&
      typeof console.groupCollapsed === "function" &&
      typeof console.groupEnd === "function";

    if (canGroup) {
      console.groupCollapsed(`[Users API] ${action}`);
    } else if (hasConsole && typeof console.log === "function") {
      console.log(`[Users API] ${action}`);
    }

    if (hasConsole && typeof console.log === "function") {
      console.log("payload", payload);
    }

    try {
      const response = await runner();
      if (hasConsole && typeof console.log === "function") {
        console.log("response", response);
      }
      return response;
    } catch (error) {
      if (hasConsole && typeof console.error === "function") {
        console.error("error", error);
      }
      throw error;
    } finally {
      if (canGroup) {
        console.groupEnd();
      }
    }
  }



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
      const searchValue = debouncedSearch.trim();
      const data = await logUsersApiRequest(
        "getAdminUsers",
        searchValue ? { search: searchValue } : {},
        () => getAdminUsers(searchValue || undefined),
      );
      setUsers(data);
    } catch (err) {
      setError(formatError(err, "دریافت فهرست کاربران با خطا روبه‌رو شد."));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // قفل کردن اسکرول پس‌زمینه هنگام باز بودن مودال
  useEffect(() => {
    if (isCreateOpen || editUser) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isCreateOpen, editUser]);

  useEffect(() => {
    const fetchRoles = async () => {
      setRolesLoading(true);
      try {
        const data = await logUsersApiRequest("getRoleCatalog", {}, getRoleCatalog);
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
    setCreateSimplePermissions(defaultSimplePermissions());
    setCreateSimplePermissionsError(null);
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
    setCreateSimplePermissionsError(null);

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

    const dependencyError = validateSimplePermissions(createSimplePermissions);
    if (dependencyError) {
      setCreateSimplePermissionsError(dependencyError);
      return;
    }

    const payload = {
      username: createForm.username.trim(),
      password: createForm.password,
      role_slug: createForm.role_slug,
      email: createForm.email.trim() || undefined,
      reports_to_id: createForm.reports_to_id ?? undefined,
      simple_permissions: createSimplePermissions,
    };

    setCreateLoading(true);
    try {
      await logUsersApiRequest("createAdminUser", payload, () =>
        createAdminUser(payload),
      );
      setIsCreateOpen(false);
      setCreateSimplePermissions(defaultSimplePermissions());
      await loadUsers();
    } catch (err) {
      const message = formatError(err, "??? ????? ?? ??? ??????? ??.");
      if (message === ARCHIVE_DEPENDENCY_MESSAGE) {
        setCreateSimplePermissionsError(message);
      } else {
        setCreateError(message);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditUser(user);
    setEditRoleSlug(user.role?.slug ?? "");
    setEditSimplePermissions(extractSimplePermissions(user));
    setEditSimplePermissionsError(null);
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

    setEditError(null);
    setEditSimplePermissionsError(null);

    const dependencyError = validateSimplePermissions(editSimplePermissions);
    if (dependencyError) {
      setEditSimplePermissionsError(dependencyError);
      return;
    }

    const payload = {
      simple_permissions: editSimplePermissions,
      ...(editRoleSlug ? { role_slug: editRoleSlug } : {}),
    };

    setEditLoading(true);
    try {
      await logUsersApiRequest(
        `updateAdminUser#${editUser.id}`,
        payload,
        () => updateAdminUser(editUser.id, payload),
      );
      setEditUser(null);
      setEditRoleSlug("");
      setEditSimplePermissions(defaultSimplePermissions());
      await loadUsers();
    } catch (err) {
      setEditError(formatError(err, "??????????? ????? ?? ??? ??????? ??."));
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteUserState) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await logUsersApiRequest(
        `deleteAdminUser#${deleteUserState.id}`,
        { hard: deleteHard },
        () => deleteAdminUser(deleteUserState.id, deleteHard),
      );
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
          <table className="min-w-full table-fixed border-separate border-spacing-0">
            <colgroup>
              <col style={{ width: '20%' }} /> {/* نام کامل */}
              <col style={{ width: '14%' }} /> {/* نقش */}
              <col style={{ width: '18%' }} /> {/* نام کاربری */}
              <col style={{ width: '18%' }} /> {/* دسترسی‌ها */}
              <col style={{ width: '10%' }} /> {/* وضعیت */}
              <col style={{ width: '10%' }} /> {/* مدیر مستقیم */}
              <col style={{ width: '10%' }} /> {/* عملیات */}
            </colgroup>
            <thead className="bg-slate-50">
              <tr>
                <th className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 px-4 py-3 text-right text-sm font-semibold text-slate-600 border-b border-slate-200">
                  نام کامل
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 px-4 py-3 text-right text-sm font-semibold text-slate-600 border-b border-slate-200">
                  نقش
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 px-4 py-3 text-right text-sm font-semibold text-slate-600 border-b border-slate-200">
                  نام کاربری
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 px-4 py-3 text-right text-sm font-semibold text-slate-600 border-b border-slate-200">
                  دسترسی‌ها
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 px-4 py-3 text-right text-sm font-semibold text-slate-600 border-b border-slate-200">
                  وضعیت
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 px-4 py-3 text-right text-sm font-semibold text-slate-600 border-b border-slate-200 hidden md:table-cell">
                  مدیر مستقیم
                </th>
                <th className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 px-4 py-3 text-right text-sm font-semibold text-slate-600 border-b border-slate-200">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-slate-500 border-b border-slate-200"
                  >
                    در حال دریافت داده‌ها...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-sm text-slate-500 border-b border-slate-200"
                  >
                    کاربری یافت نشد.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const manager = user.reports_to_id
                    ? managerLookup.get(user.reports_to_id)
                    : undefined;
                  const simplePermissions = extractSimplePermissions(user);
                  const activePermissionBadges = getPermissionBadges(simplePermissions).filter((badge) => badge.active);
                  return (
                    <tr key={user.id} className="border-b border-slate-200">
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-800">
                        {user.display_name}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {user.role?.label ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {user.username}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {activePermissionBadges.length > 0 ? (
                          <div className="flex flex-wrap gap-2 justify-end">
                            {activePermissionBadges.map((badge) => {
                              const meta = SIMPLE_PERMISSION_META[badge.key];
                              return (
                                <span
                                  key={badge.key}
                                  className="inline-flex min-h-[24px] items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 whitespace-nowrap"
                                  title={meta.description}
                                >
                                  {meta.badge}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
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
                      <td className="px-4 py-3 text-right text-sm text-slate-600 hidden md:table-cell">
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
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/40 p-4 md:p-6 overscroll-contain">
          <div className="w-full max-w-[95vw] max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-3rem)] rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10 sm:max-w-3xl flex flex-col">
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
            <div className="flex-1 overflow-y-auto overscroll-contain">
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

                <div className="mt-6 space-y-4">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-semibold text-slate-800">
                      دسترسی‌ها
                    </h4>
                    <p className="text-xs text-slate-500">
                      چهار گزینهٔ زیر به‌صورت مستقیم به پرمیژن‌های جدید متصل هستند.
                    </p>
                  </div>
                  <SimplePermissionCheckboxes
                    value={createSimplePermissions}
                    onChange={handleCreateSimplePermissionsChange}
                    disabled={createLoading}
                  />
                  {createSimplePermissionsError ? (
                    <p className="text-sm text-rose-600">{createSimplePermissionsError}</p>
                  ) : null}
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
        </div>
      ) : null}

      {editUser ? (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/40 p-4 md:p-6 overscroll-contain">
          <div className="w-full max-w-[95vw] max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-3rem)] rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10 sm:max-w-3xl flex flex-col">
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
            <div className="flex-1 overflow-y-auto overscroll-contain">
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

                <div className="mt-6 space-y-4">
                  <div className="flex flex-col gap-1">
                    <h4 className="text-sm font-semibold text-slate-800">
                      دسترسی‌ها
                    </h4>
                    <p className="text-xs text-slate-500">
                      تغییر این گزینه‌ها هم‌زمان روی پرمیژن‌های ساده در بک‌اند اعمال می‌شود.
                    </p>
                  </div>
                  <SimplePermissionCheckboxes
                    value={editSimplePermissions}
                    onChange={handleEditSimplePermissionsChange}
                    disabled={editLoading}
                  />
                  {editSimplePermissionsError ? (
                    <p className="text-sm text-rose-600">{editSimplePermissionsError}</p>
                  ) : null}
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
