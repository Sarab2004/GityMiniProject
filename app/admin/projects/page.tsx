"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchProjects, createProject, updateProject, deleteProject, emitProjectsChanged } from "@/lib/hse";
import type { Project, CreateProjectPayload } from "@/lib/hse";
import { usePermissions } from "@/hooks/usePermissions";
import { PlusIcon } from "@heroicons/react/24/outline";

// Extended Project type for admin view
interface ExtendedProject extends Project {
    status?: 'ACTIVE' | 'ARCHIVED';
    start_date?: string;
    end_date?: string;
    description?: string;
}

interface CreateProjectState {
    code: string;
    name: string;
    start_date: string;
    end_date: string;
    status: 'ACTIVE' | 'ARCHIVED';
    description: string;
}

const statusOptions = [
    { value: 'ACTIVE', label: 'فعال' },
    { value: 'ARCHIVED', label: 'آرشیو شده' },
];

function useDebouncedValue<T>(value: T, delay = 400): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const handle = window.setTimeout(() => setDebounced(value), delay);
        return () => window.clearTimeout(handle);
    }, [value, delay]);

    return debounced;
}

export default function AdminProjectsPage() {
    const { can } = usePermissions();
    const canManageProjects = can('forms', 'create') || can('forms', 'update') || can('forms', 'delete');

    const [projects, setProjects] = useState<ExtendedProject[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 500);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ExtendedProject | null>(null);
    const [createForm, setCreateForm] = useState<CreateProjectState>({
        code: "",
        name: "",
        start_date: "",
        end_date: "",
        status: "ACTIVE",
        description: "",
    });
    const [createError, setCreateError] = useState<string | null>(null);
    const [createLoading, setCreateLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<ExtendedProject | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    const filteredProjects = useMemo(() => {
        if (!debouncedSearch.trim()) return projects;
        const search = debouncedSearch.toLowerCase();
        return projects.filter(
            (project) =>
                project.code.toLowerCase().includes(search) ||
                project.name.toLowerCase().includes(search)
        );
    }, [projects, debouncedSearch]);

    const loadProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchProjects();
            // Convert basic Project to ExtendedProject with default values
            const extendedData: ExtendedProject[] = data.map(project => ({
                ...project,
                status: 'ACTIVE' as const,
                start_date: undefined,
                end_date: undefined,
                description: undefined,
            }));
            setProjects(extendedData);
        } catch (err) {
            setError("دریافت فهرست پروژه‌ها با خطا روبه‌رو شد.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    // Auto-hide success message
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    // قفل کردن اسکرول پس‌زمینه هنگام باز بودن مودال
    useEffect(() => {
        if (isCreateOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isCreateOpen]);

    const handleOpenCreate = () => {
        setEditingProject(null);
        setCreateForm({
            code: "",
            name: "",
            start_date: "",
            end_date: "",
            status: "ACTIVE",
            description: "",
        });
        setCreateError(null);
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (project: ExtendedProject) => {
        setEditingProject(project);
        setCreateForm({
            code: project.code,
            name: project.name,
            start_date: project.start_date || "",
            end_date: project.end_date || "",
            status: project.status || "ACTIVE",
            description: project.description || "",
        });
        setCreateError(null);
        setIsCreateOpen(true);
    };

    const handleOpenDelete = (project: ExtendedProject) => {
        setDeleteConfirm(project);
    };

    const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCreateForm((prev) => ({ ...prev, code: event.target.value }));
    };

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCreateForm((prev) => ({ ...prev, name: event.target.value }));
    };

    const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCreateForm((prev) => ({ ...prev, start_date: event.target.value }));
    };

    const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCreateForm((prev) => ({ ...prev, end_date: event.target.value }));
    };

    const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setCreateForm((prev) => ({ ...prev, status: event.target.value as 'ACTIVE' | 'ARCHIVED' }));
    };

    const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCreateForm((prev) => ({ ...prev, description: event.target.value }));
    };

    const handleSubmitCreate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setCreateError(null);
        setCreateLoading(true);

        try {
            const payload: CreateProjectPayload = {
                code: createForm.code.trim(),
                name: createForm.name.trim(),
                status: createForm.status,
                start_date: createForm.start_date || undefined,
                end_date: createForm.end_date || undefined,
                description: createForm.description.trim() || undefined,
            };

            if (editingProject) {
                await updateProject(editingProject.id, payload);
            } else {
                await createProject(payload);
            }

            // Refresh the list
            await loadProjects();

            // Emit change signal for forms
            emitProjectsChanged();

            // Show success message
            setSuccess(editingProject ? 'پروژه با موفقیت به‌روزرسانی شد.' : 'پروژه با موفقیت ثبت شد.');

            // Close modal
            setIsCreateOpen(false);
        } catch (err) {
            let errorMessage = 'خطایی رخ داد';
            if (err instanceof Error) {
                if (err.message.includes('unique') || err.message.includes('تکراری')) {
                    errorMessage = 'کُد پروژه تکراری است.';
                } else if (err.message.includes('date') || err.message.includes('تاریخ')) {
                    errorMessage = 'تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.';
                } else if (err.message.includes('permission') || err.message.includes('مجوز')) {
                    errorMessage = 'شما مجوز انجام این عملیات را ندارید.';
                } else {
                    errorMessage = err.message;
                }
            }
            setCreateError(errorMessage);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirm) return;

        setDeleteLoading(true);
        try {
            await deleteProject(deleteConfirm.id);

            // Refresh the list
            await loadProjects();

            // Emit change signal for forms
            emitProjectsChanged();

            // Show success message
            setSuccess('پروژه با موفقیت حذف شد.');

            // Close confirm dialog
            setDeleteConfirm(null);
        } catch (err) {
            let errorMessage = 'خطایی رخ داد';
            if (err instanceof Error) {
                if (err.message.includes('permission') || err.message.includes('مجوز')) {
                    errorMessage = 'شما مجوز انجام این عملیات را ندارید.';
                } else {
                    errorMessage = err.message;
                }
            }
            setCreateError(errorMessage);
        } finally {
            setDeleteLoading(false);
        }
    };

    const createDisabled =
        !createForm.code.trim() ||
        !createForm.name.trim() ||
        !createForm.status ||
        createLoading;

    return (
        <section className="space-y-6">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                        مدیریت پروژه‌ها
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        ایجاد، ویرایش و مدیریت پروژه‌های سامانه.
                    </p>
                </div>
                {canManageProjects && (
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        <PlusIcon className="h-5 w-5 ml-2" />
                        پروژه جدید
                    </button>
                )}
            </header>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <input
                            type="search"
                            placeholder="جست‌وجوی کد یا نام پروژه..."
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
                            onClick={() => loadProjects()}
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

                {success ? (
                    <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {success}
                    </div>
                ) : null}

                <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                                    کد پروژه
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                                    نام پروژه
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                                    وضعیت
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                                    تاریخ شروع
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                                    تاریخ پایان
                                </th>
                                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">
                                    عملیات
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
                            ) : filteredProjects.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-6 text-center text-sm text-slate-500"
                                    >
                                        {searchTerm ? "پروژه‌ای با این مشخصات یافت نشد." : "هیچ پروژه‌ای یافت نشد."}
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map((project) => (
                                    <tr key={project.id}>
                                        <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                            {project.code}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {project.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span
                                                className={[
                                                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                                                    (project.status === 'ACTIVE' || (!project.status && project.is_active))
                                                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                                        : "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
                                                ].join(" ")}
                                            >
                                                {(project.status === 'ACTIVE' || (!project.status && project.is_active)) ? "فعال" : "آرشیو شده"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {project.start_date || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {project.end_date || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm">
                                            {canManageProjects ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(project)}
                                                        className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                                    >
                                                        ویرایش
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenDelete(project)}
                                                        className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300"
                                                    >
                                                        حذف
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400">فقط مشاهده</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Project Modal */}
            {isCreateOpen ? (
                <div className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/40 p-4 md:p-6 overscroll-contain">
                    <div className="w-full max-w-[95vw] max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-3rem)] rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10 sm:max-w-3xl flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {editingProject ? 'ویرایش پروژه' : 'پروژه جدید'}
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {editingProject ? 'اطلاعات پروژه را ویرایش کنید.' : 'اطلاعات پروژه جدید را وارد کنید.'}
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
                                            کد پروژه *
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={20}
                                            placeholder="مثلاً: PRJ-1403-01"
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            value={createForm.code}
                                            onChange={handleCodeChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            نام پروژه *
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={120}
                                            placeholder="نام پروژه"
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            value={createForm.name}
                                            onChange={handleNameChange}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            تاریخ شروع
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            value={createForm.start_date}
                                            onChange={handleStartDateChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            تاریخ پایان
                                        </label>
                                        <input
                                            type="date"
                                            min={createForm.start_date}
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            value={createForm.end_date}
                                            onChange={handleEndDateChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            وضعیت *
                                        </label>
                                        <select
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            value={createForm.status}
                                            onChange={handleStatusChange}
                                            required
                                        >
                                            {statusOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            توضیحات
                                        </label>
                                        <textarea
                                            maxLength={500}
                                            rows={3}
                                            placeholder="توضیحات پروژه (اختیاری)"
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            value={createForm.description}
                                            onChange={handleDescriptionChange}
                                        />
                                        <p className="text-xs text-slate-500">
                                            {createForm.description.length}/500 کاراکتر
                                        </p>
                                    </div>
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
                                        {createLoading
                                            ? "در حال ذخیره..."
                                            : editingProject
                                                ? "ذخیره تغییرات"
                                                : "ایجاد پروژه"
                                        }
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Delete Confirmation Modal */}
            {deleteConfirm ? (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10">
                        <div className="px-4 py-4 sm:px-6">
                            <h3 className="text-lg font-semibold text-slate-900">
                                تأیید حذف پروژه
                            </h3>
                            <p className="mt-2 text-sm text-slate-600">
                                آیا از حذف پروژه <span className="font-semibold">{deleteConfirm.name}</span> اطمینان دارید؟
                                این عمل قابل بازگشت نیست.
                            </p>
                        </div>
                        <div className="flex justify-end gap-2 px-4 py-4 sm:px-6">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirm(null)}
                                className="rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                disabled={deleteLoading}
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:cursor-not-allowed disabled:bg-rose-400"
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? "در حال حذف..." : "حذف"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
