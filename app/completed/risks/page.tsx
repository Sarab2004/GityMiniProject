'use client'

import { useEffect, useState } from 'react'
import { fetchCompletedRisks, softDeleteRisk, type CompletedRisk } from '@/lib/data'

export default function CompletedRisksPage() {
    const [risks, setRisks] = useState<CompletedRisk[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadData = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchCompletedRisks()
            setRisks(data)
        } catch (err) {
            setError('دریافت اطلاعات با خطا روبرو شد.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleDelete = async (riskId: number) => {
        const confirmed = window.confirm('آیا از حذف نرم این ریسک مطمئن هستید؟')
        if (!confirmed) return
        try {
            await softDeleteRisk(riskId)
            await loadData()
        } catch (err) {
            setError('حذف ریسک با مشکل مواجه شد.')
        }
    }

    return (
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
            <header>
                <h1 className="text-2xl font-semibold text-text">ریسک‌های تکمیل شده</h1>
                <p className="mt-2 text-sm text-text2">ریسک‌هایی که پس از ارزیابی مجدد در وضعیت قابل قبول قرار گرفته‌اند.</p>
            </header>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-divider text-sm">
                        <thead className="bg-primarySubtle text-text">
                            <tr>
                                <th className="px-4 py-3 text-right font-medium">پروژه</th>
                                <th className="px-4 py-3 text-right font-medium">فرآیند</th>
                                <th className="px-4 py-3 text-right font-medium">پذیرش</th>
                                <th className="px-4 py-3 text-right font-medium">اقدام مرتبط</th>
                                <th className="px-4 py-3 text-right font-medium">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-text2">
                                        در حال بارگذاری...
                                    </td>
                                </tr>
                            ) : risks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center text-text2">
                                        ریسکی برای نمایش وجود ندارد.
                                    </td>
                                </tr>
                            ) : (
                                risks.map((risk) => (
                                    <tr key={risk.id} className="border-b border-divider">
                                        <td className="px-4 py-3">{risk.project_name ?? risk.project}</td>
                                        <td className="px-4 py-3">{risk.process_title}</td>
                                        <td className="px-4 py-3">{risk.acceptance2 ?? risk.acceptance}</td>
                                        <td className="px-4 py-3">{risk.action_number_text2 ?? risk.action_number_text ?? '-'}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(risk.id)}
                                                className="btn-danger px-4 py-2 text-xs"
                                            >
                                                حذف
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {error && <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
        </div>
    )
}
