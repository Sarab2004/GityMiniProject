'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowRightIcon, PrinterIcon } from '@heroicons/react/24/outline'
import { fetchArchiveForm, type ArchiveForm } from '@/lib/hse'

export default function RiskFormArchivePage() {
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
                                مشاهده فرم ارزیابی ریسک: {form.form_number}
                            </h1>
                            <p className="text-sm text-text2">
                                شناسایی، ارزیابی و مدیریت ریسک‌های ایمنی، بهداشتی و اموال
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
                        {/* اطلاعات پایه */}
                        <div>
                            <h3 className="text-lg font-semibold text-text mb-4 border-b border-gray-200 pb-2">
                                اطلاعات پایه
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        نوع ریسک
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                        {data.risk_type === 'S' ? 'ایمنی (Safety)' :
                                         data.risk_type === 'H' ? 'بهداشتی (Health)' :
                                         data.risk_type === 'F' ? 'اموال (Property)' : data.risk_type}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* شناسایی فرآیند */}
                        <div>
                            <h3 className="text-lg font-semibold text-text mb-4 border-b border-gray-200 pb-2">
                                شناسایی فرآیند
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        عنوان فرآیند
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                                        {data.process_title || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        شرح فعالیت
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                                        {data.activity_desc || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* شناسایی خطر */}
                        <div>
                            <h3 className="text-lg font-semibold text-text mb-4 border-b border-gray-200 pb-2">
                                شناسایی خطر
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        شرح خطر
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                                        {data.hazard_desc || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        رویداد
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                                        {data.event_desc || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        پیامد
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                                        {data.consequence_desc || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        علت ریشه‌ای
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                                        {data.root_cause_desc || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        کنترل‌های موجود
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                                        {data.existing_controls_desc || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ارزیابی ریسک */}
                        <div>
                            <h3 className="text-lg font-semibold text-text mb-4 border-b border-gray-200 pb-2">
                                ارزیابی ریسک
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        A (احتمال وقوع)
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded text-center">
                                        {data.A || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        B (مدت زمان مواجهه)
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded text-center">
                                        {data.B || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        C (تعداد افراد در معرض)
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded text-center">
                                        {data.C || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        S (شدت پیامد)
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded text-center">
                                        {data.S || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        D (احتمال تشخیص)
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded text-center">
                                        {data.D || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        E (محاسبه شده)
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded text-center">
                                        {data.E || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        P (محاسبه شده)
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded text-center">
                                        {data.P || '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        RPN (محاسبه شده)
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded text-center font-bold">
                                        {data.RPN || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* وضعیت پذیرش */}
                        <div>
                            <h3 className="text-lg font-semibold text-text mb-4 border-b border-gray-200 pb-2">
                                وضعیت پذیرش
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        وضعیت پذیرش
                                    </label>
                                    <div className={`text-sm p-2 rounded text-center font-medium ${
                                        data.acceptance === 'HIGH_UNACCEPTABLE' ? 'bg-red-100 text-red-800' :
                                        data.acceptance === 'LEGAL_NONCOMPLIANT' ? 'bg-red-100 text-red-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                        {data.acceptance === 'HIGH_UNACCEPTABLE' ? 'غیرقابل قبول - بالا' :
                                         data.acceptance === 'LEGAL_NONCOMPLIANT' ? 'نامنطبق قانونی' :
                                         data.acceptance === 'LOW_ACCEPTABLE' ? 'قابل قبول - پایین' : data.acceptance}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 mb-1">
                                        شماره اقدام
                                    </label>
                                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                                        {data.action_number || '-'}
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
