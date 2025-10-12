"use client";

interface NoAccessProps {
  title?: string;
  description?: string;
  className?: string;
}

const DEFAULT_TITLE = "دسترسی مجاز نیست";
const DEFAULT_DESCRIPTION =
  "برای مشاهده یا انجام این عملیات به سطح دسترسی بالاتری نیاز دارید. در صورت نیاز با مدیر سیستم تماس بگیرید.";

export default function NoAccess({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  className,
}: NoAccessProps) {
  return (
    <div
      className={[
        "mx-auto max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-6 py-5 text-slate-700 shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6">{description}</p>
    </div>
  );
}
