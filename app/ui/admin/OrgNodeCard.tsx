"use client";

import type { ReactNode } from "react";
import type { OrgNode } from "@/types/admin";

interface OrgNodeCardProps {
  node: OrgNode;
  disabled?: boolean;
  onAddChild: (node: OrgNode) => void;
  onRename: (node: OrgNode) => void;
  onMove: (node: OrgNode) => void;
  onDelete: (node: OrgNode) => void;
  children?: ReactNode;
}

export default function OrgNodeCard({
  node,
  disabled,
  onAddChild,
  onRename,
  onMove,
  onDelete,
  children,
}: OrgNodeCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900">
            {node.display_name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              Level {node.level ?? 0}
            </span>
            {node.parent_id ? (
              <span>Parent ID: {node.parent_id}</span>
            ) : (
              <span>Root node</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onAddChild(node)}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
          >
            + Add
          </button>
          <button
            type="button"
            onClick={() => onRename(node)}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
          >
            Rename
          </button>
          <button
            type="button"
            onClick={() => onMove(node)}
            className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
          >
            Move
          </button>
          <button
            type="button"
            onClick={() => onDelete(node)}
            className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
          >
            Delete
          </button>
        </div>
      </div>
      {children ? (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}
