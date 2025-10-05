'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function FormsLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading && !user) {
            const nextParam = encodeURIComponent(pathname ?? '/')
            router.replace(`/login?next=${nextParam}`)
        }
    }, [loading, user, router, pathname])

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-bg">
                <div className="card w-full max-w-xs p-6 text-center text-sm text-text2">
                    {loading ? 'در حال بررسی دسترسی...' : 'در حال هدایت به صفحه ورود'}
                </div>
            </div>
        )
    }

    return <>{children}</>
}
