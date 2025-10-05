'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline'
import { fetchArchiveForms, deleteArchiveForm, type ArchiveForm, type ArchiveFilters } from '@/lib/hse'

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

    useEffect(() => {
        loadForms()
    }, [filters])

    const loadForms = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await fetchArchiveForms(filters)
            setForms(data || [])
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
            setForms(prevForms => prevForms ? prevForms.filter(form => form.id !== id) : [])
        } catch (err: any) {
            setError('خطا در حذف فرم')
            console.error('Delete form error:', err)
        } finally {
            setDeletingId(null)
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
                    ) : !forms || forms.length === 0 ? (
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
                                    {forms && forms.map((form) => (
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
                                                    <Link
                                                        href={`/archive/forms/${form.form_type}/${form.id}`}
                                                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1 space-x-reverse"
                                                    >
                                                        <EyeIcon className="h-4 w-4" />
                                                        <span>مشاهده</span>
                                                    </Link>
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
            </div>
        </div>
    )
}
