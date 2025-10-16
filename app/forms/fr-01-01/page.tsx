'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { DateInput } from '@/components/ui/DateInput'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { CheckboxGroup } from '@/components/ui/CheckboxGroup'
import { Textarea } from '@/components/ui/Textarea'
import { RowRepeater } from '@/components/ui/RowRepeater'
import { Select } from '@/components/ui/Select'
import { MultiTagInput } from '@/components/ui/MultiTagInput'
import {
    createActionForm,
    createActionItem,
    fetchProjects,
    submitEffectiveness,
    submitExecutionReport,
    type Project,
} from '@/lib/hse'
import { ApiError } from '@/lib/api/_client'
import { getEntry, updateEntry } from '@/lib/api/formEntry'
import { usePermissions } from '@/hooks/usePermissions'
import {
    FR0101_INITIAL_STATE,
    type FR0101ActionRow,
    type FR0101ServerEntry,
    type FR0101State,
    fr0101Adapter,
    sanitizeAffectedDocuments,
} from '@/lib/formEntry/adapters/FR-01-01'

const requestTypeOptions = [
    { value: 'corrective', label: 'اقدام اصلاحی' },
    { value: 'preventive', label: 'اقدام پیشگیرانه' },
    { value: 'change', label: 'تغییرات' },
    { value: 'improvement', label: 'پیشنهاد بهبود' },
]

const actionSourceOptions = [
    { value: 'audit', label: 'ممیزی' },
    { value: 'compliance', label: 'انطباق با قوانین' },
    { value: 'process_risks', label: 'ریسک‌ها و فرصت‌های فرآیندی' },
    { value: 'incidents', label: 'حوادث' },
    { value: 'near_misses', label: 'شبه‌حوادث' },
    { value: 'unsafe_conditions', label: 'شرایط ناایمن' },
    { value: 'unsafe_acts', label: 'اعمال ناایمن' },
    { value: 'checklist', label: 'چک‌لیست' },
    { value: 'safety_risks', label: 'ریسک‌های ایمنی/بهداشتی/اموال' },
    { value: 'environmental', label: 'جنبه‌های زیست‌محیطی' },
    { value: 'management_review', label: 'بازنگری مدیریت' },
    { value: 'other', label: 'سایر' },
]

const yesNoOptions = [
    { value: 'yes', label: 'بله' },
    { value: 'no', label: 'خیر' },
]

const approvedOptions = [
    { value: 'approved', label: 'مورد تأیید هستند' },
    { value: 'not_approved', label: 'مورد تأیید نیستند' },
]

const effectiveOptions = [
    { value: 'effective', label: 'اثربخش هستند' },
    { value: 'not_effective', label: 'اثربخش نیستند' },
]

const affectedDocumentsSuggestions = [
    { value: 'installation_instruction', label: 'دستورالعمل نصب' },
    { value: 'welding_procedure', label: 'روش اجرایی جوشکاری' },
    { value: 'maintenance_manual', label: 'دستورالعمل نگهداری' },
    // TODO: Replace with داده مرجع از API اسناد در صورت فراهم شدن.
]

const requestTypeMap: Record<string, 'CORRECTIVE' | 'PREVENTIVE' | 'CHANGE' | 'SUGGESTION'> = {
    corrective: 'CORRECTIVE',
    preventive: 'PREVENTIVE',
    change: 'CHANGE',
    improvement: 'SUGGESTION',
}

const sourceMap: Record<string, string> = {
    audit: 'AUDIT',
    compliance: 'LEGAL',
    process_risks: 'PROCESS_RISKS',
    incidents: 'INCIDENTS',
    near_misses: 'NEAR_MISS',
    unsafe_conditions: 'UNSAFE_CONDITION',
    unsafe_acts: 'UNSAFE_ACT',
    checklist: 'CHECKLIST',
    safety_risks: 'HSE_RISKS',
    environmental: 'ENV_ASPECTS',
    management_review: 'MGT_REVIEW',
    other: 'OTHER',
}

const boolFromYesNo = (value: string) => value === 'yes'

export default function FR0101Page() {
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode')
    const entryIdParam = searchParams.get('entryId')
    const entryId = entryIdParam ? Number(entryIdParam) : null
    const isEditMode = mode === 'edit' && entryId !== null && !Number.isNaN(entryId)

    const { can } = usePermissions()
    const canEditArchiveEntries = can('archive', 'update')

    const [formData, setFormData] = useState<FR0101State>(FR0101_INITIAL_STATE)
    const [projects, setProjects] = useState<Project[]>([])
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [entryLoading, setEntryLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<string[]>([])
    const [prefilledState, setPrefilledState] = useState<FR0101State | null>(null)
    const [affectedDocsWarning, setAffectedDocsWarning] = useState<string | null>(null)

    useEffect(() => {
        const loadProjects = async () => {
            try {
                setLoadingOptions(true)
                const data = await fetchProjects()
                setProjects(data)
            } catch (err) {
                console.error('load projects failed', err)
                setError('?????? ????? ???????? ???? ???. ?????? ???? ????.')
            } finally {
                setLoadingOptions(false)
            }
        }
        loadProjects()
    }, [])

    useEffect(() => {
        if (!isEditMode || entryId === null) {
            setFormData(FR0101_INITIAL_STATE)
            setPrefilledState(null)
            setFieldErrors([])
            setAffectedDocsWarning(null)
            return
        }

        const loadEntry = async () => {
            setEntryLoading(true)
            try {
                const entry = await getEntry<FR0101ServerEntry>('FR-01-01', entryId)
                const mapped = fr0101Adapter.toState(entry)
                setFormData(mapped)
                setPrefilledState({ ...mapped })
                const prefillSanitized = sanitizeAffectedDocuments(entry.data?.affected_documents ?? [])
                setAffectedDocsWarning(prefillSanitized.warnings.length > 0 ? prefillSanitized.warnings.join(' ') : null)
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

    const updateField = <K extends keyof FR0101State>(field: K, value: FR0101State[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        if (field === 'affectedDocuments') {
            setAffectedDocsWarning(null)
        }
    }

    const resetForm = () => {
        if (isEditMode && prefilledState) {
            setFormData(prefilledState)
            const prefillSanitized = sanitizeAffectedDocuments(prefilledState.affectedDocuments)
            setAffectedDocsWarning(prefillSanitized.warnings.length > 0 ? prefillSanitized.warnings.join(' ') : null)
        } else {
            setFormData((prev) => ({ ...FR0101_INITIAL_STATE, projectId: prev.projectId }))
            setAffectedDocsWarning(null)
        }
        setError(null)
        setSuccess(null)
        setFieldErrors([])
    }

    const projectOptions = useMemo(() => {
        const base = projects.map((project) => ({
            value: String(project.id),
            label: `${project.code} - ${project.name}`,
        }))
        if (isEditMode && formData.projectId && base.every((option) => option.value !== formData.projectId)) {
            base.unshift({ value: formData.projectId, label: formData.projectId })
        }
        return base
    }, [formData.projectId, isEditMode, projects])

    const handleSubmit = async () => {
        setSuccess(null)
        setError(null)
        setFieldErrors([])
        const sanitizedDocs = sanitizeAffectedDocuments(formData.affectedDocuments)
        setAffectedDocsWarning(sanitizedDocs.warnings.length > 0 ? sanitizedDocs.warnings.join(' ') : null)

        const docsChanged =
            sanitizedDocs.items.length !== formData.affectedDocuments.length ||
            sanitizedDocs.items.some((item, index) => formData.affectedDocuments[index] !== item)
        if (docsChanged) {
            setFormData((prev) => ({ ...prev, affectedDocuments: sanitizedDocs.items }))
        }

        const stateForSubmit: FR0101State = {
            ...formData,
            affectedDocuments: sanitizedDocs.items,
        }

        if (!stateForSubmit.projectId) {
            setError('پروژه را انتخاب کنید.')
            return
        }
        if (!stateForSubmit.requestType) {
            setError('نوع درخواست را انتخاب کنید.')
            return
        }
        if (!stateForSubmit.date) {
            setError('تاریخ را وارد کنید.')
            return
        }
        if (stateForSubmit.actionSource.length === 0) {
            setError('حداقل یک منبع اقدام را انتخاب کنید.')
            return
        }

        if (isEditMode && entryId !== null) {
            if (!canEditArchiveEntries) {
                setError('دسترسی لازم برای ویرایش این رکورد را ندارید.')
                return
            }
            try {
                setSubmitting(true)
                const payload = fr0101Adapter.toPayload(stateForSubmit)
                await updateEntry<FR0101ServerEntry>('FR-01-01', entryId, payload)
                setPrefilledState({ ...stateForSubmit })
                setSuccess('بروزرسانی شد')
                setFieldErrors([])
            } catch (err) {
                console.error('update action form error', err)
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
            const action = await createActionForm({
                project: Number(stateForSubmit.projectId),
                requester_name: stateForSubmit.requesterName,
                requester_unit_text: stateForSubmit.requesterUnit,
                request_date: stateForSubmit.date,
                request_type: requestTypeMap[stateForSubmit.requestType],
                sources: stateForSubmit.actionSource.map((item) => sourceMap[item] ?? 'OTHER'),
                nonconformity_or_change_desc: stateForSubmit.nonConformityDescription,
                root_cause_or_goal_desc: stateForSubmit.rootCauseObjective,
                affected_documents: stateForSubmit.affectedDocuments,
                needs_risk_update: boolFromYesNo(stateForSubmit.riskAssessmentUpdate),
                risk_update_date: stateForSubmit.riskAssessmentDate || null,
                creates_knowledge: boolFromYesNo(stateForSubmit.newKnowledgeExperience),
                approved_by_performer_name: stateForSubmit.responsibleApproval || null,
                approved_by_manager_name: stateForSubmit.managerApproval || null,
            })

            const actionId = action.id

            const actionItems = ((stateForSubmit.requiredActions as FR0101ActionRow[]).filter(
                (row): row is FR0101ActionRow =>
                    (row.action ?? '').trim() !== '' ||
                    (row.resources ?? '').trim() !== '' ||
                    (row.deadline ?? '').trim() !== '' ||
                    (row.responsible ?? '').trim() !== '',
            )) as FR0101ActionRow[]

            for (const item of actionItems) {
                await createActionItem(actionId, {
                    description_text: item.action ?? '',
                    resources_text: item.resources ?? '',
                    due_date: item.deadline || null,
                    owner_text: item.responsible ?? '',
                })
            }

            if (stateForSubmit.firstReportStatus) {
                const approved = stateForSubmit.firstReportStatus === 'approved'
                const notes: string[] = []
                if (stateForSubmit.firstReportDescription) notes.push(`شرح: ${stateForSubmit.firstReportDescription}`)
                if (stateForSubmit.firstReportResponsibleSignature)
                    notes.push(`مسئول: ${stateForSubmit.firstReportResponsibleSignature}`)
                if (stateForSubmit.firstReportApproverSignature)
                    notes.push(`تأییدکننده: ${stateForSubmit.firstReportApproverSignature}`)
                await submitExecutionReport(actionId, {
                    report_no: 1,
                    approved,
                    note: notes.join(' | ') || undefined,
                    new_date: stateForSubmit.firstReportDate || null,
                })
            }

            if (stateForSubmit.secondReportStatus) {
                const approved = stateForSubmit.secondReportStatus === 'approved'
                const notes: string[] = []
                if (stateForSubmit.secondReportDescription) notes.push(`شرح: ${stateForSubmit.secondReportDescription}`)
                if (stateForSubmit.secondReportResponsibleSignature)
                    notes.push(`مسئول: ${stateForSubmit.secondReportResponsibleSignature}`)
                if (stateForSubmit.secondReportApproverSignature)
                    notes.push(`تأییدکننده: ${stateForSubmit.secondReportApproverSignature}`)
                await submitExecutionReport(actionId, {
                    report_no: 2,
                    approved,
                    note: notes.join(' | ') || undefined,
                    new_date: stateForSubmit.secondReportDate || null,
                })
            }

            if (stateForSubmit.effectivenessStatus) {
                const effective = stateForSubmit.effectivenessStatus === 'effective'
                if (!stateForSubmit.effectivenessDate) {
                    throw new Error('تاریخ ارزیابی اثربخشی الزامی است.')
                }
                if (!effective && !stateForSubmit.newActionNumber) {
                    throw new Error('برای اقدام غیرموثر، شماره اقدام جدید را وارد کنید.')
                }
                const methodParts = [stateForSubmit.effectivenessMethod]
                if (stateForSubmit.effectivenessReviewer) methodParts.push(`بررسی‌کننده: ${stateForSubmit.effectivenessReviewer}`)
                if (stateForSubmit.effectivenessSignature) methodParts.push(`امضا: ${stateForSubmit.effectivenessSignature}`)
                await submitEffectiveness(actionId, {
                    checked_at: stateForSubmit.effectivenessDate,
                    method_text: methodParts.filter(Boolean).join(' | '),
                    effective,
                    new_action_indicator: stateForSubmit.newActionNumber || null,
                })
            }

            setSuccess(`اقدام با شناسه ${action.indicator} ثبت شد.`)
            setFieldErrors([])
            setFormData((prev) => ({
                ...FR0101_INITIAL_STATE,
                projectId: prev.projectId,
                actionNumber: action.indicator,
            }))
            setAffectedDocsWarning(null)
        } catch (err) {
            console.error('submit action error', err)
            if (err instanceof ApiError) {
                if (err.status === 403) {
                    setError('دسترسی لازم برای ثبت این فرم را ندارید.')
                    setFieldErrors([])
                } else if (err.status === 400 || err.status === 422) {
                    const messages = err.messages && err.messages.length > 0 ? err.messages : null
                    setError('لطفاً خطاهای زیر را بررسی کنید.')
                    setFieldErrors(messages ?? ['ثبت فرم با خطا مواجه شد.'])
                } else {
                    setError(err.message ?? 'خطایی رخ داد. دوباره تلاش کنید.')
                    setFieldErrors([])
                }
            } else {
                const detail = (err as { message?: string })?.message ?? 'خطایی رخ داد. دوباره تلاش کنید.'
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
        loadingOptions ||
        (isEditMode && (entryLoading || !canEditArchiveEntries))

    const resetDisabled = submitting || loadingOptions || (isEditMode && entryLoading)


    const sectionClassName = 'p-4 sm:p-6'
    const fullWidthSectionClass = `${sectionClassName} md:col-span-2`

    return (
        <FormLayout
            title="اقدام اصلاحی/پیشگیرانه/تغییرات"
            code="FR-01-01-00"
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
                            پاک‌کردن فرم
                        </button>
                        <button
                            type="button"
                            className="btn-primary w-full md:w-auto"
                            onClick={handleSubmit}
                            disabled={primaryDisabled}
                        >
                            {primaryButtonLabel}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                {isEditMode ? (
                    <div className="md:col-span-2 mb-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        <div className="flex flex-col gap-2 min-w-0">
                            <span className="truncate max-w-full" title={`در حال ویرایش رکورد #${entryId}`}>
                                در حال ویرایش رکورد #{entryId}
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
                                    <span className="truncate max-w-full" title="مجوز ویرایش برای شما فعال نیست.">
                                        مجوز ویرایش برای شما فعال نیست.
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
                            label="پروژه"
                            required
                            options={projectOptions}
                            value={formData.projectId}
                            onChange={(value) => updateField('projectId', value)}
                            placeholder={loadingOptions ? 'در حال بارگذاری...' : 'انتخاب کنید'}
                        />
                        <DateInput
                            label="تاریخ درخواست"
                            required
                            value={formData.date}
                            onChange={(value) => updateField('date', value)}
                        />
                        <TextInput
                            label="نام درخواست‌کننده"
                            placeholder="مثال: علی رضایی"
                            required
                            value={formData.requesterName}
                            onChange={(value) => updateField('requesterName', value)}
                        />
                        <TextInput
                            label="واحد درخواست‌کننده"
                            placeholder="مثال: تولید/برش"
                            required
                            value={formData.requesterUnit}
                            onChange={(value) => updateField('requesterUnit', value)}
                        />
                        <TextInput
                            label="شماره اقدام"
                            placeholder="پس از ثبت به‌صورت خودکار تولید می‌شود"
                            value={formData.actionNumber}
                            onChange={(value) => updateField('actionNumber', value)}
                            helper="در صورت خالی بودن، سامانه شناسه را پس از ثبت اعلام می‌کند."
                        />
                    </div>
                </FormSection>

                <FormSection title="نوع درخواست" className={sectionClassName}>
                    <RadioGroup
                        label="نوع درخواست"
                        options={requestTypeOptions}
                        required
                        value={formData.requestType}
                        onChange={(value) => updateField('requestType', value)}
                    />
                </FormSection>

                <FormSection title="منشأ اقدام" className={sectionClassName}>
                    <CheckboxGroup
                        label="منشأ اقدام"
                        options={actionSourceOptions}
                        required
                        value={formData.actionSource}
                        onChange={(value) => updateField('actionSource', value)}
                    />
                </FormSection>

                <FormSection title="شرح عدم‌انطباق/درخواست تغییر" className={fullWidthSectionClass}>
                    <Textarea
                        label="شرح عدم‌انطباق/درخواست تغییر"
                        placeholder="چه مشکلی دیدید/چه تغییری می‌خواهید؟"
                        required
                        value={formData.nonConformityDescription}
                        onChange={(value) => updateField('nonConformityDescription', value)}
                    />
                </FormSection>

                <FormSection title="ریشه/هدف" className={fullWidthSectionClass}>
                    <Textarea
                        label="ریشه عدم‌انطباق یا هدف اقدام"
                        required
                        value={formData.rootCauseObjective}
                        onChange={(value) => updateField('rootCauseObjective', value)}
                    />
                </FormSection>

                <FormSection title="به‌روزرسانی ارزیابی ریسک" className={fullWidthSectionClass}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <RadioGroup
                            label="نیاز به به‌روزرسانی ارزیابی ریسک دارد؟"
                            options={yesNoOptions}
                            required
                            value={formData.riskAssessmentUpdate}
                            onChange={(value) => updateField('riskAssessmentUpdate', value)}
                        />
                        {formData.riskAssessmentUpdate === 'yes' && (
                            <DateInput
                                label="تاریخ به‌روزرسانی"
                                value={formData.riskAssessmentDate}
                                onChange={(value) => updateField('riskAssessmentDate', value)}
                            />
                        )}
                        <RadioGroup
                            label="ایجاد دانش/تجربه جدید"
                            options={yesNoOptions}
                            value={formData.newKnowledgeExperience}
                            onChange={(value) => updateField('newKnowledgeExperience', value)}
                        />
                    </div>
                </FormSection>

                <FormSection title="اقدامات و منابع موردنیاز" className={fullWidthSectionClass}>
                    <RowRepeater
                        label="اقدامات و منابع موردنیاز"
                        columns={[
                            { key: 'action', label: 'شرح اقدام', type: 'text', placeholder: 'مثال: نصب گارد' },
                            { key: 'resources', label: 'منابع موردنیاز', type: 'text', placeholder: 'مثال: جوشکار، آهن‌آلات' },
                            { key: 'deadline', label: 'مهلت انجام', type: 'date' },
                            { key: 'responsible', label: 'مسئول انجام', type: 'text', placeholder: 'نام و سمت' },
                        ]}
                        value={formData.requiredActions}
                        onChange={(value) => updateField('requiredActions', value as FR0101ActionRow[])}
                    />
                </FormSection>

                <FormSection title="اسناد و مدارک متاثر" className={sectionClassName}>
                    <MultiTagInput
                        label="اسناد و مدارک متاثر"
                        placeholder="مثلاً: دستورالعمل نصب، روش اجرایی جوشکاری"
                        value={formData.affectedDocuments}
                        onChange={(value) => updateField('affectedDocuments', value)}
                        options={affectedDocumentsSuggestions}
                        helper="در صورت نیاز، عنوان سند را وارد کنید یا از پیشنهادها انتخاب نمایید."
                        maxItems={12}
                        maxLength={60}
                    />
                    {affectedDocsWarning ? (
                        <p className="text-xs text-amber-600">{affectedDocsWarning}</p>
                    ) : null}
                </FormSection>

                <FormSection title="تأییدات" className={sectionClassName}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextInput
                            label="تأیید مسئول/مسئولین انجام"
                            value={formData.responsibleApproval}
                            onChange={(value) => updateField('responsibleApproval', value)}
                        />
                        <TextInput
                            label="تأیید مدیر پروژه/سرپرست کارگاه/سرپرست HSE"
                            value={formData.managerApproval}
                            onChange={(value) => updateField('managerApproval', value)}
                        />
                    </div>
                </FormSection>

                <FormSection title="گزارش انجام اقدامات (مرتبه اول)" className={fullWidthSectionClass}>
                    <div className="space-y-4">
                        <RadioGroup
                            label="وضعیت اقدامات"
                            options={approvedOptions}
                            value={formData.firstReportStatus}
                            onChange={(value) => updateField('firstReportStatus', value)}
                        />
                        {formData.firstReportStatus === 'not_approved' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DateInput
                                    label="تاریخ توافق‌شده مجدد"
                                    value={formData.firstReportDate}
                                    onChange={(value) => updateField('firstReportDate', value)}
                                />
                                <Textarea
                                    label="شرح اقدامات توافق‌شده مجدد"
                                    value={formData.firstReportDescription}
                                    onChange={(value) => updateField('firstReportDescription', value)}
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <TextInput
                                label="امضای مسئول انجام"
                                value={formData.firstReportResponsibleSignature}
                                onChange={(value) => updateField('firstReportResponsibleSignature', value)}
                            />
                            <TextInput
                                label="نام تاییدکننده"
                                value={formData.firstReportApproverSignature}
                                onChange={(value) => updateField('firstReportApproverSignature', value)}
                            />
                            <DateInput
                                label="تاریخ تایید"
                                value={formData.firstReportDate}
                                onChange={(value) => updateField('firstReportDate', value)}
                            />
                        </div>
                    </div>
                </FormSection>

                <FormSection title="گزارش انجام اقدامات (مرتبه دوم)" className={fullWidthSectionClass}>
                    <div className="space-y-4">
                        <RadioGroup
                            label="وضعیت اقدامات"
                            options={approvedOptions}
                            value={formData.secondReportStatus}
                            onChange={(value) => updateField('secondReportStatus', value)}
                        />
                        {formData.secondReportStatus === 'not_approved' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DateInput
                                    label="تاریخ توافق‌شده مجدد"
                                    value={formData.secondReportDate}
                                    onChange={(value) => updateField('secondReportDate', value)}
                                />
                                <Textarea
                                    label="شرح اقدامات توافق‌شده مجدد"
                                    value={formData.secondReportDescription}
                                    onChange={(value) => updateField('secondReportDescription', value)}
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <TextInput
                                label="امضای مسئول انجام"
                                value={formData.secondReportResponsibleSignature}
                                onChange={(value) => updateField('secondReportResponsibleSignature', value)}
                            />
                            <TextInput
                                label="نام تاییدکننده"
                                value={formData.secondReportApproverSignature}
                                onChange={(value) => updateField('secondReportApproverSignature', value)}
                            />
                            <DateInput
                                label="تاریخ تایید"
                                value={formData.secondReportDate}
                                onChange={(value) => updateField('secondReportDate', value)}
                            />
                        </div>
                    </div>
                </FormSection>

                <FormSection title="ارزیابی اثربخشی" className={fullWidthSectionClass}>
                    <div className="space-y-4">
                        <RadioGroup
                            label="وضعیت اثربخشی"
                            options={effectiveOptions}
                            value={formData.effectivenessStatus}
                            onChange={(value) => updateField('effectivenessStatus', value)}
                        />
                        {formData.effectivenessStatus === 'not_effective' && (
                            <TextInput
                                label="شماره اقدام جدید"
                                value={formData.newActionNumber}
                                onChange={(value) => updateField('newActionNumber', value)}
                                required
                            />
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <DateInput
                                label="تاریخ"
                                value={formData.effectivenessDate}
                                onChange={(value) => updateField('effectivenessDate', value)}
                            />
                            <TextInput
                                label="روش ارزیابی"
                                value={formData.effectivenessMethod}
                                onChange={(value) => updateField('effectivenessMethod', value)}
                            />
                            <TextInput
                                label="بررسی‌کننده"
                                value={formData.effectivenessReviewer}
                                onChange={(value) => updateField('effectivenessReviewer', value)}
                            />
                            <TextInput
                                label="امضا"
                                value={formData.effectivenessSignature}
                                onChange={(value) => updateField('effectivenessSignature', value)}
                            />
                        </div>
                    </div>
                </FormSection>
            </div>
        </FormLayout>
    )
}
