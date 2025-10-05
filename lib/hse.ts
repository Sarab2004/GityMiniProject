import { apiFetch, getCsrfToken } from './auth'

export type Option = { value: string; label: string }

export type Project = {
    id: number
    code: string
    name: string
}

export type Contractor = { id: number; name: string }
export type OrgUnit = { id: number; name: string }
export type Section = { id: number; name: string; org_unit: number }

export async function fetchProjects(): Promise<Project[]> {
    const { data } = await apiFetch<Project[]>('/api/v1/projects/', { method: 'GET' })
    return data ?? []
}

export async function fetchContractors(): Promise<Contractor[]> {
    const { data } = await apiFetch<Contractor[]>('/api/v1/contractors/', { method: 'GET' })
    return data ?? []
}

export async function createContractor(name: string): Promise<Contractor> {
    const { data, response } = await apiFetch<Contractor>('/api/v1/contractors/', {
        method: 'POST',
        body: JSON.stringify({ name }),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok || !data) {
        throw new Error((data as any)?.detail ?? 'ثبت پیمانکار امکان‌پذیر نشد')
    }
    return data
}

export async function fetchOrgUnits(): Promise<OrgUnit[]> {
    const { data } = await apiFetch<OrgUnit[]>('/api/v1/org-units/', { method: 'GET' })
    return data ?? []
}

export async function createOrgUnit(name: string): Promise<OrgUnit> {
    const { data, response } = await apiFetch<OrgUnit>('/api/v1/org-units/', {
        method: 'POST',
        body: JSON.stringify({ name }),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok || !data) {
        throw new Error((data as any)?.detail ?? 'ثبت واحد امکان‌پذیر نشد')
    }
    return data
}

export async function fetchSections(): Promise<Section[]> {
    const { data } = await apiFetch<Section[]>('/api/v1/sections/', { method: 'GET' })
    return data ?? []
}

export async function createSection(name: string, orgUnit: number): Promise<Section> {
    const { data, response } = await apiFetch<Section>('/api/v1/sections/', {
        method: 'POST',
        body: JSON.stringify({ name, org_unit: orgUnit }),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok || !data) {
        throw new Error((data as any)?.detail ?? 'ثبت بخش امکان‌پذیر نشد')
    }
    return data
}

export type ActionSummary = {
    id: number
    indicator: string
    project: number
    request_type: string
}

export async function fetchActions(): Promise<ActionSummary[]> {
    const { data } = await apiFetch<ActionSummary[]>('/api/v1/actions/', { method: 'GET' })
    return data ?? []
}

export type CreateActionPayload = {
    project: number
    requester_name: string
    requester_unit_text: string
    request_date: string
    request_type: 'CORRECTIVE' | 'PREVENTIVE' | 'CHANGE' | 'SUGGESTION'
    sources: string[]
    nonconformity_or_change_desc: string
    root_cause_or_goal_desc: string
    needs_risk_update: boolean
    risk_update_date?: string | null
    creates_knowledge: boolean
    approved_by_performer_name?: string | null
    approved_by_manager_name?: string | null
}

export type ActionFormResponse = {
    id: number
    indicator: string
}

export async function createActionForm(payload: CreateActionPayload): Promise<ActionFormResponse> {
    const { data, response } = await apiFetch<ActionFormResponse>('/api/v1/actions/', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok || !data) {
        throw new Error((data as any)?.detail ?? 'خطا در ایجاد اقدام')
    }
    return data
}

export type CreateActionItemPayload = {
    description_text: string
    resources_text: string
    due_date: string | null
    owner_text: string
}

export async function createActionItem(actionId: number, payload: CreateActionItemPayload): Promise<void> {
    const { response, data } = await apiFetch(`/api/v1/actions/${actionId}/items/`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok) {
        throw new Error((data as any)?.detail ?? 'ثبت آیتم اقدام ناموفق بود')
    }
}

export type ExecutionReportPayload = {
    report_no: 1 | 2
    approved: boolean
    note?: string
    new_date?: string | null
}

export async function submitExecutionReport(actionId: number, payload: ExecutionReportPayload): Promise<void> {
    const { response, data } = await apiFetch(`/api/v1/actions/${actionId}/execution-report/`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok) {
        throw new Error((data as any)?.detail ?? 'ثبت گزارش اجرا ناموفق بود')
    }
}

export type EffectivenessPayload = {
    checked_at: string
    method_text: string
    effective: boolean
    new_action_indicator?: string | null
}

export async function submitEffectiveness(actionId: number, payload: EffectivenessPayload): Promise<void> {
    const { response, data } = await apiFetch(`/api/v1/actions/${actionId}/effectiveness/`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok) {
        throw new Error((data as any)?.detail ?? 'ثبت ارزیابی اثربخشی ناموفق بود')
    }
}

export type CreateRiskPayload = {
    project: number
    unit: number
    section?: number | null
    process_title: string
    activity_desc: string
    routine_flag: 'R' | 'N'
    hazard_desc: string
    event_desc: string
    consequence_desc: string
    root_cause_desc: string
    existing_controls_desc: string
    inputs: string[]
    legal_requirement_text?: string
    legal_status: 'COMPLIANT' | 'NONCOMPLIANT'
    risk_type: 'SAFETY' | 'HEALTH' | 'PROPERTY'
    A: number
    B: number
    C: number
    S: number
    D: number
    action_number_text?: string | null
}

export type RiskRecordResponse = {
    id: number
    acceptance: string
}

export async function createRiskRecord(payload: CreateRiskPayload) {
    const { data, response } = await apiFetch<RiskRecordResponse>('/api/v1/risks/', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok || !data) {
        throw new Error((data as any)?.detail ?? 'ثبت ریسک ناموفق بود')
    }
    return data
}

export type RiskReevalPayload = {
    A2: number
    B2: number
    C2: number
    S2: number
    D2: number
    action_number_text2?: string | null
}

export async function submitRiskReevaluation(id: number, payload: RiskReevalPayload) {
    const { response, data } = await apiFetch(`/api/v1/risks/${id}/reeval/`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok) {
        throw new Error((data as any)?.detail ?? 'ثبت ارزیابی مجدد ناموفق بود')
    }
}

export type CreateSafetyTeamPayload = {
    project: number
    prepared_by_name: string
    approved_by_name: string
}

export type TeamMemberPayload = {
    contractor?: number | null
    unit?: number | null
    section?: number | null
    representative_name: string
    signature_text?: string
    tbm_no?: string
}

export async function createSafetyTeam(payload: CreateSafetyTeamPayload) {
    const { data, response } = await apiFetch<{ id: number }>('/api/v1/safety-teams/', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok || !data) {
        throw new Error((data as any)?.detail ?? 'ایجاد تیم همیاران موفق نبود')
    }
    return data
}

export async function addTeamMember(teamId: number, payload: TeamMemberPayload) {
    const { response, data } = await apiFetch(`/api/v1/safety-teams/${teamId}/members/`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok) {
        throw new Error((data as any)?.detail ?? 'ثبت عضو تیم ناموفق بود')
    }
}

export type CreateActionTrackingPayload = {
    action: number
    issue_desc: string
    action_desc: string
    source: string
    executor_text: string
    due_date: string
    review_date_1?: string | null
    review_date_2?: string | null
    review_date_3?: string | null
    resolved?: boolean | null
    is_knowledge?: boolean | null
    effective?: boolean | null
    new_action_indicator?: string | null
}

export async function createActionTracking(payload: CreateActionTrackingPayload) {
    const { data, response } = await apiFetch('/api/v1/action-trackings/', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok) {
        throw new Error((data as any)?.detail ?? 'ثبت پیگیری اقدام ناموفق بود')
    }
    return data
}

export type CreateChangeLogPayload = {
    action: number
    subject_text: string
    date_registered: string
    date_applied: string
    owner_text: string
    required_actions_text: string
    related_action_no_text?: string
    notes_text?: string
}

export async function createChangeLog(payload: CreateChangeLogPayload) {
    const { data, response } = await apiFetch('/api/v1/changes/', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok) {
        throw new Error((data as any)?.detail ?? 'ثبت تغییر ناموفق بود')
    }
    return data
}

// TBM (Toolbox Meeting) API functions
export interface CreateTBMPayload {
    tbm_no: string
    project: number
    date: string
    topic_text: string
    trainer_text: string
    location_text?: string
    notes_text?: string
}

export interface TBMAttendeePayload {
    full_name: string
    role_text: string
    signature_text?: string
}

export interface TBMResponse {
    id: number
    tbm_no: string
    project: number
    date: string
    topic_text: string
    trainer_text: string
    location_text?: string
    notes_text?: string
    attendees: TBMAttendeePayload[]
}

export async function createToolboxMeeting(payload: CreateTBMPayload): Promise<TBMResponse> {
    const { data, response } = await apiFetch<TBMResponse>('/api/v1/tbm/', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok) {
        throw new Error((data as any)?.detail ?? 'ثبت جلسه TBM ناموفق بود')
    }
    return data
}

export async function addTBMAttendee(tbmId: number, attendee: TBMAttendeePayload): Promise<TBMAttendeePayload> {
    const { data, response } = await apiFetch<TBMAttendeePayload>(`/api/v1/tbm/${tbmId}/attendees/`, {
        method: 'POST',
        body: JSON.stringify(attendee),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
    })
    if (!response.ok) {
        throw new Error((data as any)?.detail ?? 'ثبت حاضر ناموفق بود')
    }
    return data
}
