import React from 'react'
import Link from 'next/link'
import { ArrowRightIcon, PrinterIcon, TrashIcon } from '@heroicons/react/24/outline'

interface FormLayoutProps {
    title: string
    code?: string
    children: React.ReactNode
    onReset?: () => void
}

export const FormLayout: React.FC<FormLayoutProps> = ({
    title,
    code,
    children,
    onReset
}) => {
    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="min-h-screen bg-bg">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-surface border-b border-border shadow-sm no-print">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
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
                                <h1 className="text-lg font-semibold text-text">{title}</h1>
                                {code && (
                                    <p className="text-sm text-muted font-mono">{code}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 space-x-reverse">
                            <button
                                onClick={onReset}
                                className="btn-secondary flex items-center space-x-2 space-x-reverse"
                            >
                                <TrashIcon className="h-4 w-4" />
                                <span>پاک‌کردن فرم</span>
                            </button>
                            <button
                                onClick={handlePrint}
                                className="btn-primary flex items-center space-x-2 space-x-reverse"
                            >
                                <PrinterIcon className="h-4 w-4" />
                                <span>پرینت</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Form Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
