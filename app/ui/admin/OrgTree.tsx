"use client";

import OrgNodeCard from "./OrgNodeCard";
import type { OrgNode } from "@/types/admin";

interface OrgTreeProps {
  nodes: OrgNode[];
  disabled?: boolean;
  onAddChild: (node: OrgNode) => void;
  onRename: (node: OrgNode) => void;
  onMove: (node: OrgNode) => void;
  onDelete: (node: OrgNode) => void;
}

export default function OrgTree({
  nodes,
  disabled,
  onAddChild,
  onRename,
  onMove,
  onDelete,
}: OrgTreeProps) {
  if (!nodes.length) {
    return null;
  }

  return (
    <div className="space-y-4">
      {nodes.map((node) => (
        <div key={node.id} className="space-y-3">
          <OrgNodeCard
            node={node}
            disabled={disabled}
            onAddChild={onAddChild}
            onRename={onRename}
            onMove={onMove}
            onDelete={onDelete}
          >
            {node.children && node.children.length > 0 ? (
              <div className="space-y-3 border-l border-slate-200 pl-4">
                <OrgTree
                  nodes={node.children}
                  disabled={disabled}
                  onAddChild={onAddChild}
                  onRename={onRename}
                  onMove={onMove}
                  onDelete={onDelete}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No subordinates. Use “Add” to create a child node.
              </p>
            )}
          </OrgNodeCard>
        </div>
      ))}
    </div>
  );
}
