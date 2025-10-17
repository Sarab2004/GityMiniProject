'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import SignupFormDemo from '@/components/signup-form-demo'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, loading } = useAuth()

    const nextPath = searchParams?.get('next') || '/'

    useEffect(() => {
        if (!loading && user) {
            router.replace(nextPath)
        }
    }, [loading, user, router, nextPath])

    return (
        <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-16">
            <div className="mx-auto w-full max-w-md px-4 py-8">
                <SignupFormDemo />
            </div>
        </div>
    )
}
