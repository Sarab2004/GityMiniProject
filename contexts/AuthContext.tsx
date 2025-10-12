'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AuthUser, fetchMe, login as loginRequest, logout as logoutRequest } from '@/lib/auth'

interface AuthContextValue {
    user: AuthUser | null
    loading: boolean
    login: (username: string, password: string) => Promise<{ error?: string }>
    logout: () => Promise<void>
    refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loading, setLoading] = useState(true)

    const refresh = useCallback(async () => {
        setLoading(true)
        try {
            // اضافه کردن timeout برای جلوگیری از loading بی‌نهایت
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 5000)
            )

            const currentUser = (await Promise.race([fetchMe(), timeoutPromise])) as AuthUser | null
            setUser(currentUser)
        } catch (error) {
            console.log('Auth refresh failed:', error)
            setUser(null)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refresh()
    }, [refresh])

    const login = useCallback(async (username: string, password: string) => {
        const { user: loggedInUser, error } = await loginRequest(username, password)
        if (loggedInUser) {
            setUser(loggedInUser)
        }
        if (error) {
            return { error }
        }
        return {}
    }, [])

    const logout = useCallback(async () => {
        await logoutRequest()
        setUser(null)
    }, [])

    const value = useMemo(() => ({ user, loading, login, logout, refresh }), [user, loading, login, logout, refresh])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
