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
    createChangeLog,
    fetchActions,
    type ActionSummary,
} from '@/lib/hse'
import { ApiError } from '@/lib/api/_client'
import { getEntry, updateEntry } from '@/lib/api/formEntry'
import { usePermissions } from '@/hooks/usePermissions'
import {
    FR0103_INITIAL_STATE,
    type FR0103State,
    type FR0103ActionRow,
    fr0103Adapter,
    serializeFR0103RequiredActions,
} from '@/lib/formEntry/adapters/FR-01-03'

const validateState = (state: FR0103State): string | null => {
    if (!state.actionId) {
        return '????? ????? ????? ?? ?????? ????.'
    }
    if (!state.changeSubject) {
        return '????? ????? ?? ???? ????.'
    }
    if (!state.registrationDate || !state.implementationDate) {
        return '????? ??? ? ????? ???? ?????? ???.'
    }
    if (!state.changeResponsible) {
        return '????? ????? ?? ???? ????.'
    }
    if (state.requiredActions.length === 0) {
        return '????? ?? ????? ???? ???? ?? ???? ????.'
    }
    return null
}

export default function FR0103Page() {
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode')
    const entryIdParam = searchParams.get('entryId')
    const entryId = entryIdParam ? Number(entryIdParam) : null
    const isEditMode = mode === 'edit' && entryId !== null && !Number.isNaN(entryId)

    const { can } = usePermissions()
    const canEditArchiveEntries = can('archive', 'update')

    const [formData, setFormData] = useState<FR0103State>(FR0103_INITIAL_STATE)
    const [actions, setActions] = useState<ActionSummary[]>([])
    const [actionsLoading, setActionsLoading] = useState(false)
    const [entryLoading, setEntryLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<string[]>([])
    const [prefilledState, setPrefilledState] = useState<FR0103State | null>(null)

    useEffect(() => {
        const loadActions = async () => {
            try {
                setActionsLoading(true)
                const data = await fetchActions()
                setActions(data)
            } catch (err) {
                console.error('load actions failed', err)
                setError('????? ?????? ????? ??????? ???? ?????. ????? ???? ????.')
            } finally {
                setActionsLoading(false)
            }
        }
        loadActions()
    }, [])

    useEffect(() => {
        if (!isEditMode || entryId === null) {
            setFormData(FR0103_INITIAL_STATE)
            setPrefilledState(null)
            setFieldErrors([])
            return
        }

        const loadEntry = async () => {
            setEntryLoading(true)
            try {
                const entry = await getEntry('FR-01-03', entryId)
                const mapped = fr0103Adapter.toState(entry)
                setFormData(mapped)
                setPrefilledState({ ...mapped })
                setError(null)
                setFieldErrors([])
            } catch (err) {
                console.error('load entry failed', err)
                setError('?????? ????? ??? ???? ?????? ???? ???.')
                setFieldErrors([])
            } finally {
                setEntryLoading(false)
            }
        }

        loadEntry()
    }, [entryId, isEditMode])

    const actionOptions = useMemo(() => {
        const base = actions.map((action) => ({
            value: String(action.id),
            label: action.indicator,
        }))
        if (isEditMode && formData.actionId && base.every((item) => item.value !== formData.actionId)) {
            base.unshift({ value: formData.actionId, label: formData.actionId })
        }
        return base
    }, [actions, formData.actionId, isEditMode])

    const updateField = <K extends keyof FR0103State>(field: K, value: FR0103State[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        if (isEditMode && prefilledState) {
            setFormData(prefilledState)
        } else {
            setFormData((prev) => ({ ...FR0103_INITIAL_STATE, actionId: prev.actionId }))
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

        const serializedActions = serializeFR0103RequiredActions(formData.requiredActions)
        if (!serializedActions) {
            setError('????? ?? ????? ???? ???? ?? ???? ????.')
            return
        }

        if (isEditMode && entryId !== null) {
            if (!canEditArchiveEntries) {
                setError('?????? ???? ???? ?????? ??? ????? ?? ??????.')
                return
            }
            try {
                setSubmitting(true)
                const payload = fr0103Adapter.toPayload({ ...formData, requiredActions: formData.requiredActions })
                await updateEntry('FR-01-03', entryId, payload)
                setPrefilledState({ ...formData })
                setSuccess('????????? ??')
                setFieldErrors([])
            } catch (err) {
                console.error('update change log error', err)
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
            await createChangeLog({
                action: Number(formData.actionId),
                subject_text: formData.changeSubject,
                date_registered: formData.registrationDate,
                date_applied: formData.implementationDate,
                owner_text: formData.changeResponsible,
                required_actions_text: serializedActions,
                related_action_no_text: formData.fr0101Number || undefined,
                notes_text: formData.description || undefined,
            })
            setSuccess('????? ?? ?????? ??? ??.')
            setFieldErrors([])
            setFormData((prev) => ({ ...FR0103_INITIAL_STATE, actionId: prev.actionId }))
        } catch (err: any) {
            console.error('submit change log error', err)
            if (err instanceof ApiError) {
                if (err.status === 403) {
                    setError('?????? ???? ???? ?????? ?? ?????? ??????? ????.')
                    setFieldErrors([])
                } else if (err.status === 400 || err.status === 422) {
                    const messages = err.messages && err.messages.length > 0 ? err.messages : null
                    setError('????? ?????? ??? ?? ????? ???? ? ??? ?????? ???? ????.')
                    setFieldErrors(messages ?? ['??? ????? ?????? ???.'])
                } else {
                    setError(err.message ?? '??? ????? ?????? ???.')
                    setFieldErrors([])
                }
            } else {
                const detail = (err as { message?: string })?.message ?? '??? ????? ?????? ???.'
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
        actionsLoading ||
        (isEditMode && (entryLoading || !canEditArchiveEntries))

    const resetDisabled = submitting || actionsLoading || (isEditMode && entryLoading)

    return (
        <FormLayout
            title="??? ? ?????? ???????"
            code="FR-01-03-00"
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
                        label="????? ????? ????? (FR-01-01)"
                        required
                        options={actionOptions}
                        value={formData.actionId}
                        onChange={(value) => updateField('actionId', value as FR0103State['actionId'])}
                        placeholder={actionsLoading && actionOptions.length === 0 ? '?? ??? ????????...' : '?????? ????'}
                        disabled={actionsLoading}
                    />
                    <TextInput
                        label="????? ?????"
                        placeholder="????: ???????? ???? A ?? B"
                        required
                        value={formData.changeSubject}
                        onChange={(value) => updateField('changeSubject', value)}
                    />
                    <TextInput
                        label="????? ?????"
                        placeholder="??? ? ??? ?????"
                        required
                        value={formData.changeResponsible}
                        onChange={(value) => updateField('changeResponsible', value)}
                    />
                </div>
            </FormSection>

            <FormSection title="????????">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <DateInput
                        label="????? ???"
                        required
                        value={formData.registrationDate}
                        onChange={(value) => updateField('registrationDate', value)}
                    />
                    <DateInput
                        label="????? ????? ?????"
                        required
                        value={formData.implementationDate}
                        onChange={(value) => updateField('implementationDate', value)}
                    />
                </div>
            </FormSection>

            <FormSection title="??????? ????????">
                <RowRepeater
                    label="??????? ????????"
                    columns={[
                        { key: 'action', label: '??? ?????', type: 'text', placeholder: '??? ????? ????????' },
                        { key: 'responsible', label: '?????', type: 'text', placeholder: '??? ? ???' },
                        { key: 'deadline', label: '????', type: 'date' },
                        { key: 'status', label: '?????', type: 'text', placeholder: '????? ??? / ?? ????? / ...' },
                    ]}
                    value={formData.requiredActions}
                    onChange={(value) => updateField('requiredActions', value as FR0103ActionRow[])}
                />
            </FormSection>

            <FormSection title="?????? ?? ??? ????? ??????">
                <TextInput
                    label="????? ??? ????? ?????? ? ????????? (FR-01-01)"
                    placeholder="????: FR-01-01-001"
                    value={formData.fr0101Number}
                    onChange={(value) => updateField('fr0101Number', value)}
                />
            </FormSection>

            <FormSection title="???????">
                <Textarea
                    label="???????"
                    placeholder="??????? ?????? ?? ???? ?????"
                    rows={4}
                    value={formData.description}
                    onChange={(value) => updateField('description', value)}
                />
            </FormSection>
        </FormLayout>
    )
}
