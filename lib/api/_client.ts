import { getCsrfToken } from "../auth";

type PrimitiveValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, PrimitiveValue | PrimitiveValue[]>;

const DEFAULT_PREFIX = "/api/v1";

const basePrefixValue = computeBasePrefix(process.env.NEXT_PUBLIC_API_PREFIX);

function computeBasePrefix(prefix?: string | null): string {
  if (!prefix) {
    return DEFAULT_PREFIX;
  }
  const trimmed = prefix.trim();
  if (trimmed.length === 0) {
    return DEFAULT_PREFIX;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.replace(/\/+$/, "");
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function joinPaths(base: string, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (/^https?:\/\//i.test(base)) {
    return `${stripTrailingSlash(base)}${cleanPath}`;
  }
  const cleanBase = stripTrailingSlash(base);
  return `${cleanBase}${cleanPath}`;
}

export function basePrefix(): string {
  return basePrefixValue;
}

function buildUrl(path: string, params?: QueryParams): string {
  const base = basePrefixValue || "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = joinPaths(base, normalizedPath);
  if (!params) {
    return url;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          searchParams.append(key, typeof item === "boolean" ? String(item) : String(item));
        }
      });
      continue;
    }
    searchParams.append(key, typeof value === "boolean" ? String(value) : String(value));
  }
  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
}

interface RequestOptions {
  body?: unknown;
  params?: QueryParams;
}

async function parseJson(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  let body: BodyInit | undefined;

  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      body = options.body;
    } else {
      body = JSON.stringify(options.body);
      headers["Content-Type"] = "application/json";
    }
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }
  }

  const response = await fetch(buildUrl(path, options.params), {
    method,
    headers,
    body,
    credentials: "include",
  });

  const parsed = (await parseJson(response)) as T | undefined;

  if (!response.ok) {
    const detail =
      typeof parsed === "object" && parsed !== null && "detail" in parsed
        ? String((parsed as Record<string, unknown>).detail)
        : response.statusText || "Request failed";
    throw new Error(`HTTP ${response.status}: ${detail}`);
  }

  return parsed as T;
}

export function apiGet<T>(path: string, params?: QueryParams): Promise<T> {
  return request<T>("GET", path, { params });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("POST", path, { body });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PATCH", path, { body });
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>("PUT", path, { body });
}

export function apiDelete<T>(path: string, params?: QueryParams): Promise<T> {
  return request<T>("DELETE", path, { params });
}
