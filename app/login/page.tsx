'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, login, loading } = useAuth()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const nextPath = searchParams?.get('next') || '/'

    useEffect(() => {
        if (!loading && user) {
            router.replace(nextPath)
        }
    }, [loading, user, router, nextPath])

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setSubmitting(true)
        setError(null)
        const result = await login(username, password)
        if (result.error) {
            setError(result.error)
            setSubmitting(false)
            return
        }
        setSubmitting(false)
        router.replace(nextPath)
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-16">
            <div className="card w-full max-w-md px-8 py-10 shadow-lg">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primarySubtle text-xl font-semibold text-primary">
                        HSE
                    </div>
                    <h1 className="text-2xl font-semibold text-text">ورود به سامانه فرم‌های HSE</h1>
                    <p className="mt-2 text-sm text-text2">برای دسترسی به فرم‌ها ابتدا وارد حساب سازمانی شوید.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="username" className="block text-sm font-medium text-text">
                            نام کاربری
                        </label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            placeholder="نام کاربری را وارد کنید"
                            className="form-control"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="password" className="block text-sm font-medium text-text">
                            رمز عبور
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="رمز عبور"
                            className="form-control"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={submitting} className="btn-primary w-full">
                        {submitting ? 'در حال ورود...' : 'ورود به سامانه'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <Link href="/" className="text-primary hover:text-primaryHover">
                        بازگشت به صفحه اصلی
                    </Link>
                </div>
            </div>
        </div>
    )
}
