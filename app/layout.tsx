import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'سیستم فرم‌های HSE',
    description: 'سیستم مدیریت فرم‌های ایمنی، بهداشت و محیط زیست',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="fa" dir="rtl">
            <body className="font-peyda">
                {children}
            </body>
        </html>
    )
}
