"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchSections, createSection, updateSection, deleteSection, fetchOrgUnits } from "@/lib/hse";
import type { Section, OrgUnit } from "@/lib/hse";
import { usePermissions } from "@/hooks/usePermissions";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface CreateSectionState {
    name: string;
    orgUnitId: number | null;
}

export default function AdminSectionsPage() {
    const { can } = usePermissions();
    const canManageSections = can('forms', 'create') || can('forms', 'update') || can('forms', 'delete');

    const [sections, setSections] = useState<Section[]>([]);
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebouncedValue(searchTerm, 500);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | null>(null);
    const [createForm, setCreateForm] = useState<CreateSectionState>({ name: "", orgUnitId: null });
    const [createError, setCreateError] = useState<string | null>(null);
    const [createLoading, setCreateLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<Section | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);

    const filteredSections = useMemo(() => {
        if (!debouncedSearch.trim()) return sections;
        const search = debouncedSearch.toLowerCase();
        return sections.filter(
            (section) => 
                section.name.toLowerCase().includes(search) ||
                (orgUnits.find(u => u.id === section.org_unit)?.name.toLowerCase().includes(search))
        );
    }, [sections, debouncedSearch, orgUnits]);

    const formatError = (err: unknown, fallback: string) => {
        if (err instanceof Error) {
            return err.message;
        }
        return fallback;
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [sectionsData, unitsData] = await Promise.all([
                fetchSections(),
                fetchOrgUnits()
            ]);
            setSections(sectionsData);
            setOrgUnits(unitsData);
        } catch (err) {
            setError(formatError(err, "دریافت فهرست بخش‌ها با خطا روبه‌رو شد."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

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
        setEditingSection(null);
        setCreateForm({ name: "", orgUnitId: null });
        setCreateError(null);
        setIsCreateOpen(true);
    };

    const handleOpenEdit = (section: Section) => {
        setEditingSection(section);
        setCreateForm({ 
            name: section.name, 
            orgUnitId: section.org_unit 
        });
        setCreateError(null);
        setIsCreateOpen(true);
    };

    const handleOpenDelete = (section: Section) => {
        setDeleteConfirm(section);
    };

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCreateForm((prev) => ({ ...prev, name: event.target.value }));
    };

    const handleOrgUnitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const orgUnitId = event.target.value ? parseInt(event.target.value) : null;
        setCreateForm((prev) => ({ ...prev, orgUnitId }));
    };

    const handleSubmitCreate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setCreateError(null);
        setCreateLoading(true);

        try {
            if (!createForm.orgUnitId) {
                throw new Error('لطفاً واحد سازمانی را انتخاب کنید.');
            }

            const payload = { 
                name: createForm.name.trim(),
                orgUnitId: createForm.orgUnitId
            };

            if (editingSection) {
                await updateSection(editingSection.id, payload.name, payload.orgUnitId);
            } else {
                await createSection(payload.name, payload.orgUnitId);
            }

            await loadData();
            setSuccess(editingSection ? 'بخش با موفقیت به‌روزرسانی شد.' : 'بخش با موفقیت ثبت شد.');
            setIsCreateOpen(false);
        } catch (err) {
            let errorMessage = 'خطایی رخ داد';
            if (err instanceof Error) {
                if (err.message.includes('unique') || err.message.includes('تکراری')) {
                    errorMessage = 'نام بخش تکراری است.';
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
            await deleteSection(deleteConfirm.id);
            await loadData();
            setSuccess('بخش با موفقیت حذف شد.');
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

    const createDisabled = !createForm.name.trim() || !createForm.orgUnitId || createForm.name.length > 255;

    return (
        <section className="space-y-6">
            <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900">
                        مدیریت بخش‌ها
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                        ایجاد، ویرایش و مدیریت بخش‌های سازمانی.
                    </p>
                </div>
                {canManageSections && (
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                    >
                        <PlusIcon className="h-5 w-5 ml-2" />
                        بخش جدید
                    </button>
                )}
            </header>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full sm:max-w-xs">
                        <input
                            type="search"
                            placeholder="جست‌وجوی نام بخش یا واحد..."
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
                            onClick={() => loadData()}
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
                                    نام بخش
                                </th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                                    واحد سازمانی
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
                                        colSpan={4}
                                        className="px-4 py-6 text-center text-sm text-slate-500"
                                    >
                                        در حال دریافت داده‌ها...
                                    </td>
                                </tr>
                            ) : filteredSections.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-6 text-center text-sm text-slate-500"
                                    >
                                        بخشی یافت نشد.
                                    </td>
                                </tr>
                            ) : (
                                filteredSections.map((section) => (
                                    <tr key={section.id}>
                                        <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                            {section.name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {orgUnits.find(u => u.id === section.org_unit)?.name || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {section.created_at ? new Date(section.created_at).toLocaleDateString('fa-IR') : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm">
                                            {canManageSections ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(section)}
                                                        className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                                    >
                                                        ویرایش
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenDelete(section)}
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

            {/* Create/Edit Section Modal */}
            {isCreateOpen ? (
                <div className="fixed inset-0 z-40 flex items-start justify-center bg-slate-900/40 p-4 md:p-6 overscroll-contain">
                    <div className="w-full max-w-[95vw] max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-3rem)] rounded-lg bg-white shadow-xl ring-1 ring-slate-900/10 sm:max-w-3xl flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {editingSection ? 'ویرایش بخش' : 'بخش جدید'}
                                </h3>
                                <p className="text-sm text-slate-600">
                                    {editingSection ? 'اطلاعات بخش را ویرایش کنید.' : 'اطلاعات بخش جدید را وارد کنید.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateOpen(false)}
                                className="text-sm text-slate-500 hover:text-slate-700"
                                disabled={createLoading}
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto overscroll-contain">
                            <form onSubmit={handleSubmitCreate} className="px-4 py-4 sm:px-6 sm:py-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            نام بخش *
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            value={createForm.name}
                                            onChange={handleNameChange}
                                            maxLength={255}
                                            placeholder="مثلاً: بخش تولید"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-slate-700">
                                            واحد سازمانی *
                                        </label>
                                        <select
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                            value={createForm.orgUnitId || ''}
                                            onChange={handleOrgUnitChange}
                                            required
                                        >
                                            <option value="">انتخاب واحد سازمانی</option>
                                            {orgUnits.map((unit) => (
                                                <option key={unit.id} value={unit.id}>
                                                    {unit.name}
                                                </option>
                                            ))}
                                        </select>
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
                                            : editingSection
                                                ? "ذخیره تغییرات"
                                                : "ایجاد بخش"
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
                                تأیید حذف بخش
                            </h3>
                            <p className="mt-2 text-sm text-slate-600">
                                آیا از حذف بخش <span className="font-semibold">{deleteConfirm.name}</span> اطمینان دارید؟
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
