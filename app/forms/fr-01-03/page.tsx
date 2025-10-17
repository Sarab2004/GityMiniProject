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
import { Button as StatefulButton } from '@/components/ui/stateful-button'
import {
    FR0103_INITIAL_STATE,
    type FR0103State,
    type FR0103ActionRow,
    type FR0103ServerEntry,
    fr0103Adapter,
    serializeFR0103RequiredActions,
} from '@/lib/formEntry/adapters/FR-01-03'

const ACTION_TITLE_MAX_LENGTH = 120
const ACTION_OWNER_MAX_LENGTH = 60
const ACTION_STATUS_MAX_LENGTH = 60
const NOTE_MAX_LENGTH = 200

const limitText = (value: string, max: number) => (value.length > max ? value.slice(0, max) : value)

const sanitizeActionRow = (row: FR0103ActionRow): FR0103ActionRow => ({
    action: limitText((row.action ?? '').trim(), ACTION_TITLE_MAX_LENGTH),
    responsible: limitText((row.responsible ?? '').trim(), ACTION_OWNER_MAX_LENGTH),
    deadline: (row.deadline ?? '').trim(),
    status: limitText((row.status ?? '').trim(), ACTION_STATUS_MAX_LENGTH),
})

const sanitizeActionRows = (rows: FR0103ActionRow[]): FR0103ActionRow[] => rows.map(sanitizeActionRow)

const sanitizeState = (state: FR0103State): FR0103State => ({
    actionId: state.actionId.trim(),
    changeSubject: limitText(state.changeSubject.trim(), NOTE_MAX_LENGTH),
    registrationDate: state.registrationDate.trim(),
    implementationDate: state.implementationDate.trim(),
    changeResponsible: limitText(state.changeResponsible.trim(), ACTION_OWNER_MAX_LENGTH),
    requiredActions: sanitizeActionRows(state.requiredActions),
    fr0101Number: limitText(state.fr0101Number.trim(), NOTE_MAX_LENGTH),
    description: limitText(state.description.trim(), NOTE_MAX_LENGTH),
})

const validateState = (state: FR0103State): string | null => {
    if (!state.actionId) {
        return 'لطفاً اقدام مرجع را انتخاب کنید.'
    }
    if (!state.changeSubject) {
        return 'عنوان تغییر را وارد کنید.'
    }
    if (!state.registrationDate || !state.implementationDate) {
        return 'تاریخ ثبت و تاریخ اجرا را تکمیل کنید.'
    }
    if (!state.changeResponsible) {
        return 'مسئول پیگیری تغییر را وارد کنید.'
    }
    if (state.requiredActions.length === 0) {
        return 'حداقل یک اقدام برای اجرای تغییر تعریف کنید.'
    }
    const incompleteRow = state.requiredActions.find((row) => !row.action || !row.responsible)
    if (incompleteRow) {
        return 'عنوان و مسئول هر اقدام را کامل کنید.'
    }
    return null
}

const ACTION_STATUS_HELPER = 'وضعیت مجاز: «برنامه‌ریزی‌شده» / «در حال انجام» / «تکمیل‌شده».'

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
                setActions(Array.isArray(data) ? data : [])
            } catch (err) {
                console.error('load actions failed', err)
                setError('بارگذاری فهرست اقدامات با خطا روبه‌رو شد. لطفاً دوباره امتحان کنید.')
                setFieldErrors([])
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
                const entry = await getEntry<FR0103ServerEntry>('FR-01-03', entryId)
                const mapped = sanitizeState(fr0103Adapter.toState(entry))
                setFormData(mapped)
                setPrefilledState({ ...mapped })
                setError(null)
                setFieldErrors([])
            } catch (err) {
                console.error('load entry failed', err)
                setError('بارگذاری اطلاعات فرم با خطا روبه‌رو شد.')
                setFieldErrors([])
            } finally {
                setEntryLoading(false)
            }
        }

        loadEntry()
    }, [entryId, isEditMode])

    const actionOptions = useMemo(() => {
        if (!Array.isArray(actions)) {
            return []
        }
        const base = actions.map((action) => ({
            value: String(action.id),
            label: `${action.indicator}`,
        }))
        if (isEditMode && formData.actionId && base.every((option) => option.value !== formData.actionId)) {
            base.unshift({ value: formData.actionId, label: formData.actionId })
        }
        return base
    }, [actions, formData.actionId, isEditMode])

    const updateField = <K extends keyof FR0103State>(field: K, value: FR0103State[K]) => {
        let nextValue = value

        if (typeof value === 'string') {
            if (field === 'changeSubject' || field === 'description' || field === 'fr0101Number') {
                nextValue = limitText(value.trim(), NOTE_MAX_LENGTH) as FR0103State[K]
            } else if (field === 'changeResponsible') {
                nextValue = limitText(value.trim(), ACTION_OWNER_MAX_LENGTH) as FR0103State[K]
            } else if (field === 'actionId') {
                nextValue = value.trim() as FR0103State[K]
            }
        }

        if (field === 'requiredActions') {
            nextValue = sanitizeActionRows(value as FR0103ActionRow[]) as FR0103State[K]
        }

        setFormData((prev) => ({ ...prev, [field]: nextValue }))
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

        const preparedState = sanitizeState(formData)
        const stateChanged = JSON.stringify(preparedState) !== JSON.stringify(formData)
        if (stateChanged) {
            setFormData(preparedState)
        }

        const validationError = validateState(preparedState)
        if (validationError) {
            setError(validationError)
            return
        }

        const serializedActions = serializeFR0103RequiredActions(preparedState.requiredActions)
        if (!serializedActions) {
            setError('حداقل یک اقدام معتبر تعریف کنید.')
            return
        }

        if (isEditMode && entryId !== null) {
            if (!canEditArchiveEntries) {
                setError('دسترسی لازم برای ویرایش این رکورد را ندارید.')
                return
            }
            try {
                setSubmitting(true)
                const payload = fr0103Adapter.toPayload(preparedState)
                await updateEntry<FR0103ServerEntry>('FR-01-03', entryId, payload)
                setPrefilledState({ ...preparedState })
                setSuccess('بروزرسانی شد')
                setFieldErrors([])
            } catch (err) {
                console.error('update change log error', err)
                if (err instanceof ApiError) {
                    if (err.status === 403) {
                        setError('اجازه بروزرسانی این رکورد را ندارید.')
                        setFieldErrors([])
                    } else if (err.status === 400 || err.status === 422) {
                        const messages = err.messages && err.messages.length > 0 ? err.messages : null
                        setError('لطفاً خطاهای زیر را بررسی کنید و سپس دوباره تلاش کنید.')
                        setFieldErrors(messages ?? ['بروزرسانی فرم با خطا روبه‌رو شد.'])
                    } else {
                        setError('بروزرسانی فرم با خطای غیرمنتظره روبه‌رو شد.')
                        setFieldErrors([])
                    }
                } else {
                    setError('بروزرسانی فرم با خطای غیرمنتظره روبه‌رو شد.')
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
                action: Number(preparedState.actionId),
                subject_text: preparedState.changeSubject,
                date_registered: preparedState.registrationDate,
                date_applied: preparedState.implementationDate,
                owner_text: preparedState.changeResponsible,
                required_actions_text: serializedActions,
                related_action_no_text: preparedState.fr0101Number || undefined,
                notes_text: preparedState.description || undefined,
            })
            setSuccess('تغییر با موفقیت ثبت شد.')
            setFieldErrors([])
            setFormData((prev) => ({ ...FR0103_INITIAL_STATE, actionId: prev.actionId }))
        } catch (err) {
            console.error('submit change log error', err)
            if (err instanceof ApiError) {
                if (err.status === 403) {
                    setError('اجازه ثبت این فرم را ندارید.')
                    setFieldErrors([])
                } else if (err.status === 400 || err.status === 422) {
                    const messages = err.messages && err.messages.length > 0 ? err.messages : null
                    setError('لطفاً خطاهای زیر را بررسی کنید.')
                    setFieldErrors(messages ?? ['اطلاعات ارسال‌شده معتبر نیست.'])
                } else {
                    setError(err.message ?? 'ثبت فرم با خطا روبه‌رو شد.')
                    setFieldErrors([])
                }
            } else {
                const detail = (err as { message?: string })?.message ?? 'ثبت فرم با خطا روبه‌رو شد.'
                setError(detail)
                setFieldErrors([])
            }
        } finally {
            setSubmitting(false)
        }
    }

    const primaryButtonLabel = isEditMode
        ? submitting
            ? 'در حال بروزرسانی...'
            : 'بروزرسانی'
        : submitting
            ? 'در حال ثبت...'
            : 'ثبت فرم'

    const primaryDisabled =
        submitting ||
        actionsLoading ||
        (isEditMode && (entryLoading || !canEditArchiveEntries))

    const resetDisabled = submitting || actionsLoading || (isEditMode && entryLoading)

    const sectionClassName = 'p-4 sm:p-6'
    const fullWidthSectionClass = `${sectionClassName} md:col-span-2`
    const actionPlaceholder = actionsLoading ? 'در حال بارگذاری...' : 'اقدام را انتخاب کنید'

    return (
        <FormLayout
            title="ثبت و پیگیری تغییرات"
            code="FR-01-03-00"
            onReset={resetForm}
            mobileFriendly
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
                    <div className="flex flex-col-reverse gap-2 md:flex-row md:items-center md:justify-end md:gap-3">
                        <button
                            type="button"
                            className="btn-secondary w-full md:w-auto"
                            onClick={resetForm}
                            disabled={resetDisabled}
                        >
                            بازنشانی فرم
                        </button>
                        <StatefulButton
                            onClick={handleSubmit}
                            className="w-full sm:w-auto"
                            disabled={primaryDisabled}
                        >
                            {primaryButtonLabel}
                        </StatefulButton>
                    </div>
                </div>
            }
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                {isEditMode ? (
                    <div className="md:col-span-2 mb-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        <div className="flex flex-col gap-2 min-w-0">
                            <span className="truncate max-w-full" title={`در حال ویرایش رکورد #${entryId}`}>
                                {`در حال ویرایش رکورد #${entryId}`}
                            </span>
                            <div className="flex w-full flex-wrap items-center gap-3 text-xs text-amber-700/90">
                                <Link
                                    href="/archive"
                                    className="text-amber-700 underline truncate max-w-full"
                                    title="بازگشت به آرشیو"
                                >
                                    بازگشت به آرشیو
                                </Link>
                                {!canEditArchiveEntries ? (
                                    <span className="truncate max-w-full" title="اجازه ویرایش ندارید.">
                                        اجازه ویرایش ندارید.
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ) : null}

                {isEditMode && entryLoading ? (
                    <div className="md:col-span-2 mb-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        در حال بارگذاری اطلاعات فرم...
                    </div>
                ) : null}

                <FormSection title="اطلاعات کلی" className={fullWidthSectionClass}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="کد اقدام"
                            required
                            options={actionOptions}
                            placeholder={actionPlaceholder}
                            value={formData.actionId}
                            onChange={(value) => {
                                if (actionsLoading) return
                                updateField('actionId', value as FR0103State['actionId'])
                            }}
                            helper={actionsLoading ? 'در حال بارگذاری فهرست اقدامات' : undefined}
                        />
                        <TextInput
                            label="عنوان تغییر"
                            placeholder="مثلاً: اصلاح دستورالعمل ..."
                            required
                            value={formData.changeSubject}
                            onChange={(value) => updateField('changeSubject', value)}
                        />
                        <TextInput
                            label="مسئول پیگیری"
                            placeholder="مثلاً: سرپرست تولید"
                            required
                            value={formData.changeResponsible}
                            onChange={(value) => updateField('changeResponsible', value)}
                        />
                    </div>
                </FormSection>

                <FormSection title="زمان‌بندی" className={fullWidthSectionClass}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DateInput
                            label="تاریخ ثبت"
                            required
                            helper="تاریخ ثبت"
                            value={formData.registrationDate}
                            onChange={(value) => updateField('registrationDate', value)}
                        />
                        <DateInput
                            label="تاریخ اجرا"
                            required
                            helper="تاریخ اجرا"
                            value={formData.implementationDate}
                            onChange={(value) => updateField('implementationDate', value)}
                        />
                    </div>
                </FormSection>

                <FormSection title="اقدامات موردنیاز" className={fullWidthSectionClass}>
                    <RowRepeater
                        label="اقدامات"
                        columns={[
                            { key: 'action', label: 'عنوان اقدام', type: 'text', placeholder: 'مثلاً: اصلاح دستورالعمل ...' },
                            { key: 'responsible', label: 'مسئول اقدام', type: 'text', placeholder: 'مثلاً: سرپرست تولید' },
                            { key: 'deadline', label: 'تاریخ انجام', type: 'date' },
                            { key: 'status', label: 'وضعیت اقدام', type: 'text', placeholder: 'مثلاً: برنامه‌ریزی‌شده' },
                        ]}
                        value={formData.requiredActions}
                        onChange={(value) => updateField('requiredActions', value as FR0103ActionRow[])}
                    />
                    <p className="mt-2 text-xs text-muted">{ACTION_STATUS_HELPER}</p>
                </FormSection>

                <FormSection title="ارتباط با FR-01-01" className={sectionClassName}>
                    <TextInput
                        label="شماره اقدام مرتبط در FR-01-01"
                        placeholder="مثال: FR-01-01-001"
                        value={formData.fr0101Number}
                        onChange={(value) => updateField('fr0101Number', value)}
                    />
                </FormSection>

                <FormSection title="توضیحات" className={sectionClassName}>
                    <Textarea
                        label="توضیحات تکمیلی"
                        placeholder="توضیحات (اختیاری)"
                        rows={4}
                        value={formData.description}
                        onChange={(value) => updateField('description', value)}
                    />
                </FormSection>
            </div>
        </FormLayout>
    )
}
