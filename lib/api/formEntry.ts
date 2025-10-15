import { apiGet, apiPatch } from "./_client";
import type { FormEntryResponse } from "@/lib/formEntry";

const buildEntryPath = (formCode: string, entryId: number) => `/forms/${formCode}/entries/${entryId}/`;

async function logFormEntryRequest<T>(
  action: string,
  payload: Record<string, unknown>,
  runner: () => Promise<T>,
): Promise<T> {
  const hasConsole = typeof console !== "undefined";
  const canGroup =
    hasConsole && typeof console.groupCollapsed === "function" && typeof console.groupEnd === "function";

  if (canGroup) {
    console.groupCollapsed(`[FormEntry API] ${action}`);
  }
  if (hasConsole) {
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

export function getEntry<TServer = Record<string, unknown>>(
  formCode: string,
  entryId: number,
): Promise<FormEntryResponse<TServer>> {
  return logFormEntryRequest(
    "getEntry",
    { formCode, entryId },
    () => apiGet<FormEntryResponse<TServer>>(buildEntryPath(formCode, entryId)),
  );
}

export function updateEntry<TServer = Record<string, unknown>>(
  formCode: string,
  entryId: number,
  payload: Partial<TServer>,
): Promise<FormEntryResponse<TServer>> {
  return logFormEntryRequest(
    "updateEntry",
    { formCode, entryId, payload },
    () => apiPatch<FormEntryResponse<TServer>>(buildEntryPath(formCode, entryId), payload),
  );
}
