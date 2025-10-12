"use client";

import type { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { Resource } from "@/types/admin";

type Action = "create" | "read" | "update" | "delete";

interface PermissionGateProps {
  resource: Resource;
  action: Action;
  children: ReactNode;
  fallback?: ReactNode;
}

const loadingSkeleton = (
  <span className="inline-flex h-4 w-20 animate-pulse rounded bg-slate-200 text-xs text-transparent">
    loading
  </span>
);

const errorMessage = (
  <span className="text-xs text-rose-600">عدم دریافت مجوزها</span>
);

export default function PermissionGate({
  resource,
  action,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { loading, error, can } = usePermissions();
  const permissionKey = `${resource}.${action}`;

  if (loading) {
    return (
      <span
        aria-hidden="true"
        data-permission={permissionKey}
        className="inline-flex"
      >
        {fallback ?? loadingSkeleton}
      </span>
    );
  }

  if (error) {
    return (
      <span data-permission={permissionKey} className="inline-flex">
        {fallback ?? errorMessage}
      </span>
    );
  }

  if (can(resource, action)) {
    return (
      <div data-permission={permissionKey} className="contents">
        {children}
      </div>
    );
  }

  if (fallback) {
    return (
      <div data-permission={permissionKey} className="contents">
        {fallback}
      </div>
    );
  }

  return <span data-permission={permissionKey} className="hidden" />;
}
