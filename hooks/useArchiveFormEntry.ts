import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { getArchiveEntry } from "@/lib/api/archive";
import type { FormEntryPayload } from "@/types/archive";
import { usePermissions } from "@/hooks/usePermissions";

interface UseArchiveFormEntryResult {
  isEditMode: boolean;
  entryId: number | null;
  loading: boolean;
  error: string | null;
  entry: FormEntryPayload | null;
  canEditArchiveEntries: boolean;
}

export function useArchiveFormEntry(formCode: string): UseArchiveFormEntryResult {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const entryIdParam = searchParams.get("entryId");
  const entryId = entryIdParam ? Number(entryIdParam) : null;
  const isEditMode = mode === "edit" && entryId !== null && !Number.isNaN(entryId);

  const { can } = usePermissions();
  const canEditArchiveEntries = useMemo(
    () => can("archive", "update"),
    [can],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entry, setEntry] = useState<FormEntryPayload | null>(null);

  useEffect(() => {
    if (!isEditMode || entryId === null) {
      setEntry(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchEntry = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getArchiveEntry(formCode, entryId);
        if (!cancelled) {
          setEntry(data);
        }
      } catch (err) {
        console.error("Failed to load archive entry", err);
        if (!cancelled) {
          setError("دریافت دادهٔ فرم برای ویرایش ممکن نشد.");
          setEntry(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchEntry();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, entryId, formCode]);

  return {
    isEditMode,
    entryId,
    loading,
    error,
    entry,
    canEditArchiveEntries,
  };
}
