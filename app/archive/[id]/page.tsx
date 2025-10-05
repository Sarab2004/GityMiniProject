'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowRightIcon, PrinterIcon, TrashIcon } from '@heroicons/react/24/outline'
import { fetchArchiveForm, deleteArchiveForm, type ArchiveForm } from '@/lib/hse'

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

export default function ArchiveDetailPage() {
    const params = useParams()
    const [form, setForm] = useState<ArchiveForm | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        if (params.id) {
            loadForm(String(params.id))
        }
    }, [params.id])

    const loadForm = async (id: string) => {
        try {
            setLoading(true)
            setError(null)
            const data = await fetchArchiveForm(id)
            setForm(data)
        } catch (err: any) {
            setError('خطا در بارگذاری فرم')
            console.error('Load form error:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!form || !confirm('آیا مطمئن هستید که می‌خواهید این فرم را حذف کنید؟')) {
            return
        }

        try {
            setDeleting(true)
            await deleteArchiveForm(form.id)
            // Redirect to archive list
            window.location.href = '/archive'
        } catch (err: any) {
            setError('خطا در حذف فرم')
            console.error('Delete form error:', err)
        } finally {
            setDeleting(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fa-IR')
    }

    const renderFormData = (data: any) => {
        if (!data) return null

        return (
            <div className="space-y-6">
                {Object.entries(data).map(([key, value]) => {
                    if (value === null || value === undefined || value === '') return null
                    
                    return (
                        <div key={key} className="border-b border-gray-200 pb-4">
                            <h4 className="text-sm font-medium text-gray-500 mb-2">
                                {key.replace(/_/g, ' ')}
                            </h4>
                            <div className="text-sm text-gray-900">
                                {Array.isArray(value) ? (
                                    <ul className="list-disc list-inside space-y-1">
                                        {value.map((item, index) => (
                                            <li key={index}>
                                                {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                                            </li>
                                        ))}
                                    </ul>
                                ) : typeof value === 'object' ? (
                                    <pre className="whitespace-pre-wrap text-xs bg-gray-100 p-2 rounded">
                                        {JSON.stringify(value, null, 2)}
                                    </pre>
                                ) : (
                                    String(value)
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-text2">در حال بارگذاری...</p>
                </div>
            </div>
        )
    }

    if (error || !form) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'فرم یافت نشد'}</p>
                    <Link
                        href="/archive"
                        className="text-blue-600 hover:text-blue-800"
                    >
                        بازگشت به آرشیو
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-bg">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <Link
                            href="/archive"
                            className="flex items-center space-x-2 space-x-reverse text-text2 hover:text-text transition-colors"
                        >
                            <ArrowRightIcon className="h-5 w-5" />
                            <span>بازگشت به آرشیو</span>
                        </Link>
                        <div className="h-6 w-px bg-border" />
                        <div>
                            <h1 className="text-2xl font-bold text-text">
                                جزئیات فرم: {form.form_number}
                            </h1>
                            <p className="text-sm text-text2">
                                {formTypeLabels[form.form_type] || form.form_type}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 space-x-reverse">
                        <button
                            onClick={handlePrint}
                            className="btn-primary flex items-center space-x-2 space-x-reverse"
                        >
                            <PrinterIcon className="h-4 w-4" />
                            <span>پرینت</span>
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="btn-secondary flex items-center space-x-2 space-x-reverse"
                        >
                            <TrashIcon className="h-4 w-4" />
                            <span>{deleting ? 'در حال حذف...' : 'حذف'}</span>
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                        {error}
                    </div>
                )}

                {/* Form Details */}
                <div className="card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <h3 className="text-lg font-semibold text-text mb-4">اطلاعات کلی</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm font-medium text-gray-500">شماره فرم:</span>
                                    <span className="mr-2 text-sm text-gray-900">{form.form_number}</span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">نوع فرم:</span>
                                    <span className="mr-2 text-sm text-gray-900">
                                        {formTypeLabels[form.form_type] || form.form_type}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">پروژه:</span>
                                    <span className="mr-2 text-sm text-gray-900">
                                        {projectLabels[form.project] || form.project}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">تاریخ ثبت:</span>
                                    <span className="mr-2 text-sm text-gray-900">{formatDate(form.created_at)}</span>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-500">وضعیت:</span>
                                    <span className="mr-2 text-sm text-gray-900">{form.status}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-text mb-4">محتوای فرم</h3>
                        {renderFormData(form.data)}
                    </div>
                </div>
            </div>
        </div>
    )
}
