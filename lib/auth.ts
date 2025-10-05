export type AuthUser = {
    id: number
    username: string
    full_name: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:8000'

export const apiBaseUrl = API_BASE

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    const value = document.cookie
        .split(';')
        .map((part) => part.trim())
        .find((cookie) => cookie.startsWith(`${name}=`))
    return value ? decodeURIComponent(value.split('=')[1]) : null
}

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
    if (response.status === 204) {
        return null
    }
    try {
        return (await response.json()) as T
    } catch (error) {
        return null
    }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<{ data?: T; response: Response }> {
    const response = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers ?? {}),
        },
        ...options,
    })
    if (response.ok) {
        const data = await parseJsonSafe<T>(response)
        return { data: data ?? ({} as T), response }
    }
    const errorPayload = (await parseJsonSafe<T>(response)) ?? ({ detail: 'خطای ناشناخته' } as T)
    return { data: errorPayload, response }
}

export async function fetchMe(): Promise<AuthUser | null> {
    const { data, response } = await apiFetch<{ user: AuthUser }>('/api/v1/auth/me', {
        method: 'GET',
        cache: 'no-store',
    })
    if (!response.ok) {
        return null
    }
    return data?.user ?? null
}

export async function login(username: string, password: string): Promise<{ user?: AuthUser; error?: string }> {
    const csrf = getCookie('csrftoken') ?? ''
    const { data, response } = await apiFetch<{ user: AuthUser; detail?: string }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: {
            'X-CSRFToken': csrf,
        },
    })
    if (!response.ok) {
        const message = (data as { detail?: string })?.detail ?? 'ورود ناموفق بود.'
        return { error: message }
    }
    return { user: data?.user }
}

export async function logout(): Promise<void> {
    const csrf = getCookie('csrftoken') ?? ''
    await apiFetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrf,
        },
    })
}

export function getCsrfToken(): string {
    return getCookie('csrftoken') ?? ''
}
