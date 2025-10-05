'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, EyeIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { fetchArchiveForms, deleteArchiveForm, fetchArchiveForm, type ArchiveForm, type ArchiveFilters } from '@/lib/hse'

const formTypeLabels: Record<string, string> = {
    'action': 'اقدام اصلاحی',
    'tracking': 'پیگیری اقدام',
    'change': 'ثبت تغییرات',
    'tbm': 'آموزش حین کار',
    'team': 'تشکیل تیم',
    'risk': 'ارزیابی ریسک',
}

const projectLabels: Record<string, string> = {
    'AS': 'Acid Sarcheshmeh',
    'NP': 'Negin Pars',
}

export default function ArchivePage() {
    const [forms, setForms] = useState<ArchiveForm[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<ArchiveFilters>({})
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [selectedForm, setSelectedForm] = useState<ArchiveForm | null>(null)
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        loadForms()
    }, [filters])

    const loadForms = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await fetchArchiveForms(filters)
            // Ensure we always set an array
            setForms(Array.isArray(data) ? data : [])
        } catch (err: any) {
            setError('خطا در بارگذاری فرم‌ها')
            setForms([])
            console.error('Load forms error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('آیا مطمئن هستید که می‌خواهید این فرم را حذف کنید؟')) {
            return
        }

        try {
            setDeletingId(Number(id.split('_')[1]))
            await deleteArchiveForm(id)
            setForms(prevForms => Array.isArray(prevForms) ? prevForms.filter(form => form.id !== id) : [])
        } catch (err: any) {
            setError('خطا در حذف فرم')
            console.error('Delete form error:', err)
        } finally {
            setDeletingId(null)
        }
    }

    const handleViewForm = async (id: string) => {
        try {
            const form = await fetchArchiveForm(id)
            setSelectedForm(form)
            setShowModal(true)
        } catch (err: any) {
            setError('خطا در بارگذاری فرم')
            console.error('View form error:', err)
        }
    }

    const handleFilterChange = (key: keyof ArchiveFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || undefined,
        }))
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fa-IR')
    }

    return (
        <div className="min-h-screen bg-bg">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <Link
                            href="/"
                            className="flex items-center space-x-2 space-x-reverse text-text2 hover:text-text transition-colors"
                        >
                            <ArrowRightIcon className="h-5 w-5" />
                            <span>بازگشت</span>
                        </Link>
                        <div className="h-6 w-px bg-border" />
                        <div>
                            <h1 className="text-2xl font-bold text-text">آرشیو فرم‌های ثبت شده</h1>
                            <p className="text-sm text-text2">مشاهده و مدیریت فرم‌های ثبت شده</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="card p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text mb-2">
                                پروژه
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={filters.project || ''}
                                onChange={(e) => handleFilterChange('project', e.target.value)}
                            >
                                <option value="">همه پروژه‌ها</option>
                                <option value="AS">AS - Acid Sarcheshmeh</option>
                                <option value="NP">NP - Negin Pars</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text mb-2">
                                نوع فرم
                            </label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={filters.form_type || ''}
                                onChange={(e) => handleFilterChange('form_type', e.target.value)}
                            >
                                <option value="">همه انواع</option>
                                <option value="action">اقدام اصلاحی</option>
                                <option value="tracking">پیگیری اقدام</option>
                                <option value="change">ثبت تغییرات</option>
                                <option value="tbm">آموزش حین کار</option>
                                <option value="team">تشکیل تیم</option>
                                <option value="risk">ارزیابی ریسک</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                        {error}
                    </div>
                )}

                {/* Forms List */}
                <div className="card">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-2 text-text2">در حال بارگذاری...</p>
                        </div>
                    ) : !Array.isArray(forms) || forms.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-text2">هیچ فرمی یافت نشد</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            شماره فرم
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            نوع فرم
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            پروژه
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            تاریخ ثبت
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            عملیات
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {Array.isArray(forms) && forms.map((form) => (
                                        <tr key={form.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                                                {form.form_number}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                                                {formTypeLabels[form.form_type] || form.form_type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                                                {projectLabels[form.project] || form.project}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                                                {formatDate(form.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2 space-x-reverse">
                                                    <button
                                                        onClick={() => handleViewForm(form.id)}
                                                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1 space-x-reverse"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                        <span>مشاهده</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(form.id)}
                                                        disabled={deletingId === Number(form.id.split('_')[1])}
                                                        className="text-red-600 hover:text-red-900 flex items-center space-x-1 space-x-reverse disabled:opacity-50"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                        <span>حذف</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal for viewing form details */}
                {showModal && selectedForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b">
                                <h2 className="text-xl font-semibold text-text">
                                    جزئیات فرم: {selectedForm.form_number}
                                </h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">نوع فرم</label>
                                        <p className="mt-1 text-sm text-gray-900">{formTypeLabels[selectedForm.form_type] || selectedForm.form_type}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">پروژه</label>
                                        <p className="mt-1 text-sm text-gray-900">{projectLabels[selectedForm.project] || selectedForm.project}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">تاریخ ثبت</label>
                                        <p className="mt-1 text-sm text-gray-900">{formatDate(selectedForm.created_at)}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">وضعیت</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedForm.status}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">محتوای فرم</label>
                                    <div className="bg-gray-50 p-4 rounded-md">
                                        <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                                            {JSON.stringify(selectedForm.data, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end p-6 border-t">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                                >
                                    بستن
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
