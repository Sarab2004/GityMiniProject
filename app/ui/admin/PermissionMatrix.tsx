"use client";

import { useMemo } from "react";
import type { PermissionEntry, Resource } from "@/types/admin";

const RESOURCES: Resource[] = ["forms", "actions", "archive"];

const ACTION_FIELDS: Array<{ key: keyof PermissionEntry; label: string }> = [
  { key: "can_create", label: "Create" },
  { key: "can_read", label: "Read" },
  { key: "can_update", label: "Update" },
  { key: "can_delete", label: "Delete" },
];

const HEADER_LABEL: Record<Resource, string> = {
  forms: "Forms",
  actions: "Actions",
  archive: "Archive",
};

interface PermissionMatrixProps {
  value: PermissionEntry[];
  onChange: (value: PermissionEntry[]) => void;
  disabled?: boolean;
  className?: string;
}

function normalize(entries: PermissionEntry[]): PermissionEntry[] {
  const map = new Map<Resource, PermissionEntry>();
  entries.forEach((entry) => map.set(entry.resource, entry));
  return RESOURCES.map((resource) => {
    const existing = map.get(resource);
    return {
      resource,
      can_create: existing?.can_create ?? false,
      can_read: existing?.can_read ?? false,
      can_update: existing?.can_update ?? false,
      can_delete: existing?.can_delete ?? false,
    };
  });
}

export default function PermissionMatrix({
  value,
  onChange,
  disabled,
  className,
}: PermissionMatrixProps) {
  const normalized = useMemo(() => normalize(value), [value]);

  const handleToggle = (
    resource: Resource,
    field: keyof PermissionEntry,
    nextValue: boolean,
  ) => {
    const next = normalized.map((entry) =>
      entry.resource === resource
        ? {
            ...entry,
            [field]: nextValue,
          }
        : entry,
    );
    onChange(next);
  };

  return (
    <div
      className={["overflow-hidden rounded-lg border border-slate-200", className]
        .filter(Boolean)
        .join(" ")}
    >
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
              Resource
            </th>
            {ACTION_FIELDS.map((action) => (
              <th
                key={action.key}
                className="px-3 py-3 text-center text-sm font-semibold text-slate-600"
              >
                {action.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {normalized.map((entry) => (
            <tr key={entry.resource}>
              <td className="px-4 py-3 text-sm font-medium text-slate-800">
                {HEADER_LABEL[entry.resource]}
              </td>
              {ACTION_FIELDS.map((action) => (
                <td key={action.key} className="px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    checked={Boolean(entry[action.key])}
                    disabled={disabled}
                    onChange={(event) =>
                      handleToggle(
                        entry.resource,
                        action.key,
                        event.currentTarget.checked,
                      )
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
