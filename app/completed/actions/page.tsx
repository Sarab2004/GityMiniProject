'use client'

import { useEffect, useState } from 'react'
import { fetchCompletedActions, softDeleteAction, type CompletedAction } from '@/lib/data'

export default function CompletedActionsPage() {
    const [actions, setActions] = useState<CompletedAction[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadData = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await fetchCompletedActions()
            setActions(data)
        } catch (err) {
            setError('دریافت اطلاعات با خطا روبرو شد.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleDelete = async (actionId: number) => {
        const confirmed = window.confirm('آیا از حذف نرم این اقدام مطمئن هستید؟')
        if (!confirmed) return
        try {
            await softDeleteAction(actionId)
            await loadData()
        } catch (err) {
            setError('حذف اقدام با مشکل مواجه شد.')
        }
    }

    return (
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
            <header>
                <h1 className="text-2xl font-semibold text-text">اقدام‌های موثر</h1>
                <p className="mt-2 text-sm text-text2">لیست اقدام‌هایی که اثربخشی آن‌ها تایید شده است.</p>
            </header>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-divider text-sm">
                        <thead className="bg-primarySubtle text-text">
                            <tr>
                                <th className="px-4 py-3 text-right font-medium">شناسه اقدام</th>
                                <th className="px-4 py-3 text-right font-medium">پروژه</th>
                                <th className="px-4 py-3 text-right font-medium">نوع درخواست</th>
                                <th className="px-4 py-3 text-right font-medium">عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-text2">
                                        در حال بارگذاری...
                                    </td>
                                </tr>
                            ) : actions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-text2">
                                        اقدامی برای نمایش وجود ندارد.
                                    </td>
                                </tr>
                            ) : (
                                actions.map((action) => (
                                    <tr key={action.id} className="border-b border-divider">
                                        <td className="px-4 py-3 font-medium text-primary">{action.indicator}</td>
                                        <td className="px-4 py-3">{action.project_name ?? action.project}</td>
                                        <td className="px-4 py-3">{action.request_type}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(action.id)}
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
