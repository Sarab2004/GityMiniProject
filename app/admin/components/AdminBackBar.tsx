'use client'

import { useRouter } from 'next/navigation'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

interface AdminBackBarProps {
    label?: string
    href?: string
}

export const AdminBackBar: React.FC<AdminBackBarProps> = ({
    label = 'بازگشت',
    href
}) => {
    const router = useRouter()

    const handleBack = () => {
        if (href) {
            router.push(href)
        } else {
            // Always redirect to main dashboard (home page)
            router.push('/')
        }
    }

    return (
        <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4 space-x-reverse min-w-0">
                <button
                    onClick={handleBack}
                    className="flex items-center space-x-2 space-x-reverse text-slate-600 hover:text-slate-900 transition-colors"
                    aria-label="بازگشت"
                >
                    <ArrowRightIcon className="h-5 w-5" />
                    <span>{label}</span>
                </button>
                <div className="h-6 w-px bg-slate-200" />
                <div className="min-w-0">
                    <h1 className="text-lg font-semibold text-slate-900 truncate whitespace-nowrap">
                        پنل مدیریت
                    </h1>
                </div>
            </div>
        </div>
    )
}
