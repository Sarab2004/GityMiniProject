"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import { deleteEntry, getArchiveList } from "@/lib/api/archive";
import { getEntry } from "@/lib/api/formEntry";
import { ApiError } from "@/lib/api/_client";
import type { ArchiveFilters, ArchiveListItem } from "@/types/archive";
import type { FormEntryResponse } from "@/lib/formEntry";
import { usePermissions } from "@/hooks/usePermissions";
import { useProjects } from "@/hooks/useProjects";
import NoAccess from "@/components/ui/NoAccess";

const FORM_ROUTE_BY_TYPE: Record<string, string> = {
  action: "fr-01-01",
  tracking: "fr-01-02",
  change: "fr-01-03",
  tbm: "fr-01-10",
  team: "fr-01-12",
  risk: "fr-01-28",
};


export default function ArchivePage() {
  const router = useRouter();

  const [forms, setForms] = useState<ArchiveListItem[]>([]);
  const [filters, setFilters] = useState<ArchiveFilters>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<ArchiveListItem | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<FormEntryResponse<Record<string, unknown>> | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const {
    loading: permissionsLoading,
    error: permissionsError,
    can,
  } = usePermissions();

  const { projects, loading: projectsLoading } = useProjects();

  const canViewArchive = can("archive", "read");
  const canEditArchive = can("archive", "update");
  const canDeleteArchive = can("archive", "delete");

  const loadForms = useCallback(async () => {
    if (permissionsLoading || permissionsError || !canViewArchive) {
      if (!permissionsLoading) {
        setLoading(false);
      }
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getArchiveList(filters);
      setForms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load archive list failed", err);
      setError("بارگذاری آرشیو با خطا روبه‌رو شد. لطفاً دوباره تلاش کنید.");
      setForms([]);
    } finally {
      setLoading(false);
    }
  }, [permissionsLoading, permissionsError, canViewArchive, filters]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleDelete = useCallback(
    async (item: ArchiveListItem) => {
      if (!canDeleteArchive) return;
      const confirmed = window.confirm(`آیا از حذف «${item.form_title} - ${item.form_number}» مطمئن هستید؟`);
      if (!confirmed) return;
      try {
        setError(null);
        setDeletingEntryId(item.entry_id);
        await deleteEntry(item.form_code, item.entry_id);
        setToast("حذف انجام شد.");
        await loadForms();
      } catch (err) {
        console.error("Delete archive entry failed", err);
        if (err instanceof ApiError) {
          if (err.status === 403) {
            setError("اجازه حذف این رکورد را ندارید.");
          } else if (err.status === 404) {
            setError("رکورد موردنظر پیدا نشد یا قبلاً حذف شده است.");
          } else {
            setError("حذف رکورد با خطای غیرمنتظره روبه‌رو شد.");
          }
        } else {
          setError("حذف رکورد با خطای غیرمنتظره روبه‌رو شد.");
        }
      } finally {
        setDeletingEntryId(null);
      }
    },
    [canDeleteArchive, loadForms],
  );

  const handleView = useCallback(async (item: ArchiveListItem) => {
    setSelectedItem(item);
    setModalLoading(true);
    setModalOpen(true);
    try {
      const entry = await getEntry(item.form_code, item.entry_id);
      setSelectedEntry(entry);
    } catch (err) {
      console.error("Load archive entry failed", err);
      setSelectedEntry(null);
      setError("مشاهدهٔ جزئیات این رکورد ممکن نیست.");
    } finally {
      setModalLoading(false);
    }
  }, []);

  const handleEdit = useCallback(
    (item: ArchiveListItem) => {
      if (!canEditArchive) return;
      const route = FORM_ROUTE_BY_TYPE[item.form_type] ?? item.form_code.toLowerCase();
      router.push(`/forms/${route}?entryId=${item.entry_id}&mode=edit`);
    },
    [canEditArchive, router],
  );

  const handleFilterChange = (key: keyof ArchiveFilters, value: string) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value || undefined,
    }));
  };

  const formatDate = useCallback((value: string) => {
    return new Date(value).toLocaleDateString("fa-IR");
  }, []);

  const permissionError = useMemo(() => {
    if (permissionsError) {
      return "بارگذاری سطح دسترسی با خطا روبه‌رو شد.";
    }
    if (!permissionsLoading && !permissionsError && !canViewArchive) {
      return "برای مشاهدهٔ آرشیو نیاز به دسترسی can_view_archive دارید.";
    }
    return null;
  }, [permissionsError, permissionsLoading, canViewArchive]);

  if (permissionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="card w-full max-w-xs p-6 text-center text-sm text-text2">
          کمی صبر کنید، در حال بررسی سطح دسترسی...
        </div>
      </div>
    );
  }

  if (permissionError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <NoAccess title="دسترسی به آرشیو ندارید" description={permissionError} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Link
              href="/"
              className="flex items-center space-x-2 space-x-reverse text-text2 transition-colors hover:text-text"
            >
              <ArrowRightIcon className="h-5 w-5" />
              <span>بازگشت به داشبورد</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold text-text">آرشیو ورودی‌های فرم‌ها</h1>
              <p className="text-sm text-text2">لیست فرم‌های ثبت‌شده به‌همراه امکان مشاهده، ویرایش یا حذف.</p>
            </div>
          </div>
        </div>

        {toast ? (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
            {toast}
          </div>
        ) : null}

        <div className="card mb-6 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-text">پروژه</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.project || ""}
                onChange={(event) => handleFilterChange("project", event.target.value)}
                disabled={projectsLoading}
              >
                <option value="">همهٔ پروژه‌ها</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id.toString()}>
                    {project.code} - {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text">نوع فرم</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.form_type || ""}
                onChange={(event) => handleFilterChange("form_type", event.target.value)}
              >
                <option value="">همهٔ فرم‌ها</option>
                {Array.from(new Set(forms.map((item) => item.form_type))).map((type) => (
                  <option key={type} value={type}>
                    {forms.find((item) => item.form_type === type)?.form_title ?? type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-text2">
              در حال بارگذاری داده‌ها...
            </div>
          ) : error ? (
            <div className="flex h-48 items-center justify-center text-sm text-danger">{error}</div>
          ) : forms.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-text2">
              رکوردی برای نمایش موجود نیست.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-divider text-sm">
                <thead className="bg-primarySubtle text-text">
                  <tr>
                    <th className="px-4 py-3 text-right font-medium">فرم</th>
                    <th className="px-4 py-3 text-right font-medium">کد فرم</th>
                    <th className="px-4 py-3 text-right font-medium">پروژه</th>
                    <th className="px-4 py-3 text-right font-medium">تاریخ ثبت</th>
                    <th className="px-4 py-3 text-right font-medium">ثبت‌کننده</th>
                    <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                    <th className="px-4 py-3 text-right font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {forms.map((item) => {
                    const project = projects.find(p => p.id.toString() === item.project);
                    const projectLabel = project ? `${project.code} - ${project.name}` : item.project ?? "-";
                    return (
                      <tr key={item.id} className="transition-colors hover:bg-primarySubtle/40">
                        <td className="px-4 py-3 font-medium text-text">
                          <div className="flex flex-col">
                            <span>{item.form_title}</span>
                            <span className="text-xs text-text2">{item.form_number}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text2">{item.form_code}</td>
                        <td className="px-4 py-3 text-text2">{projectLabel}</td>
                        <td className="px-4 py-3 text-text2">{formatDate(item.created_at)}</td>
                        <td className="px-4 py-3 text-text2">
                          {item.created_by ? item.created_by.display_name : "نامشخص"}
                        </td>
                        <td className="px-4 py-3 text-text2">{item.status}</td>
                        <td className="px-4 py-3 text-text2">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleView(item)}
                              className="inline-flex min-h-[44px] items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                              <EyeIcon className="h-4 w-4" />
                              مشاهده
                            </button>
                            {canEditArchive ? (
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                className="inline-flex min-h-[44px] items-center gap-1 rounded-md border border-amber-200 px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-300"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                                ویرایش
                              </button>
                            ) : null}
                            {canDeleteArchive ? (
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                disabled={deletingEntryId === item.entry_id}
                                className="inline-flex min-h-[44px] items-center gap-1 rounded-md border border-rose-200 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <TrashIcon className="h-4 w-4" />
                                حذف
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {error ? (
          <div className="mt-6 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
        ) : null}

        {modalOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-[95vw] overflow-y-auto rounded-lg bg-white shadow-xl ring-1 ring-black/10 sm:max-w-4xl">
              <div className="flex items-center justify-between border-b p-6">
                <h2 className="text-xl font-semibold text-text">
                  {selectedItem?.form_title} – {selectedItem?.form_number}
                </h2>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-gray-500 transition-colors hover:text-gray-700"
                  disabled={modalLoading}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4 p-6">
                {modalLoading ? (
                  <p className="text-sm text-text2">در حال بارگذاری...</p>
                ) : selectedEntry ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <span className="text-sm font-medium text-text">فرم</span>
                        <p className="mt-1 text-sm text-text2">{selectedEntry.form_title}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-text">ثبت‌کننده</span>
                        <p className="mt-1 text-sm text-text2">
                          {selectedItem?.created_by ? selectedItem.created_by.display_name : "نامشخص"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-text">تاریخ ثبت</span>
                        <p className="mt-1 text-sm text-text2">
                          {selectedItem ? formatDate(selectedItem.created_at) : "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-text">وضعیت</span>
                        <p className="mt-1 text-sm text-text2">{selectedItem?.status ?? "-"}</p>
                      </div>
                    </div>
                    <div>
                      <span className="mb-2 block text-sm font-medium text-text">دادهٔ خام</span>
                      <div className="rounded-md bg-gray-50 p-4">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800">
                          {JSON.stringify(selectedEntry.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-text2">اطلاعاتی برای نمایش موجود نیست.</p>
                )}
              </div>
              <div className="flex justify-end border-t p-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600"
                  disabled={modalLoading}
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
