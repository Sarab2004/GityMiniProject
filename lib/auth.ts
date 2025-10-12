export type AuthUser = {
  id: number
  username: string
  full_name: string
}

// تنظیم مستقیم API_BASE برای حل مشکل .env.local
const API_BASE = "http://localhost:8000/api";

// Debug: نمایش مقدار API_BASE (حذف شده)
// console.log('API_BASE:', API_BASE);
// console.log('NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);

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

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<{ data?: T; response: Response }> {
  try {
    const headers: Record<string, string> = {};
    const providedHeaders = options?.headers;

    if (providedHeaders instanceof Headers) {
      providedHeaders.forEach((value, key) => (headers[key] = value));
    } else if (Array.isArray(providedHeaders)) {
      for (const [key, value] of providedHeaders) headers[key] = value;
    } else if (providedHeaders) {
      Object.assign(headers, providedHeaders as Record<string, string>);
    }

    if (options?.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    // NEW: تضمین JSON و تزریق CSRF برای درخواست‌های تغییردهنده
    headers["Accept"] = headers["Accept"] ?? "application/json";
    const method = (options?.method ?? "GET").toUpperCase();
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && !headers["X-CSRFToken"]) {
      const csrftoken = getCookie("csrftoken");
      if (csrftoken) headers["X-CSRFToken"] = csrftoken;
    }

    const fetchOptions: RequestInit = {
      ...options,
      credentials: options?.credentials ?? "include",
      headers,
    };

    const buildUrl = (p: string) => {
      if (p.startsWith('http')) return p
      // حذف شرط مشکل‌ساز: if (p.startsWith('/api/')) return p
      if (p.startsWith('/v1/')) return `${API_BASE}${p}`  // مسیرهای v1
      return `${API_BASE}${p}`
    }
    const response = await fetch(buildUrl(path), fetchOptions);
    if (response.ok) {
      const data = await parseJsonSafe<T>(response);
      return { data: data ?? ({} as T), response };
    }
    const errorPayload = (await parseJsonSafe<T>(response)) ?? ({ detail: "خطای ناشناخته" } as T);
    return { data: errorPayload, response };
  } catch (error) {
    console.error("apiFetch network error", error);
    throw new Error("NETWORK_ERROR");
  }
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const { data, response } = await apiFetch<{ user: AuthUser }>('/v1/auth/me/', {
      method: 'GET',
      cache: 'no-store',
    })
    if (!response.ok) {
      return null
    }
    return data?.user ?? null
  } catch (error) {
    return null
  }
}

export async function login(username: string, password: string): Promise<{ user?: AuthUser; error?: string }> {
  let csrf = getCookie('csrftoken') ?? ''
  if (!csrf) {
    try {
      await apiFetch('/v1/csrf/', { method: 'GET' })
    } catch (error) {
      console.warn('Failed to fetch CSRF token before login', error)
    }
    csrf = getCookie('csrftoken') ?? ''
  }
  try {
    const { data, response } = await apiFetch<{ user: AuthUser; detail?: string }>('/v1/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrf,
      },
    })
    if (!response.ok) {
      const message = (data as { detail?: string })?.detail ?? 'ورود ناموفق بود.'
      return { error: message }
    }
    return { user: data?.user }
  } catch (error) {
    return { error: 'اتصال به سرور برقرار نشد. لطفاً بعداً دوباره تلاش کنید.' }
  }
}

export async function logout(): Promise<void> {
  const csrf = getCookie('csrftoken') ?? ''
  try {
    await apiFetch('/v1/auth/logout/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrf,
      },
    })
  } catch (error) {
    console.warn('Logout failed due to network error', error)
  }
}

export function getCsrfToken(): string {
  return getCookie('csrftoken') ?? ''
}
