import { apiDelete, apiGet } from "./_client";
import type { ArchiveFilters, ArchiveListItem } from "@/types/archive";

function buildArchivePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

async function logRequest<T>(
  action: string,
  payload: Record<string, unknown> | undefined,
  runner: () => Promise<T>,
): Promise<T> {
  const hasConsole = typeof console !== "undefined";
  const canGroup =
    hasConsole && typeof console.groupCollapsed === "function" && typeof console.groupEnd === "function";

  if (canGroup) {
    console.groupCollapsed(`[Archive API] ${action}`);
  }
  if (hasConsole && payload) {
    console.log("payload", payload);
  }

  try {
    const response = await runner();
    if (hasConsole) {
      console.log("response", response);
    }
    return response;
  } catch (error) {
    if (hasConsole) {
      console.error("error", error);
    }
    throw error;
  } finally {
    if (canGroup) {
      console.groupEnd();
    }
  }
}

export function getArchiveList(filters?: ArchiveFilters): Promise<ArchiveListItem[]> {
  return logRequest(
    "getArchiveList",
    filters ? { filters } : undefined,
    () => apiGet<ArchiveListItem[]>(buildArchivePath("archive/"), filters),
  );
}

export function deleteEntry(formCode: string, entryId: number): Promise<void> {
  return logRequest(
    "deleteEntry",
    { formCode, entryId },
    () => apiDelete<void>(buildArchivePath(`/forms/${formCode}/entries/${entryId}/`)),
  );
}
