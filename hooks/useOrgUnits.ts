import { useEffect, useState } from 'react'
import { fetchOrgUnits, onProjectsChanged } from '@/lib/hse'
import type { OrgUnit } from '@/lib/hse'

export function useOrgUnits() {
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadOrgUnits = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await fetchOrgUnits()
            setOrgUnits(data)
        } catch (err) {
            console.error('Failed to load org units:', err)
            setError('خطا در بارگذاری واحدهای سازمانی')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadOrgUnits()

        // Listen for project changes (since org units might be affected by project changes)
        const unsubscribe = onProjectsChanged(() => {
            loadOrgUnits()
        })

        return unsubscribe
    }, [])

    return {
        orgUnits,
        loading,
        error,
        refetch: loadOrgUnits
    }
}
