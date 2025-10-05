import { apiFetch, getCsrfToken } from '@/lib/auth'

export type CompletedRisk = {
    id: number
    project: number
    project_name?: string
    process_title: string
    acceptance: string
    acceptance2: string | null
    action_number_text: string | null
    action_number_text2: string | null
}

export type CompletedAction = {
    id: number
    indicator: string
    project: number
    project_name?: string
    request_type: string
    effective: boolean | null
}

export async function fetchCompletedRisks(): Promise<CompletedRisk[]> {
    const { data } = await apiFetch<CompletedRisk[]>('/api/v1/completed/risks', {
        method: 'GET',
        cache: 'no-store',
    })
    return data ?? []
}

export async function fetchCompletedActions(): Promise<CompletedAction[]> {
    const { data } = await apiFetch<CompletedAction[]>('/api/v1/completed/actions', {
        method: 'GET',
        cache: 'no-store',
    })
    return data ?? []
}

export async function softDeleteRisk(id: number): Promise<void> {
    await apiFetch(`/api/v1/risks/${id}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCsrfToken(),
        },
    })
}

export async function softDeleteAction(id: number): Promise<void> {
    await apiFetch(`/api/v1/actions/${id}/`, {
        method: 'DELETE',
        headers: {
            'X-CSRFToken': getCsrfToken(),
        },
    })
}
