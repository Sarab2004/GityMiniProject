'use client'

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

import PermissionGate from "@/components/PermissionGate";
import NoAccess from "@/components/ui/NoAccess";
import { useAuth } from "@/contexts/AuthContext";
import { useMeProfile } from "@/hooks/useAuth";

const forms = [
  {
    id: "fr-01-01",
    title: "فرم ارزیابی ریسک/شناسایی خطرات",
    code: "FR-01-01-00",
    href: "/forms/fr-01-01",
    icon: DocumentTextIcon,
    description:
      "ارزیابی و شناسایی خطرات محیط کار و عوامل تهدیدکننده ایمنی",
  },
  {
    id: "fr-01-02",
    title: "فرم گزارش حادثه",
    code: "FR-01-02-00",
    href: "/forms/fr-01-02",
    icon: ClipboardDocumentCheckIcon,
    description:
      "گزارش و ثبت حوادث و رویدادهای ایمنی در محیط کار",
  },
  {
    id: "fr-01-03",
    title: "فرم اقدامات اصلاحی",
    code: "FR-01-03-00",
    href: "/forms/fr-01-03",
    icon: PencilSquareIcon,
    description:
      "ثبت و پیگیری اقدامات اصلاحی و پیشگیرانه برای بهبود ایمنی",
  },
  {
    id: "fr-01-12",
    title: "فرم آموزش کارکنان HSE",
    code: "FR-01-12-00",
    href: "/forms/fr-01-12",
    icon: UserGroupIcon,
    description:
      "ثبت و پیگیری آموزش‌های ایمنی و بهداشت کارکنان",
  },
  {
    id: "fr-01-28",
    title: "فرم بازرسی تجهیزات",
    href: "/forms/fr-01-28",
    icon: ExclamationTriangleIcon,
    description:
      "بازرسی و کنترل تجهیزات ایمنی و ابزارهای حفاظت فردی",
  },
  {
    id: "fr-01-10",
    title: "TBM - فرم آموزش عمومی",
    code: "PR-01-07-01",
    href: "/forms/fr-01-10",
    icon: AcademicCapIcon,
    description:
      "ثبت و پیگیری آموزش‌های عمومی ایمنی و بهداشت",
  },
];

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const {
    loading: profileLoading,
    error: profileError,
    isAdmin,
  } = useMeProfile();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // اضافه کردن timeout برای جلوگیری از loading بی‌نهایت
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout - redirecting to login');
        router.replace('/login');
      }
    }, 10000); // 10 ثانیه timeout

    return () => clearTimeout(timer);
  }, [loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-text2">در حال بارگذاری...</p>
          <p className="text-xs text-muted mt-2">اگر بیش از 10 ثانیه طول کشید، به صفحه لاگین هدایت می‌شوید</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-text">سیستم HSE</h1>
          </div>
          <div className="flex items-center space-x-4 space-x-reverse">
            <span className="text-sm text-text2">
              {user.full_name || user.username}
            </span>
            <button
              onClick={() => {
                logout().then(() => router.replace('/login'));
              }}
              className="text-sm text-danger hover:text-red-700"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-text">
            داشبورد HSE
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-text2">
            خوش آمدید، {user.full_name || user.username}
          </p>
        </div>

        <PermissionGate
          resource="forms"
          action="create"
          fallback={
            <NoAccess
              className="mx-auto mt-6 max-w-4xl"
              title="دسترسی به فرم‌های عملیاتی ندارید"
              description="برای ایجاد فرم جدید باید مجوز forms.create داشته باشید. در صورت نیاز با مدیر سیستم هماهنگ کنید."
            />
          }
        >
          <div className="mx-auto mb-8 flex max-w-6xl flex-col gap-4 md:flex-row md:items-stretch">
            {profileLoading ? (
              <div className="card flex-1 animate-pulse bg-surface p-6 text-left text-text2">
                در حال بررسی نقش‌های مدیریتی...
              </div>
            ) : isAdmin ? (
              <Link
                href="/admin"
                className="group card flex-1 p-6 transition-shadow duration-200 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 transition-colors duration-200 group-hover:bg-amber-600 group-hover:text-white">
                    <Cog6ToothIcon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-text transition-colors duration-200 group-hover:text-amber-700 group-hover:underline">
                      پنل ادمین
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-text2">
                      مدیریت کاربران، ساختار سازمانی و تنظیم مجوزها.
                    </p>
                  </div>
                </div>
              </Link>
            ) : null}
            {profileError && process.env.NODE_ENV !== "production" ? (
              <div className="card flex-1 border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                خطا در بررسی نقش ادمین: {profileError}
              </div>
            ) : null}
          </div>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => {
              const IconComponent = form.icon;
              return (
                <Link
                  key={form.id}
                  href={form.href}
                  className="group card p-6 transition-shadow duration-200 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start space-x-4 space-x-reverse">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primarySubtle transition-colors duration-200 group-hover:bg-primary">
                        <IconComponent className="h-6 w-6 text-primary transition-colors duration-200 group-hover:text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 text-lg font-semibold text-text transition-colors duration-200 group-hover:text-primary">
                        {form.title}
                      </h3>
                      {form.code ? (
                        <p className="font-mono text-sm text-muted">{form.code}</p>
                      ) : null}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-text2">
                    {form.description}
                  </p>
                  <div className="mt-4 border-t border-divider pt-4">
                    <span className="text-sm font-medium text-primary transition-colors duration-200 group-hover:text-primaryHover">
                      مشاهده فرم →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </PermissionGate>

        <div className="mt-16 text-center">
          <PermissionGate
            resource="archive"
            action="read"
            fallback={
              <NoAccess
                className="mx-auto max-w-md"
                title="دسترسی به آرشیو محدود است"
                description="برای مشاهده آرشیو به سطح دسترسی archive.read نیاز دارید."
              />
            }
          >
            <Link
              href="/archive"
              className="inline-flex items-center rounded-lg bg-blue-500 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-blue-600"
            >
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              مشاهده آرشیو فرم‌ها
            </Link>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
}
