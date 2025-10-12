'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  EyeIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import {
  fetchArchiveForms,
  deleteArchiveForm,
  fetchArchiveForm,
  type ArchiveForm,
  type ArchiveFilters,
} from '@/lib/hse';
import { usePermissions } from '@/hooks/usePermissions';
import NoAccess from '@/components/ui/NoAccess';

const formTypeLabels: Record<string, string> = {
  action: 'OU,O_OU. OO�U,OO-UO',
  tracking: 'U_UOU_UOO�UO OU,O_OU.',
  change: 'O�O"O� O�O�UOUOO�OO�',
  tbm: "O�U.U^O�O' O-UOU+ UcOO�",
  team: 'O�O\'UcUOU, O�UOU.',
  risk: 'OO�O�UOOO"UO O�UOO3Uc',
};

const projectLabels: Record<string, string> = {
  AS: 'Acid Sarcheshmeh',
  NP: 'Negin Pars',
};

export default function ArchivePage() {
  const [forms, setForms] = useState<ArchiveForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ArchiveFilters>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedForm, setSelectedForm] = useState<ArchiveForm | null>(null);
  const [showModal, setShowModal] = useState(false);

  const {
    loading: permLoading,
    error: permError,
    can,
  } = usePermissions();

  const canReadArchive = can('archive', 'read');
  const canDeleteArchive = can('archive', 'delete');

  const loadForms = useCallback(async () => {
    if (permLoading || permError || !canReadArchive) {
      if (!permLoading) {
        setLoading(false);
      }
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await fetchArchiveForms(filters);
      setForms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load forms error:', err);
      setError('OrO�O O_O� O"OO�U_O�OO�UO U?O�U.?OU�O');
      setForms([]);
    } finally {
      setLoading(false);
    }
  }, [permLoading, permError, canReadArchive, filters]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!canDeleteArchive) {
        return;
      }
      const confirmed = window.confirm(
        'O�UOO U.O�U.O�U+ U�O3O�UOO_ UcU� U.UO�?OOrU^OU�UOO_ OUOU+ U?O�U. O�O O-O�U? UcU+UOO_OY',
      );
      if (!confirmed) return;

      try {
        const numericId = Number(id.split('_')[1]);
        setDeletingId(numericId);
        await deleteArchiveForm(id);
        setForms((prev) =>
          Array.isArray(prev) ? prev.filter((form) => form.id !== id) : [],
        );
      } catch (err) {
        console.error('Delete form error:', err);
        setError('OrO�O O_O� O-O�U? U?O�U.');
      } finally {
        setDeletingId(null);
      }
    },
    [canDeleteArchive],
  );

  const handleViewForm = useCallback(async (id: string) => {
    try {
      const form = await fetchArchiveForm(id);
      setSelectedForm(form);
      setShowModal(true);
    } catch (err) {
      console.error('View form error:', err);
      setError('OrO�O O_O� O"OO�U_O�OO�UO U?O�U.');
    }
  }, []);

  const handleFilterChange = (key: keyof ArchiveFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  }, []);

  const permissionError = useMemo(() => {
    if (permError) {
      return 'عدم دریافت مجوزهای کاربر';
    }
    if (!permLoading && !permError && !canReadArchive) {
      return 'برای مشاهده آرشیو نیاز به مجوز archive.read دارید.';
    }
    return null;
  }, [permError, permLoading, canReadArchive]);

  if (permLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <div className="card w-full max-w-xs p-6 text-center text-sm text-text2">
          در حال بررسی مجوزهای دسترسی...
        </div>
      </div>
    );
  }

  if (permissionError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <NoAccess
          title="دسترسی به آرشیو محدود است"
          description={permissionError}
        />
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
              <span>O"OO�U_O'O�</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-bold text-text">
                O�O�O'UOU^ U?O�U.?OU�OUO O�O\"O� O'O_U�
              </h1>
              <p className="text-sm text-text2">
                U.O'OU�O_U� U^ U.O_UOO�UOO� U?O�U.?OU�OUO O�O\"O� O'O_U�
              </p>
            </div>
          </div>
        </div>

        <div className="card mb-6 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-text">
                U_O�U^U~U�
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.project || ''}
                onChange={(event) =>
                  handleFilterChange('project', event.target.value)
                }
              >
                <option value="">همه پروژه‌ها</option>
                <option value="AS">Acid Sarcheshmeh</option>
                <option value="NP">Negin Pars</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-text">
                U+U^O1 U?O�U.
              </label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.form_type || ''}
                onChange={(event) =>
                  handleFilterChange('form_type', event.target.value)
                }
              >
                <option value="">همه فرم‌ها</option>
                {Object.entries(formTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-text2">
              در حال بارگذاری اطلاعات...
            </div>
          ) : forms.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-text2">
              داده‌ای برای نمایش وجود ندارد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-divider text-sm">
                <thead className="bg-primarySubtle text-text">
                  <tr>
                    <th className="px-4 py-3 text-right font-medium">
                      U+U^O1 U?O�U.
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      U_O�U^U~U�
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      O�OO�UOOr
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      وضعیت
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      اقدامات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => (
                    <tr
                      key={form.id}
                      className="border-b border-divider transition-colors hover:bg-primarySubtle/40"
                    >
                      <td className="px-4 py-3 font-medium text-primary">
                        {formTypeLabels[form.form_type] ?? form.form_type}
                      </td>
                      <td className="px-4 py-3">
                        {projectLabels[form.project] ?? form.project}
                      </td>
                      <td className="px-4 py-3">
                        {formatDate(form.created_at)}
                      </td>
                      <td className="px-4 py-3">{form.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3 space-x-reverse text-xs">
                          <button
                            type="button"
                            onClick={() => handleViewForm(form.id)}
                            className="flex items-center space-x-1 space-x-reverse text-primary transition-colors hover:text-primaryHover"
                          >
                            <EyeIcon className="h-4 w-4" />
                            <span>U.O'OU�O_U�</span>
                          </button>
                          {canDeleteArchive ? (
                            <button
                              type="button"
                              onClick={() => handleDelete(form.id)}
                              disabled={
                                deletingId === Number(form.id.split('_')[1])
                              }
                              className="flex items-center space-x-1 space-x-reverse text-red-600 transition-colors hover:text-red-800 disabled:opacity-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                              <span>O-O�U?</span>
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {error ? (
          <div className="mt-6 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {showModal && selectedForm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white">
              <div className="flex items-center justify-between border-b p-6">
                <h2 className="text-xl font-semibold text-text">
                  O�O�O�UOOO� U?O�U.: {selectedForm.form_number}
                </h2>
                <button
                  type='button'
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 transition-colors hover:text-gray-700"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      U+U^O1 U?O�U.
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formTypeLabels[selectedForm.form_type] ??
                        selectedForm.form_type}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      U_O�U^U~U�
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {projectLabels[selectedForm.project] ??
                        selectedForm.project}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      O�OO�UOOr O�O\"O�
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(selectedForm.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      U^OO1UOO�
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedForm.status}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    U.O-O�U^OUO U?O�U.
                  </label>
                  <div className="rounded-md bg-gray-50 p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">
                      {JSON.stringify(selectedForm.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
              <div className="flex justify-end border-t p-6">
                <button
                  type='button'
                  onClick={() => setShowModal(false)}
                  className="rounded-md bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600"
                >
                  O\"O3O�U+
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
