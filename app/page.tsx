import Link from 'next/link'
import {
    DocumentTextIcon,
    ClipboardDocumentCheckIcon,
    PencilSquareIcon,
    UserGroupIcon,
    ExclamationTriangleIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline'

const forms = [
    {
        id: 'fr-01-01',
        title: 'اقدام اصلاحی/پیشگیرانه/تغییرات',
        code: 'FR-01-01-00',
        href: '/forms/fr-01-01',
        icon: DocumentTextIcon,
        description: 'ثبت و پیگیری اقدامات اصلاحی، پیشگیرانه و تغییرات'
    },
    {
        id: 'fr-01-02',
        title: 'پیگیری اقدامات',
        code: 'FR-01-02-00',
        href: '/forms/fr-01-02',
        icon: ClipboardDocumentCheckIcon,
        description: 'پیگیری و بررسی وضعیت اقدامات انجام شده'
    },
    {
        id: 'fr-01-03',
        title: 'ثبت و پیگیری تغییرات',
        code: 'FR-01-03-00',
        href: '/forms/fr-01-03',
        icon: PencilSquareIcon,
        description: 'ثبت و مدیریت تغییرات در فرآیندها و سیستم‌ها'
    },
    {
        id: 'fr-01-12',
        title: 'تشکیل تیم همیاران HSE',
        code: 'FR-01-12-00',
        href: '/forms/fr-01-12',
        icon: UserGroupIcon,
        description: 'تشکیل و مدیریت تیم‌های همیاران ایمنی و بهداشت'
    },
    {
        id: 'fr-01-28',
        title: 'شناسایی و ارزیابی ریسک',
        href: '/forms/fr-01-28',
        icon: ExclamationTriangleIcon,
        description: 'شناسایی، ارزیابی و مدیریت ریسک‌های ایمنی، بهداشتی و اموال'
    },
    {
        id: 'fr-01-10',
        title: 'TBM - آموزش حین کار',
        code: 'PR-01-07-01',
        href: '/forms/fr-01-10',
        icon: AcademicCapIcon,
        description: 'ثبت جلسات آموزش حین کار و آموزش‌های ایمنی'
    }
]

export default function HomePage() {
    return (
        <div className="min-h-screen bg-bg">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-text mb-4">
                        سیستم فرم‌های HSE
                    </h1>
                    <p className="text-lg text-text2 max-w-2xl mx-auto">
                        سیستم مدیریت فرم‌های ایمنی، بهداشت و محیط زیست
                    </p>
                </div>

                {/* Forms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {forms.map((form) => {
                        const IconComponent = form.icon
                        return (
                            <Link
                                key={form.id}
                                href={form.href}
                                className="card p-6 hover:shadow-md transition-shadow duration-200 group"
                            >
                                <div className="flex items-start space-x-4 space-x-reverse mb-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-primarySubtle rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors duration-200">
                                            <IconComponent className="h-6 w-6 text-primary group-hover:text-white transition-colors duration-200" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-text mb-1 group-hover:text-primary transition-colors duration-200">
                                            {form.title}
                                        </h3>
                                        {form.code && (
                                            <p className="text-sm text-muted font-mono">
                                                {form.code}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-text2 leading-relaxed">
                                    {form.description}
                                </p>
                                <div className="mt-4 pt-4 border-t border-divider">
                                    <span className="text-sm text-primary font-medium group-hover:text-primaryHover transition-colors duration-200">
                                        شروع فرم ←
                                    </span>
                                </div>
                            </Link>
                        )
                    })}
                </div>

                {/* Archive Section */}
                <div className="text-center mt-16">
                    <Link
                        href="/archive"
                        className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
                    >
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        آرشیو فرم‌های ثبت شده
                    </Link>
                </div>
            </div>
        </div>
    )
}
