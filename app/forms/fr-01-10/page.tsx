'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { DateInput } from '@/components/ui/DateInput'
import { Textarea } from '@/components/ui/Textarea'
import { RowRepeater } from '@/components/ui/RowRepeater'
import { Select } from '@/components/ui/Select'
import {
    createToolboxMeeting,
    addTBMAttendee,
    fetchProjects,
    type Project,
} from '@/lib/hse'
import { ApiError } from '@/lib/api/_client'
import { getEntry, updateEntry } from '@/lib/api/formEntry'
import { usePermissions } from '@/hooks/usePermissions'
import {
    FR0110_INITIAL_STATE,
    type FR0110State,
    type FR0110AttendeeRow,
    fr0110Adapter,
} from '@/lib/formEntry/adapters/FR-01-10'

const validateState = (state: FR0110State): string | null => {
    if (!state.projectId) {
        return '?????? ????? ?????? ???.'
    }
    if (!state.tbmNumber || !state.projectLocation || !state.date || !state.subject || !state.instructor) {
        return '????? ??????? ?????? ?? ????? ????.'
    }
    if (state.attendees.length === 0) {
        return '????? ?? ???? ???? ??? ???.'
    }
    return null
}

export default function FR0110Page() {
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode')
    const entryIdParam = searchParams.get('entryId')
    const entryId = entryIdParam ? Number(entryIdParam) : null
    const isEditMode = mode === 'edit' && entryId !== null && !Number.isNaN(entryId)

    const { can } = usePermissions()
    const canEditArchiveEntries = can('archive', 'update')

    const [formData, setFormData] = useState<FR0110State>(FR0110_INITIAL_STATE)
    const [projects, setProjects] = useState<Project[]>([])
    const [projectsLoading, setProjectsLoading] = useState(false)
    const [entryLoading, setEntryLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<string[]>([])
    const [prefilledState, setPrefilledState] = useState<FR0110State | null>(null)

    useEffect(() => {
        const loadProjects = async () => {
            try {
                setProjectsLoading(true)
                const list = await fetchProjects()
                setProjects(list)
            } catch (err) {
                console.error('load projects failed', err)
                setError('?????? ????? ???????? ???? ???. ????? ???? ????.')
            } finally {
                setProjectsLoading(false)
            }
        }
        loadProjects()
    }, [])

    useEffect(() => {
        if (!isEditMode || entryId === null) {
            setFormData(FR0110_INITIAL_STATE)
            setPrefilledState(null)
            setFieldErrors([])
            return
        }

        const loadEntry = async () => {
            setEntryLoading(true)
            try {
                const entry = await getEntry('PR-01-07-01', entryId)
                const mapped = fr0110Adapter.toState(entry)
                setFormData(mapped)
                setPrefilledState({ ...mapped })
                setError(null)
                setFieldErrors([])
            } catch (err) {
                console.error('load tbm entry failed', err)
                setError('?????? ????? ??? ???? ?????? ???? ???.')
                setFieldErrors([])
            } finally {
                setEntryLoading(false)
            }
        }

        loadEntry()
    }, [entryId, isEditMode])

    const projectOptions = useMemo(
        () =>
            projects.map((project) => ({
                value: String(project.id),
                label: `${project.code} - ${project.name}`,
            })),
        [projects],
    )

    const updateField = <K extends keyof FR0110State>(field: K, value: FR0110State[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        if (isEditMode && prefilledState) {
            setFormData(prefilledState)
        } else {
            setFormData(FR0110_INITIAL_STATE)
        }
        setError(null)
        setSuccess(null)
        setFieldErrors([])
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
                const payload = fr0110Adapter.toPayload(formData)
                await updateEntry('PR-01-07-01', entryId, payload)
                setPrefilledState({ ...formData })
                setSuccess('????????? ??')
            } catch (err) {
                console.error('update tbm error', err)
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
            const tbm = await createToolboxMeeting({
                tbm_no: formData.tbmNumber,
                project: Number(formData.projectId),
                date: formData.date,
                topic_text: formData.subject,
                trainer_text: formData.instructor,
                location_text: formData.projectLocation || undefined,
                notes_text: formData.notes || undefined,
            })

            for (const attendee of formData.attendees) {
                const name = attendee.name?.trim()
                const signature = attendee.signature?.trim()
                if (!name || !signature) {
                    continue
                }
                await addTBMAttendee(tbm.id, {
                    full_name: name,
                    role_text: signature,
                    signature_text: signature,
                })
            }

            setSuccess(`???? TBM ?? ????? ${formData.tbmNumber} ?? ?????? ??? ??.`)
            setFormData(FR0110_INITIAL_STATE)
        } catch (err: any) {
            console.error('submit tbm error', err)
            if (err instanceof ApiError) {
                if (err.status === 403) {
                    setError('?????? ???? ???? ?????? ?? ?????? ??????? ????.')
                    setFieldErrors([])
                } else if (err.status === 400 || err.status === 422) {
                    const messages = err.messages && err.messages.length > 0 ? err.messages : null
                    setError('????? ?????? ??? ?? ????? ???? ? ??? ?????? ???? ????.')
                    setFieldErrors(messages ?? ['??? ???? TBM ?????? ???.'])
                } else {
                    setError(err.message ?? '??? ???? TBM ?????? ???.')
                    setFieldErrors([])
                }
            } else {
                const detail = (err as { message?: string })?.message ?? '??? ???? TBM ?????? ???.'
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
        : '??? ?????'

    const primaryDisabled =
        submitting ||
        projectsLoading ||
        (isEditMode && (entryLoading || !canEditArchiveEntries))

    const resetDisabled = submitting || projectsLoading || (isEditMode && entryLoading)

    return (
        <FormLayout
            title="TBM - ????? ??? ???"
            code="PR-01-07-01"
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
                        onChange={(value) => updateField('projectId', value as FR0110State['projectId'])}
                        placeholder={projectsLoading && projectOptions.length === 0 ? '?? ??? ????????...' : '?????? ????'}
                        disabled={projectsLoading}
                    />
                    <TextInput
                        label="????? TBM"
                        placeholder="TBM-1403-027"
                        required
                        value={formData.tbmNumber}
                        onChange={(value) => updateField('tbmNumber', value)}
                    />
                    <TextInput
                        label="?????/???"
                        placeholder="??? ????? ?? ??? ???"
                        required
                        value={formData.projectLocation}
                        onChange={(value) => updateField('projectLocation', value)}
                    />
                    <DateInput
                        label="?????"
                        required
                        value={formData.date}
                        onChange={(value) => updateField('date', value)}
                    />
                    <TextInput
                        label="?????/?????"
                        placeholder="????? ?????"
                        required
                        value={formData.subject}
                        onChange={(value) => updateField('subject', value)}
                    />
                    <TextInput
                        label="????/?????"
                        placeholder="??? ? ??? ????"
                        required
                        value={formData.instructor}
                        onChange={(value) => updateField('instructor', value)}
                    />
                </div>
            </FormSection>

            <FormSection title="??????">
                <RowRepeater
                    label="???? ??????"
                    columns={[
                        { key: 'name', label: '??? ? ???', type: 'text', placeholder: '??? ? ??? ???' },
                        { key: 'signature', label: '?????', type: 'text', placeholder: '????? ???' },
                    ]}
                    value={formData.attendees}
                    onChange={(value) => updateField('attendees', value as FR0110AttendeeRow[])}
                />
            </FormSection>

            <FormSection title="?????????? ? ?????">
                <Textarea
                    label="??????????/?????"
                    placeholder="??????????? ??????? ????? ? ???????"
                    rows={4}
                    value={formData.notes}
                    onChange={(value) => updateField('notes', value)}
                />
            </FormSection>
        </FormLayout>
    )
}
