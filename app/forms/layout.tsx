'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import NoAccess from '@/components/ui/NoAccess';

export default function FormsLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const {
    loading: permLoading,
    error: permError,
    can,
  } = usePermissions();

  useEffect(() => {
    if (!loading && !user) {
      const nextParam = encodeURIComponent(pathname ?? '/');
      router.replace(`/login?next=${nextParam}`);
    }
  }, [loading, user, router, pathname]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="card w-full max-w-xs p-6 text-center text-sm text-text2">
          {loading ? 'در حال بررسی ورود...' : 'برای مشاهده فرم‌ها باید وارد شوید.'}
        </div>
      </div>
    );
  }

  if (permLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="card w-full max-w-xs p-6 text-center text-sm text-text2">
          در حال بررسی مجوزهای دسترسی...
        </div>
      </div>
    );
  }

  if (permError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <NoAccess
          title="عدم دریافت مجوزها"
          description="امکان بررسی سطح دسترسی شما فراهم نشد. لطفاً بعداً دوباره تلاش کنید."
        />
      </div>
    );
  }

  if (!can('forms', 'create')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4">
        <NoAccess
          title="دسترسی به فرم‌ها محدود است"
          description="برای ایجاد یا مشاهده فرم‌های عملیاتی به سطح دسترسی forms.create نیاز دارید."
        />
      </div>
    );
  }

  return <>{children}</>;
}
