"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMyPermissions, type PermissionMatrix } from "@/lib/api/admin";
import type { Resource } from "@/types/admin";

type Action = "create" | "read" | "update" | "delete";

const RESOURCES: Resource[] = ["forms", "actions", "archive"];
const DEFAULT_MATRIX: PermissionMatrix = RESOURCES.reduce(
  (acc, resource) => {
    acc[resource] = {
      create: false,
      read: false,
      update: false,
      delete: false,
    };
    return acc;
  },
  {} as PermissionMatrix,
);

interface PermissionState {
  data: PermissionMatrix | null;
  loading: boolean;
  error: string | null;
}

export function usePermissions() {
  const stateRef = useRef<PermissionState>({
    data: null,
    loading: true,
    error: null,
  });
  const [, forceRender] = useState(() => ({}));

  const setState = useCallback((next: Partial<PermissionState>) => {
    stateRef.current = { ...stateRef.current, ...next };
    forceRender({});
  }, []);

  const fetchPermissions = useCallback(async () => {
    if (stateRef.current.loading === false) {
      // Always attempt refresh when explicitly requested.
      setState({ loading: true, error: null });
    }
    try {
      const result = await getMyPermissions();
      setState({ data: result, loading: false, error: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load permissions.";
      setState({ data: null, loading: false, error: message });
    }
  }, [setState]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!active) return;
      // Only fetch when data not yet loaded.
      if (stateRef.current.data === null) {
        setState({ loading: true, error: null });
        try {
          const result = await getMyPermissions();
          if (!active) return;
          setState({ data: result, loading: false, error: null });
        } catch (error) {
          if (!active) return;
          const message =
            error instanceof Error
              ? error.message
              : "Failed to load permissions.";
          setState({ data: null, loading: false, error: message });
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [setState]);

  const { data, loading, error } = stateRef.current;

  const permissions = useMemo<PermissionMatrix>(() => {
    if (!data) {
      return DEFAULT_MATRIX;
    }
    return RESOURCES.reduce((acc, resource) => {
      acc[resource] = {
        create: data[resource]?.create ?? false,
        read: data[resource]?.read ?? false,
        update: data[resource]?.update ?? false,
        delete: data[resource]?.delete ?? false,
      };
      return acc;
    }, {} as PermissionMatrix);
  }, [data]);

  const can = useCallback(
    (resource: Resource, action: Action) => {
      return Boolean(permissions[resource]?.[action] ?? false);
    },
    [permissions],
  );

  return {
    data: permissions,
    loading,
    error,
    can,
    refresh: fetchPermissions,
  };
}
