/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useMemo } from "react";

const tabs = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/organization", label: "Organization" },
];

export default function AdminLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();

  const activeHref = useMemo(() => {
    if (!pathname) return "";
    for (const tab of tabs) {
      if (pathname === tab.href || pathname.startsWith(`${tab.href}/`)) {
        return tab.href;
      }
    }
    return "";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6">
          <h1 className="text-2xl font-semibold text-slate-900">پنل ادمین</h1>
          <nav aria-label="مدیریت">
            <ul className="flex gap-3">
              {tabs.map((tab) => {
                const isActive = activeHref === tab.href;
                return (
                  <li key={tab.href}>
                    <Link
                      href={tab.href}
                      className={[
                        "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-slate-900 text-white shadow"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
                      ].join(" ")}
                    >
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
