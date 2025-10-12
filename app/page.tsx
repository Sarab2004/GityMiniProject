import Link from "next/link";
import {
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  PencilSquareIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

import PermissionGate from "@/components/PermissionGate";
import NoAccess from "@/components/ui/NoAccess";

const forms = [
  {
    id: "fr-01-01",
    title:
      "OU,O_OU. OO�U,OO-UO/U_UOO'U_UOO�OU+U�/O�O�UOUOO�OO�",
    code: "FR-01-01-00",
    href: "/forms/fr-01-01",
    icon: DocumentTextIcon,
    description:
      "O�O\"O� U^ U_UOU_UOO�UO OU,O_OU.OO� OO�U,OO-UOOO U_UOO'U_UOO�OU+U� U^ O�O�UOUOO�OO�",
  },
  {
    id: "fr-01-02",
    title: "U_UOU_UOO�UO OU,O_OU.OO�",
    code: "FR-01-02-00",
    href: "/forms/fr-01-02",
    icon: ClipboardDocumentCheckIcon,
    description:
      "U_UOU_UOO�UO U^ O\"O�O�O3UO U^OO1UOO� OU,O_OU.OO� OU+O�OU. O'O_U�",
  },
  {
    id: "fr-01-03",
    title: "O�O\"O� U^ U_UOU_UOO�UO O�O�UOUOO�OO�",
    code: "FR-01-03-00",
    href: "/forms/fr-01-03",
    icon: PencilSquareIcon,
    description:
      "O�O\"O� U^ U.O_UOO�UOO� O�O�UOUOO�OO� O_O� U?O�O�UOU+O_U�O U^ O3UOO3O�U.?OU�O",
  },
  {
    id: "fr-01-12",
    title: "O�O'UcUOU, O�UOU. U�U.UOOO�OU+ HSE",
    code: "FR-01-12-00",
    href: "/forms/fr-01-12",
    icon: UserGroupIcon,
    description:
      "O�O'UcUOU, U^ U.O_UOO�UOO� O�UOU.?OU�OUO U�U.UOOO�OU+ OUOU.U+UO U^ O\"U�O_OO'O�",
  },
  {
    id: "fr-01-28",
    title: "O'U+OO3OUOUO U^ OO�O�UOOO\"UO O�UOO3Uc",
    href: "/forms/fr-01-28",
    icon: ExclamationTriangleIcon,
    description:
      "O'U+OO3OUOUOOO OO�O�UOOO\"UO U^ U.O_UOO�UOO� O�UOO3Uc?OU�OUO OUOU.U+UOOO O\"U�O_OO'O�UO U^ OU.U^OU,",
  },
  {
    id: "fr-01-10",
    title: "TBM - O�U.U^O�O' O-UOU+ UcOO�",
    code: "PR-01-07-01",
    href: "/forms/fr-01-10",
    icon: AcademicCapIcon,
    description:
      "O�O\"O� O�U,O3OO� O�U.U^O�O' O-UOU+ UcOO� U^ O�U.U^O�O'?OU�OUO OUOU.U+UO",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-text">
            O3UOO3O�U. U?O�U.?OU�OUO HSE
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-text2">
            O3UOO3O�U. U.O_UOO�UOO� U?O�U.?OU�OUO OUOU.U+UOOO O\"U�O_OO'O�
            U^ U.O-UOO� O�UOO3O�
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
                      O'O�U^O1 U?O�U. �+?
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
              O�O�O'UOU^ U?O�U.?OU�OUO O�O\"O� O'O_U�
            </Link>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
}
