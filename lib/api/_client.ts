import { apiBaseUrl, getCsrfToken } from "../auth";

type PrimitiveValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, PrimitiveValue | PrimitiveValue[]>;

const DEFAULT_PREFIX = "/v1";

const rawPrefix =
  process.env.NEXT_PUBLIC_API_PREFIX && process.env.NEXT_PUBLIC_API_PREFIX.trim()
    ? process.env.NEXT_PUBLIC_API_PREFIX
    : undefined;

const computedPrefix = computeBasePrefix(rawPrefix);
const basePrefixValue = ensureAbsolutePrefix(computedPrefix, apiBaseUrl);

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

function ensureAbsolutePrefix(prefix: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(prefix)) {
    return prefix.replace(/\/+$/, "");
  }
  if (baseUrl && /^https?:\/\//i.test(baseUrl)) {
    const cleanBase = stripTrailingSlash(baseUrl);
    const cleanPrefix = prefix.startsWith("/") ? prefix : `/${prefix}`;
    return `${cleanBase}${cleanPrefix}`.replace(/\/+$/, "");
  }
  return prefix.replace(/\/+$/, "");
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

class ApiError extends Error {
  status: number;
  data: unknown;
  messages: string[];

  constructor(status: number, message: string, data: unknown, messages: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.messages = messages;
  }
}

function flattenMessages(input: unknown, acc: string[] = [], seen = new Set<unknown>()): string[] {
  if (input === null || input === undefined) {
    return acc;
  }
  if (seen.has(input)) {
    return acc;
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.length > 0) {
      acc.push(trimmed);
    }
    return acc;
  }
  if (typeof input === "number" || typeof input === "boolean") {
    acc.push(String(input));
    return acc;
  }
  if (Array.isArray(input)) {
    input.forEach((item) => flattenMessages(item, acc, seen));
    return acc;
  }
  if (typeof input === "object") {
    seen.add(input);
    Object.values(input as Record<string, unknown>).forEach((value) => {
      flattenMessages(value, acc, seen);
    });
  }
  return acc;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const upperMethod = method.toUpperCase();
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
  } else if (["POST", "PUT", "PATCH", "DELETE"].includes(upperMethod)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }
  }

  const response = await fetch(buildUrl(path, options.params), {
    method: upperMethod,
    headers,
    body,
    credentials: "include",
  });

  const parsed = (await parseJson(response)) as T | undefined;

  if (!response.ok) {
    const messages = flattenMessages(parsed);
    const fallback = response.statusText || "Request failed";
    const message =
      messages.length > 0 ? messages[0] : `HTTP ${response.status}: ${fallback}`;
    throw new ApiError(response.status, message, parsed, messages);
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

export { ApiError };
