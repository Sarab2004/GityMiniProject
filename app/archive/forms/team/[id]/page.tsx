'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowRightIcon, PrinterIcon } from '@heroicons/react/24/outline'
import { fetchArchiveForm, type ArchiveForm } from '@/lib/hse'

export default function TeamFormArchivePage() {
    const params = useParams()
    const [form, setForm] = useState<ArchiveForm | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

    const handlePrint = () => {
        window.print()
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fa-IR')
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

    const data = form.data

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
                                مشاهده فرم تشکیل تیم: {form.form_number}
                            </h1>
                            <p className="text-sm text-text2">
                                FR-01-12-00 - تشکیل و مدیریت تیم‌های همیاران ایمنی و بهداشت
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
                    </div>
                </div>

                {/* Form Content */}
                <div className="card p-6">
                    <div className="space-y-8">
                        {/* اطلاعات کلی */}
                        <div>
                            <h3 className="text-lg font-semibold text-text mb-4 border-b border-gray-200 pb-2">
                                اطلاعات کلی
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        شماره فرم
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                        {form.form_number}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        پروژه
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                        {form.project === 'AS' ? 'Acid Sarcheshmeh' : 'Negin Pars'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        تهیه‌کننده (کارشناس HSE)
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                        {data.prepared_by || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        تصویب‌کننده (مدیر پروژه/سرپرست کارگاه)
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                        {data.approved_by || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        تعداد اعضای تیم
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                        {data.members_count || 0} نفر
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* اطلاعات ثبت */}
                        <div>
                            <h3 className="text-lg font-semibold text-text mb-4 border-b border-gray-200 pb-2">
                                اطلاعات ثبت
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        تاریخ ثبت
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                        {formatDate(form.created_at)}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        وضعیت
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                        {form.status === 'active' ? 'فعال' : form.status}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
