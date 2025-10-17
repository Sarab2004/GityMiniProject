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
import { Button as StatefulButton } from '@/components/ui/stateful-button'
import {
    FR0110_INITIAL_STATE,
    type FR0110State,
    type FR0110AttendeeRow,
    type FR0110ServerEntry,
    fr0110Adapter,
} from '@/lib/formEntry/adapters/FR-01-10'

const TBM_NUMBER_MAX_LENGTH = 20
const LOCATION_MAX_LENGTH = 120
const SUBJECT_MAX_LENGTH = 120
const INSTRUCTOR_MAX_LENGTH = 60
const NOTES_MAX_LENGTH = 1000
const ATTENDEE_NAME_MAX_LENGTH = 60
const ATTENDEE_ROLE_MAX_LENGTH = 40
const ATTENDEE_SIGNATURE_MAX_LENGTH = 40

const limitText = (value: string, max: number) => (value.length > max ? value.slice(0, max) : value)
const trimLimited = (value: string, max: number) => limitText(value.trim(), max)

const sanitizeAttendee = (row: FR0110AttendeeRow): FR0110AttendeeRow => ({
    fullName: trimLimited(row.fullName ?? '', ATTENDEE_NAME_MAX_LENGTH),
    role: limitText((row.role ?? '').trim(), ATTENDEE_ROLE_MAX_LENGTH),
    signature: limitText((row.signature ?? '').trim(), ATTENDEE_SIGNATURE_MAX_LENGTH),
})

const sanitizeAttendees = (rows: FR0110AttendeeRow[]): FR0110AttendeeRow[] =>
    rows.map(sanitizeAttendee).filter((row) => row.fullName.length > 0 || row.role.length > 0 || row.signature.length > 0)

const sanitizeState = (state: FR0110State): FR0110State => ({
    projectId: state.projectId.trim(),
    tbmNumber: trimLimited(state.tbmNumber, TBM_NUMBER_MAX_LENGTH),
    projectLocation: limitText(state.projectLocation.trim(), LOCATION_MAX_LENGTH),
    date: state.date.trim(),
    subject: trimLimited(state.subject, SUBJECT_MAX_LENGTH),
    instructor: trimLimited(state.instructor, INSTRUCTOR_MAX_LENGTH),
    attendees: sanitizeAttendees(state.attendees),
    notes: limitText(state.notes.trim(), NOTES_MAX_LENGTH),
})

const validateState = (state: FR0110State): string | null => {
    if (!state.projectId) {
        return 'پروژه را انتخاب کنید.'
    }
    if (!state.tbmNumber) {
        return 'شماره جلسه را وارد کنید.'
    }
    if (!state.date) {
        return 'تاریخ جلسه را وارد کنید.'
    }
    if (!state.subject) {
        return 'موضوع جلسه را وارد کنید.'
    }
    if (!state.instructor) {
        return 'مدرس جلسه را وارد کنید.'
    }
    if (state.attendees.length === 0) {
        return 'حداقل یک شرکت‌کننده ثبت کنید.'
    }
    const invalidRow = state.attendees.find((row) => !row.fullName)
    if (invalidRow) {
        return 'نام و نام خانوادگی شرکت‌کنندگان الزامی است.'
    }
    return null
}

const ATTENDEE_HELPER = 'نام کامل هر شرکت‌کننده الزامی است؛ نقش و امضا در صورت نیاز کامل شود.'

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
                setProjects(Array.isArray(list) ? list : [])
            } catch (err) {
                console.error('load projects failed', err)
                setError('بارگذاری فهرست پروژه‌ها با خطا روبه‌رو شد. لطفاً دوباره تلاش کنید.')
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
                const entry = await getEntry<FR0110ServerEntry>('PR-01-07-01', entryId)
                const mapped = sanitizeState(fr0110Adapter.toState(entry))
                setFormData(mapped)
                setPrefilledState({ ...mapped })
                setError(null)
                setFieldErrors([])
            } catch (err) {
                console.error('load tbm entry failed', err)
                setError('بارگذاری اطلاعات جلسه TBM با خطا روبه‌رو شد.')
                setFieldErrors([])
            } finally {
                setEntryLoading(false)
            }
        }

        loadEntry()
    }, [entryId, isEditMode])

    const projectOptions = useMemo(() => {
        if (!Array.isArray(projects)) {
            return []
        }
        return projects.map((project) => ({
            value: String(project.id),
            label: `${project.code} - ${project.name}`,
        }))
    }, [projects])

    const updateField = <K extends keyof FR0110State>(field: K, value: FR0110State[K]) => {
        let nextValue = value

        if (typeof value === 'string') {
            switch (field) {
                case 'tbmNumber':
                    nextValue = trimLimited(value, TBM_NUMBER_MAX_LENGTH) as FR0110State[K]
                    break
                case 'projectLocation':
                    nextValue = limitText(value.trim(), LOCATION_MAX_LENGTH) as FR0110State[K]
                    break
                case 'subject':
                    nextValue = trimLimited(value, SUBJECT_MAX_LENGTH) as FR0110State[K]
                    break
                case 'instructor':
                    nextValue = trimLimited(value, INSTRUCTOR_MAX_LENGTH) as FR0110State[K]
                    break
                case 'notes':
                    nextValue = limitText(value.trim(), NOTES_MAX_LENGTH) as FR0110State[K]
                    break
                case 'projectId':
                case 'date':
                    nextValue = value.trim() as FR0110State[K]
                    break
                default:
                    break
            }
        }

        if (field === 'attendees') {
            nextValue = sanitizeAttendees(value as FR0110AttendeeRow[]) as FR0110State[K]
        }

        setFormData((prev) => ({ ...prev, [field]: nextValue }))
    }

    const resetForm = () => {
        if (isEditMode && prefilledState) {
            setFormData(prefilledState)
        } else {
            setFormData((prev) => ({ ...FR0110_INITIAL_STATE, projectId: prev.projectId }))
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
        if (JSON.stringify(preparedState) !== JSON.stringify(formData)) {
            setFormData(preparedState)
        }

        const validationError = validateState(preparedState)
        if (validationError) {
            setError(validationError)
            return
        }

        const attendees = sanitizeAttendees(preparedState.attendees)

        if (isEditMode && entryId !== null) {
            if (!canEditArchiveEntries) {
                setError('اجازه ویرایش این رکورد را ندارید.')
                return
            }
            try {
                setSubmitting(true)
                const payload = fr0110Adapter.toPayload(preparedState)
                await updateEntry<FR0110ServerEntry>('PR-01-07-01', entryId, payload)
                setPrefilledState({ ...preparedState, attendees })
                setSuccess('بروزرسانی شد')
                setFieldErrors([])
            } catch (err) {
                console.error('update tbm error', err)
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
            const meeting = await createToolboxMeeting({
                tbm_no: preparedState.tbmNumber,
                project: Number(preparedState.projectId),
                date: preparedState.date,
                topic_text: preparedState.subject,
                trainer_text: preparedState.instructor,
                location_text: preparedState.projectLocation || undefined,
                notes_text: preparedState.notes || undefined,
            })

            for (const attendee of attendees) {
                if (!attendee.fullName) continue
                await addTBMAttendee(meeting.id, {
                    full_name: attendee.fullName,
                    role_text: attendee.role || undefined,
                    signature_text: attendee.signature || undefined,
                })
            }

            setSuccess('جلسه با موفقیت ثبت شد.')
            setFieldErrors([])
            setFormData((prev) => ({ ...FR0110_INITIAL_STATE, projectId: prev.projectId }))
        } catch (err) {
            console.error('submit tbm error', err)
            if (err instanceof ApiError) {
                if (err.status === 403) {
                    setError('اجازه ثبت این فرم را ندارید.')
                    setFieldErrors([])
                } else if (err.status === 400 || err.status === 422) {
                    const messages = err.messages && err.messages.length > 0 ? err.messages : null
                    setError('لطفاً خطاهای زیر را بررسی کنید.')
                    setFieldErrors(messages ?? ['ثبت فرم با خطا روبه‌رو شد.'])
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
        submitting || projectsLoading || (isEditMode && (entryLoading || !canEditArchiveEntries))

    const resetDisabled = submitting || projectsLoading || (isEditMode && entryLoading)

    const sectionClassName = 'p-4 sm:p-6'
    const fullWidthSectionClass = `${sectionClassName} md:col-span-2`
    const actionPlaceholder = projectsLoading ? 'در حال بارگذاری...' : 'پروژه را انتخاب کنید'

    return (
        <FormLayout
            title="جلسه آموزش حین کار (TBM)"
            code="PR-01-07-01"
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
                                <Link href="/archive" className="text-amber-700 underline truncate max-w-full" title="بازگشت به آرشیو">
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

                <FormSection title="اطلاعات پایه" className={fullWidthSectionClass}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="پروژه"
                            required
                            options={projectOptions}
                            placeholder={actionPlaceholder}
                            value={formData.projectId}
                            onChange={(value) => {
                                if (projectsLoading) return
                                updateField('projectId', value as FR0110State['projectId'])
                            }}
                            helper={projectsLoading ? 'در حال بارگذاری فهرست پروژه‌ها' : undefined}
                        />
                        <TextInput
                            label="شماره جلسه TBM"
                            placeholder="شماره جلسه (مثلاً: TBM-25-014)"
                            required
                            value={formData.tbmNumber}
                            onChange={(value) => updateField('tbmNumber', value)}
                        />
                        <TextInput
                            label="محل اجرای جلسه"
                            placeholder="مثلاً: کارگاه A، سالن مونتاژ"
                            value={formData.projectLocation}
                            onChange={(value) => updateField('projectLocation', value)}
                        />
                        <DateInput
                            label="تاریخ جلسه"
                            required
                            helper="تاریخ جلسه"
                            value={formData.date}
                            onChange={(value) => updateField('date', value)}
                        />
                        <TextInput
                            label="موضوع جلسه"
                            placeholder="موضوع جلسه (مثلاً: کار در ارتفاع)"
                            required
                            value={formData.subject}
                            onChange={(value) => updateField('subject', value)}
                        />
                        <TextInput
                            label="مدرس جلسه"
                            placeholder="مثلاً: سرپرست HSE"
                            required
                            value={formData.instructor}
                            onChange={(value) => updateField('instructor', value)}
                        />
                    </div>
                </FormSection>

                <FormSection title="شرکت‌کنندگان" className={fullWidthSectionClass}>
                    <RowRepeater
                        label="حاضرین جلسه"
                        columns={[
                            { key: 'fullName', label: 'نام و نام خانوادگی', type: 'text', placeholder: 'مثلاً: علی رضایی' },
                            { key: 'role', label: 'نقش/سمت', type: 'text', placeholder: 'مثلاً: سرپرست کارگاه' },
                            { key: 'signature', label: 'امضا', type: 'text', placeholder: 'مثلاً: امضا دریافت شد' },
                        ]}
                        value={formData.attendees}
                        onChange={(value) => updateField('attendees', value as FR0110AttendeeRow[])}
                    />
                    <p className="mt-2 text-xs text-muted">{ATTENDEE_HELPER}</p>
                </FormSection>

                <FormSection title="یادداشت‌های جلسه" className={sectionClassName}>
                    <Textarea
                        label="یادداشت‌های تکمیلی"
                        placeholder="یادداشت‌های تکمیلی (اختیاری)"
                        rows={4}
                        value={formData.notes}
                        onChange={(value) => updateField('notes', value)}
                    />
                </FormSection>
            </div>
        </FormLayout>
    )
}