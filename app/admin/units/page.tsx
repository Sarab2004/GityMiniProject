"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchOrgUnits, createOrgUnit, updateOrgUnit, deleteOrgUnit, emitProjectsChanged } from "@/lib/hse";
import type { OrgUnit } from "@/lib/hse";
import { usePermissions } from "@/hooks/usePermissions";
import { PlusIcon } from "@heroicons/react/24/outline";

// Hook for debounced value
function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebounced(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debounced;
}

interface CreateFormState {
    name: string;
}

export default function AdminUnitsPage() {
    const { can } = usePermissions();
    const canManageUnits = can('forms', 'create') || can('forms', 'update') || can('forms', 'delete');

    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 500);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<OrgUnit | null>(null);
    const [createForm, setCreateForm] = useState<CreateFormState>({
        name: "",
    });
    const [createError, setCreateError] = useState<string | null>(null);
    const [createLoading, setCreateLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<OrgUnit | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    const filteredUnits = useMemo(() => {
        if (!debouncedSearch.trim()) return orgUnits;
        const search = debouncedSearch.toLowerCase();
        return orgUnits.filter((unit) =>
            unit.name.toLowerCase().includes(search)
        );
    }, [orgUnits, debouncedSearch]);

    const formatError = (err: unknown, fallback: string) => {
        if (err instanceof Error) {
            return err.message;
        }
        return fallback;
    };

    const loadOrgUnits = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchOrgUnits();
            setOrgUnits(data);
        } catch (err) {
            setError(formatError(err, "دریافت فهرست واحدهای سازمانی با خطا روبه‌رو شد."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrgUnits();
    }, [loadOrgUnits]);

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
        setEditingUnit(null);
        setCreateForm({
            name: "",
        });
        setCreateError(null);
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (unit: OrgUnit) => {
        setEditingUnit(unit);
        setCreateForm({
            name: unit.name,
        });
        setCreateError(null);
        setIsCreateOpen(true);
    };

    const handleOpenDelete = (unit: OrgUnit) => {
        setDeleteConfirm(unit);
    };

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCreateForm((prev) => ({ ...prev, name: event.target.value }));
    };

    const handleSubmitCreate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setCreateError(null);
        setCreateLoading(true);

        try {
            if (editingUnit) {
                await updateOrgUnit(editingUnit.id, createForm.name.trim());
            } else {
                await createOrgUnit(createForm.name.trim());
            }

            // Refresh the list
            await loadOrgUnits();

            // Emit change signal for forms
            emitProjectsChanged();

            // Show success message
            setSuccess(editingUnit ? 'واحد با موفقیت به‌روزرسانی شد.' : 'واحد با موفقیت ثبت شد.');

            // Close modal
            setIsCreateOpen(false);
        } catch (err) {
            let errorMessage = 'خطایی رخ داد';
            if (err instanceof Error) {
                if (err.message.includes('unique') || err.message.includes('تکراری')) {
                    errorMessage = 'نام واحد تکراری است.';
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
            await deleteOrgUnit(deleteConfirm.id);

            // Refresh the list
            await loadOrgUnits();

            // Emit change signal for forms
            emitProjectsChanged();

            // Show success message
            setSuccess('واحد با موفقیت حذف شد.');

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

    const createDisabled = !createForm.name.trim();

    return (
        <section className="space-y-6">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                        مدیریت واحدهای سازمانی
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        ایجاد، ویرایش و مدیریت واحدهای سازمانی سامانه.
                    </p>
                </div>
                {canManageUnits && (
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        <PlusIcon className="h-5 w-5 ml-2" />
                        واحد جدید
                    </button>
                )}
            </header>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <input
                            type="search"
                            placeholder="جست‌وجوی نام واحد..."
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
                            onClick={() => loadOrgUnits()}
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
                                    نام واحد
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                                    تاریخ ایجاد
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
                                        colSpan={3}
                                        className="px-4 py-6 text-center text-sm text-slate-500"
                                    >
                                        در حال دریافت داده‌ها...
                                    </td>
                                </tr>
                            ) : filteredUnits.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={3}
                                        className="px-4 py-6 text-center text-sm text-slate-500"
                                    >
                                        واحدی یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                filteredUnits.map((unit) => (
                                    <tr key={unit.id}>
                                        <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                            {unit.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {unit.created_at ? new Date(unit.created_at).toLocaleDateString('fa-IR') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm">
                                            {canManageUnits ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(unit)}
                                                        className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                                    >
                                                        ویرایش
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenDelete(unit)}
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

            {/* Create/Edit Unit Modal */}
            {isCreateOpen ? (
                <div className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/40 p-4 md:p-6 overscroll-contain">
                    <div className="w-full max-w-[95vw] max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-3rem)] rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10 sm:max-w-2xl flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {editingUnit ? 'ویرایش واحد' : 'واحد جدید'}
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {editingUnit ? 'اطلاعات واحد را ویرایش کنید.' : 'اطلاعات واحد جدید را وارد کنید.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="text-sm text-slate-500 hover:text-slate-700"
                                disabled={createLoading}
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto overscroll-contain">
                            <form onSubmit={handleSubmitCreate} className="px-4 py-4 sm:px-6 sm:py-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            نام واحد *
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            value={createForm.name}
                                            onChange={handleNameChange}
                                            maxLength={255}
                                            placeholder="نام واحد سازمانی"
                                            required
                                        />
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
                                            : editingUnit
                                                ? "ذخیره تغییرات"
                                                : "ایجاد واحد"
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
                                تأیید حذف واحد
                            </h3>
                            <p className="mt-2 text-sm text-slate-600">
                                آیا از حذف واحد <span className="font-semibold">{deleteConfirm.name}</span> اطمینان دارید؟
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
