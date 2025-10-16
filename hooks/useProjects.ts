import { useEffect, useState } from 'react'
import { fetchProjects, onProjectsChanged } from '@/lib/hse'
import type { Project } from '@/lib/hse'

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadProjects = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await fetchProjects()
            // Ensure all projects have proper status for backward compatibility
            const normalizedProjects = data.map(project => ({
                ...project,
                status: project.status || (project.is_active ? 'ACTIVE' : 'ARCHIVED')
            }))
            setProjects(normalizedProjects)
        } catch (err) {
            console.error('Failed to load projects:', err)
            setError('خطا در بارگذاری پروژه‌ها')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadProjects()

        // Listen for project changes
        const unsubscribe = onProjectsChanged(() => {
            loadProjects()
        })

        return unsubscribe
    }, [])

    return {
        projects,
        loading,
        error,
        refetch: loadProjects
    }
}
