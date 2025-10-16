import React from 'react'
import Link from 'next/link'
import { ArrowRightIcon, PrinterIcon, TrashIcon } from '@heroicons/react/24/outline'

interface FormLayoutProps {
    title: string
    code?: string
    children: React.ReactNode
    onReset?: () => void
    onSubmit?: () => void
    loading?: boolean
    error?: string | null
    success?: string | null
    footer?: React.ReactNode
    mobileFriendly?: boolean
}

export const FormLayout: React.FC<FormLayoutProps> = ({
    title,
    code,
    children,
    onReset,
    onSubmit,
    loading = false,
    error,
    success,
    footer,
    mobileFriendly = false,
}) => {
    const handlePrint = () => {
        window.print()
    }

    const renderDesktopHeader = () => (
        <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 space-x-reverse min-w-0">
                <Link
                    href="/"
                    className="flex items-center space-x-2 space-x-reverse text-text2 hover:text-text transition-colors"
                >
                    <ArrowRightIcon className="h-5 w-5" />
                    <span>بازگشت</span>
                </Link>
                <div className="h-6 w-px bg-border" />
                <div className="min-w-0">
                    <h1 className="text-lg font-semibold text-text truncate whitespace-nowrap">{title}</h1>
                    {code && (
                        <p className="text-sm text-muted font-mono truncate whitespace-nowrap">{code}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center space-x-3 space-x-reverse">
                {onReset && (
                    <button
                        onClick={onReset}
                        className="btn-secondary flex items-center space-x-2 space-x-reverse"
                        type="button"
                    >
                        <TrashIcon className="h-4 w-4" />
                        <span>پاک‌کردن فرم</span>
                    </button>
                )}
                <button
                    onClick={handlePrint}
                    className="btn-primary flex items-center space-x-2 space-x-reverse"
                    type="button"
                >
                    <PrinterIcon className="h-4 w-4" />
                    <span>پرینت</span>
                </button>
            </div>
        </div>
    )

    const renderMobileHeader = () => (
        <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between md:py-0 md:h-16">
            <div className="flex items-start gap-3 md:items-center md:gap-4 min-w-0">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-text2 hover:text-text transition-colors"
                >
                    <ArrowRightIcon className="h-5 w-5" />
                    <span className="text-sm whitespace-nowrap">بازگشت</span>
                </Link>
                <div className="h-6 w-px bg-border hidden md:block" />
                <div className="min-w-0 space-y-1">
                    <h1 className="text-lg font-semibold text-text truncate whitespace-nowrap">{title}</h1>
                    {code && (
                        <p className="text-sm text-muted font-mono truncate whitespace-nowrap">{code}</p>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row md:items-center md:gap-3">
                {onReset && (
                    <button
                        onClick={onReset}
                        className="btn-secondary flex items-center justify-center gap-2 w-full md:w-auto"
                        type="button"
                    >
                        <TrashIcon className="h-4 w-4" />
                        <span>پاک‌کردن فرم</span>
                    </button>
                )}
                <button
                    onClick={handlePrint}
                    className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto"
                    type="button"
                >
                    <PrinterIcon className="h-4 w-4" />
                    <span>پرینت</span>
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-bg">
            <header className="sticky top-0 z-10 bg-surface border-b border-border shadow-sm no-print">
                <div className="container mx-auto px-4">
                    {mobileFriendly ? renderMobileHeader() : renderDesktopHeader()}
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 py-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {children}
                </div>
                
                {/* Error and Success Messages */}
                {(error || success) && (
                    <div className="max-w-4xl mx-auto mt-6 no-print">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                                {success}
                            </div>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                {onSubmit && (
                    <div className="max-w-4xl mx-auto mt-8 no-print">
                        <div className="flex justify-center">
                            <button
                                onClick={onSubmit}
                                disabled={loading}
                                className="btn-primary px-8 py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'در حال ثبت...' : 'ثبت اطلاعات'}
                            </button>
                        </div>
                    </div>
                )}

                {footer && <div className="max-w-4xl mx-auto mt-8 no-print">{footer}</div>}
            </main>
        </div>
    )
}
