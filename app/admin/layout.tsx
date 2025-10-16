/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useMemo } from "react";

import NoAccess from "@/components/ui/NoAccess";
import { useMeProfile } from "@/hooks/useAuth";
import { AdminBackBar } from "./components/AdminBackBar";

const tabs = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/organization", label: "Organization" },
];

export default function AdminLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { loading, error, isAdmin } = useMeProfile();

  const activeHref = useMemo(() => {
    if (!pathname) return "";
    for (const tab of tabs) {
      if (pathname === tab.href || pathname.startsWith(`${tab.href}/`)) {
        return tab.href;
      }
    }
    return "";
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="card w-full max-w-sm animate-pulse bg-white p-6 text-center text-sm text-slate-500">
          در حال بررسی سطح دسترسی ادمین...
        </div>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <NoAccess
          title="پنل ادمین"
          description="فقط ادمین‌ها به این بخش دسترسی دارند."
        />
      </div>
    );
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[AdminLayout] Admin access granted");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-6">
          <AdminBackBar />
          <div className="flex flex-col gap-4 py-6">
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
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
