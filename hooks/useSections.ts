import { useEffect, useState, useCallback } from 'react'
import { fetchSections, fetchOrgUnits, onProjectsChanged } from '@/lib/hse'
import type { Section, OrgUnit } from '@/lib/hse'

export function useSections() {
    const [sections, setSections] = useState<Section[]>([])
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const [sectionsData, unitsData] = await Promise.all([
                fetchSections(),
                fetchOrgUnits()
            ])
            setSections(sectionsData)
            setOrgUnits(unitsData)
        } catch (err) {
            console.error('Failed to load sections and units:', err)
            setError('خطا در بارگذاری بخش‌ها و واحدها')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()

        // Listen for project changes (since sections might be affected by project changes)
        const unsubscribe = onProjectsChanged(() => {
            loadData()
        })

        return unsubscribe
    }, [loadData])

    return {
        sections,
        orgUnits,
        loading,
        error,
        refetch: loadData
    }
}
