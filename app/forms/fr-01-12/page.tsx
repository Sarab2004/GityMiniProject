'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { RowRepeater } from '@/components/ui/RowRepeater'
import { Select } from '@/components/ui/Select'
import {
    addTeamMember,
    createContractor,
    createOrgUnit,
    createSafetyTeam,
    createSection,
    fetchContractors,
    fetchOrgUnits,
    fetchProjects,
    fetchSections,
    type Contractor,
    type OrgUnit,
    type Project,
    type Section,
} from '@/lib/hse'
import { ApiError } from '@/lib/api/_client'
import { getEntry, updateEntry } from '@/lib/api/formEntry'
import { usePermissions } from '@/hooks/usePermissions'
import {
    FR0112_INITIAL_STATE,
    type FR0112State,
    type FR0112MemberRow,
    fr0112Adapter,
} from '@/lib/formEntry/adapters/FR-01-12'

const validateState = (state: FR0112State): string | null => {
    if (!state.projectId) {
        return '????? ?? ?????? ????.'
    }
    if (!state.preparer || !state.approver) {
        return '??? ? ????? ????? ?????? ?? ????? ????.'
    }
    if ((state.teamMembers ?? []).length === 0) {
        return '????? ?? ??? ??? ?? ??? ????.'
    }
    return null
}

const trimValue = (value?: string | null): string => (value ?? '').trim()

const hydrateMemberRow = (
    row: FR0112MemberRow,
    contractors: Contractor[],
    orgUnits: OrgUnit[],
    sections: Section[],
): FR0112MemberRow => {
    const contractor = contractors.find((item) => String(item.id) === row.contractor)
    const unit = orgUnits.find((item) => String(item.id) === row.unit)
    const section = sections.find((item) => String(item.id) === row.section)
    return {
        contractor: contractor?.name ?? row.contractor ?? '',
        unit: unit?.name ?? row.unit ?? '',
        section: section?.name ?? row.section ?? '',
        representative: row.representative,
        signature: row.signature,
        tbmNumber: row.tbmNumber,
    }
}

export default function FR0112Page() {
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode')
    const entryIdParam = searchParams.get('entryId')
    const entryId = entryIdParam ? Number(entryIdParam) : null
    const isEditMode = mode === 'edit' && entryId !== null && !Number.isNaN(entryId)

    const { can } = usePermissions()
    const canEditArchiveEntries = can('archive', 'update')

    const [formData, setFormData] = useState<FR0112State>(FR0112_INITIAL_STATE)
    const [projects, setProjects] = useState<Project[]>([])
    const [contractors, setContractors] = useState<Contractor[]>([])
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [optionsLoading, setOptionsLoading] = useState(false)
    const [entryLoading, setEntryLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<string[]>([])
    const [prefilledState, setPrefilledState] = useState<FR0112State | null>(null)
    const [prefillApplied, setPrefillApplied] = useState(false)

    useEffect(() => {
        const loadBasics = async () => {
            try {
                setOptionsLoading(true)
                const [proj, cons, units, secs] = await Promise.all([
                    fetchProjects(),
                    fetchContractors(),
                    fetchOrgUnits(),
                    fetchSections(),
                ])
                setProjects(proj)
                setContractors(cons)
                setOrgUnits(units)
                setSections(secs)
            } catch (err) {
                console.error('load basics failed', err)
                setError('??? ?? ?????? ???????? ?????. ????? ???? ?? ???????? ????.')
            } finally {
                setOptionsLoading(false)
            }
        }
        loadBasics()
    }, [])

    useEffect(() => {
        if (!isEditMode || entryId === null) {
            setFormData(FR0112_INITIAL_STATE)
            setPrefilledState(null)
            setPrefillApplied(false)
            setFieldErrors([])
            return
        }

        const loadEntry = async () => {
            setEntryLoading(true)
            try {
                const entry = await getEntry('FR-01-12', entryId)
                const mapped = fr0112Adapter.toState(entry)
                setPrefilledState(mapped)
                setPrefillApplied(false)
                setError(null)
                setFieldErrors([])
            } catch (err) {
                console.error('load safety team failed', err)
                setError('?????? ????? ??? ???? ?????? ???? ???.')
                setFieldErrors([])
            } finally {
                setEntryLoading(false)
            }
        }

        loadEntry()
    }, [entryId, isEditMode])

    useEffect(() => {
        if (!prefilledState || prefillApplied) {
            return
        }
        const hydratedMembers = prefilledState.teamMembers.map((member) =>
            hydrateMemberRow(member, contractors, orgUnits, sections),
        )
        setFormData({
            projectId: prefilledState.projectId,
            preparer: prefilledState.preparer,
            approver: prefilledState.approver,
            teamMembers: hydratedMembers,
        })
        setPrefillApplied(true)
    }, [contractors, orgUnits, sections, prefilledState, prefillApplied])

    const projectOptions = useMemo(
        () =>
            projects.map((project) => ({
                value: String(project.id),
                label: `${project.code} - ${project.name}`,
            })),
        [projects],
    )

    const updateField = <K extends keyof FR0112State>(field: K, value: FR0112State[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        if (isEditMode && prefilledState) {
            const hydrated = prefilledState.teamMembers.map((member) =>
                hydrateMemberRow(member, contractors, orgUnits, sections),
            )
            setFormData({
                projectId: prefilledState.projectId,
                preparer: prefilledState.preparer,
                approver: prefilledState.approver,
                teamMembers: hydrated,
            })
        } else {
            setFormData((prev) => ({ ...FR0112_INITIAL_STATE, projectId: prev.projectId }))
        }
        setError(null)
        setSuccess(null)
        setFieldErrors([])
    }

    const ensureContractorId = async (name?: string) => {
        const trimmed = trimValue(name)
        if (!trimmed) return null
        const existing = contractors.find((item) => item.name === trimmed)
        if (existing) return existing.id
        const created = await createContractor(trimmed)
        setContractors((prev) => [...prev, created])
        return created.id
    }

    const ensureOrgUnitId = async (name?: string) => {
        const trimmed = trimValue(name)
        if (!trimmed) return null
        const existing = orgUnits.find((item) => item.name === trimmed)
        if (existing) return existing.id
        const created = await createOrgUnit(trimmed)
        setOrgUnits((prev) => [...prev, created])
        return created.id
    }

    const ensureSectionId = async (name: string | undefined, orgUnitId: number | null) => {
        const trimmed = trimValue(name)
        if (!trimmed || !orgUnitId) return null
        const existing = sections.find((item) => item.name === trimmed && item.org_unit === orgUnitId)
        if (existing) return existing.id
        const created = await createSection(trimmed, orgUnitId)
        setSections((prev) => [...prev, created])
        return created.id
    }

    const handleSubmit = async () => {
        setError(null)
        setSuccess(null)
        setFieldErrors([])

        const validationError = validateState(formData)
        if (validationError) {
            setError(validationError)
            return
        }

        if (isEditMode && entryId !== null) {
            if (!canEditArchiveEntries) {
                setError('?????? ???? ???? ?????? ??? ????? ?? ??????.')
                return
            }
            try {
                setSubmitting(true)
                const payload = fr0112Adapter.toPayload(formData)
                await updateEntry('FR-01-12', entryId, payload)
                setPrefilledState({
                    ...formData,
                })
                setSuccess('????????? ??')
            } catch (err) {
                console.error('update safety team error', err)
                if (err instanceof ApiError) {
                    if (err.status === 403) {
                        setError('????? ????????? ??? ????? ?? ??????.')
                        setFieldErrors([])
                    } else if (err.status === 400 || err.status === 422) {
                        const messages = err.messages && err.messages.length > 0 ? err.messages : null
                        setError('????? ?????? ??? ?? ????? ???? ? ??? ?????? ???? ????.')
                        setFieldErrors(messages ?? ['????????? ??? ?? ??? ??????? ??.'])
                    } else {
                        setError('????????? ??? ?? ???? ????????? ??????? ??.')
                        setFieldErrors([])
                    }
                } else {
                    setError('????????? ??? ?? ???? ????????? ??????? ??.')
                    setFieldErrors([])
                }
            } finally {
                setSubmitting(false)
            }
            return
        }

        try {
            setSubmitting(true)
            const team = await createSafetyTeam({
                project: Number(formData.projectId),
                prepared_by_name: formData.preparer,
                approved_by_name: formData.approver,
            })

            for (const member of formData.teamMembers) {
                const representative = trimValue(member.representative)
                if (!representative) {
                    continue
                }
                const contractorId = await ensureContractorId(member.contractor)
                const unitId = await ensureOrgUnitId(member.unit)
                const sectionId = await ensureSectionId(member.section, unitId)
                await addTeamMember(team.id, {
                    contractor: contractorId,
                    unit: unitId,
                    section: sectionId,
                    representative_name: representative,
                    signature_text: trimValue(member.signature) || undefined,
                    tbm_no: trimValue(member.tbmNumber) || undefined,
                })
            }

            setSuccess('??? ??????? ?? ?????? ??? ??.')
            setFormData((prev) => ({ ...FR0112_INITIAL_STATE, projectId: prev.projectId }))
        } catch (err: any) {
            console.error('submit safety team error', err)
            if (err instanceof ApiError) {
                if (err.status === 403) {
                    setError('?????? ???? ???? ?????? ?? ?????? ??????? ????.')
                    setFieldErrors([])
                } else if (err.status === 400 || err.status === 422) {
                    const messages = err.messages && err.messages.length > 0 ? err.messages : null
                    setError('????? ?????? ??? ?? ????? ???? ? ??? ?????? ???? ????.')
                    setFieldErrors(messages ?? ['??? ??? ?? ??? ????? ??.'])
                } else {
                    setError(err.message ?? '??? ??? ?? ??? ????? ??.')
                    setFieldErrors([])
                }
            } else {
                const detail = (err as { message?: string })?.message ?? '??? ??? ?? ??? ????? ??.'
                setError(detail)
                setFieldErrors([])
            }
        } finally {
            setSubmitting(false)
        }
    }

    const primaryButtonLabel = isEditMode
        ? submitting
            ? '?? ??? ?????????...'
            : '?????????'
        : submitting
        ? '?? ??? ???...'
        : '??? ???'

    const primaryDisabled =
        submitting ||
        optionsLoading ||
        (isEditMode && (entryLoading || !canEditArchiveEntries))

    const resetDisabled = submitting || optionsLoading || (isEditMode && entryLoading)

    return (
        <FormLayout
            title="????? ??? ??????? HSE"
            code="FR-01-12-00"
            onReset={resetForm}
            footer={
                <div className="space-y-4">
                    {error ? (
                        <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-danger text-sm">
                            {error}
                        </div>
                    ) : null}
                    {fieldErrors.length > 0 ? (
                        <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                            {fieldErrors.map((message, index) => (
                                <li key={index} className="leading-relaxed">
                                    {message}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                    {success ? (
                        <div className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-success text-sm">
                            {success}
                        </div>
                    ) : null}
                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={resetForm}
                            disabled={resetDisabled}
                        >
                            ???????? ???
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={primaryDisabled}
                        >
                            {primaryButtonLabel}
                        </button>
                    </div>
                </div>
            }
        >
            {isEditMode ? (
                <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    <div className="flex flex-col gap-2">
                        <span>?? ??? ?????? ????? #{entryId}</span>
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            <Link href="/archive" className="text-amber-700 underline">
                                ?????? ?? ????? 
                            </Link>
                            {!canEditArchiveEntries ? (
                                <span className="text-amber-600">????? ?????? ???? ??? ???? ????.</span>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}

            {isEditMode && entryLoading ? (
                <div className="mb-6 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    ?? ??? ???????? ??????? ???...
                </div>
            ) : null}

            <FormSection title="??????? ???">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Select
                        label="?????"
                        required
                        options={projectOptions}
                        value={formData.projectId}
                        onChange={(value) => updateField('projectId', value as FR0112State['projectId'])}
                        placeholder={optionsLoading && projectOptions.length === 0 ? '?? ??? ????????...' : '?????? ????'}
                        disabled={optionsLoading}
                    />
                    <TextInput
                        label="?????????? (??????? HSE)"
                        placeholder="??? ? ????? ??????? HSE"
                        required
                        value={formData.preparer}
                        onChange={(value) => updateField('preparer', value)}
                    />
                    <TextInput
                        label="??????????? (???? ?????/?????? ??????)"
                        placeholder="??? ? ????? ???? ?????"
                        required
                        value={formData.approver}
                        onChange={(value) => updateField('approver', value)}
                    />
                </div>
            </FormSection>

            <FormSection title="????? ??? ??????? HSE">
                <RowRepeater
                    label="????? ???"
                    columns={[
                        { key: 'contractor', label: '??? ????????', type: 'text', placeholder: '????: ????????? ????' },
                        { key: 'unit', label: '??? ????', type: 'text', placeholder: '????: ?????' },
                        { key: 'section', label: '??? ???', type: 'text', placeholder: '????: ????????' },
                        { key: 'representative', label: '??? ??????? ???', type: 'text', placeholder: '??? ? ???' },
                        { key: 'signature', label: '????', type: 'text', placeholder: '????? ???????' },
                        { key: 'tbmNumber', label: '????? TBM', type: 'text', placeholder: '????: TBM-1403-027' },
                    ]}
                    value={formData.teamMembers}
                    onChange={(value) => updateField('teamMembers', value as FR0112MemberRow[])}
                    helper="?? ???? ???? ?? ???? ???? ??? ????/???/???????? ?? ?????? ?? ???? ??????? ??????? ?? ??? ??? ???? ?? ???? ?????? ????? ?????? ??."
                />
            </FormSection>
        </FormLayout>
    )
}
