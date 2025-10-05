'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { DateInput } from '@/components/ui/DateInput'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { CheckboxGroup } from '@/components/ui/CheckboxGroup'
import { Textarea } from '@/components/ui/Textarea'
import { RowRepeater } from '@/components/ui/RowRepeater'
import { Select } from '@/components/ui/Select'
import {
    createActionForm,
    createActionItem,
    fetchProjects,
    submitEffectiveness,
    submitExecutionReport,
    type Project,
} from '@/lib/hse'

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

const initialState = {
    projectId: '',
    requesterName: '',
    requesterUnit: '',
    actionNumber: '',
    date: '',
    requestType: '',
    actionSource: [] as string[],
    nonConformityDescription: '',
    rootCauseObjective: '',
    riskAssessmentUpdate: '',
    riskAssessmentDate: '',
    newKnowledgeExperience: '',
    requiredActions: [] as Record<string, any>[],
    responsibleApproval: '',
    managerApproval: '',
    affectedDocuments: [] as Record<string, any>[],
    firstReportStatus: '',
    firstReportDate: '',
    firstReportDescription: '',
    firstReportResponsibleSignature: '',
    firstReportApproverSignature: '',
    secondReportStatus: '',
    secondReportDate: '',
    secondReportDescription: '',
    secondReportResponsibleSignature: '',
    secondReportApproverSignature: '',
    effectivenessDate: '',
    effectivenessMethod: '',
    effectivenessStatus: '',
    newActionNumber: '',
    effectivenessReviewer: '',
    effectivenessSignature: '',
}

type FormState = typeof initialState

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
    const [formData, setFormData] = useState<FormState>(initialState)
    const [projects, setProjects] = useState<Project[]>([])
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        const loadProjects = async () => {
            try {
                setLoadingOptions(true)
                const data = await fetchProjects()
                setProjects(data)
            } catch (err) {
                console.error('load projects failed', err)
                setError('دریافت فهرست پروژه‌ها ممکن نشد. دوباره تلاش کنید.')
            } finally {
                setLoadingOptions(false)
            }
        }
        loadProjects()
    }, [])

    const updateField = (field: keyof FormState, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        setFormData((prev) => ({ ...initialState, projectId: prev.projectId }))
        setError(null)
        setSuccess(null)
    }

    const projectOptions = useMemo(
        () =>
            projects.map((project) => ({
                value: String(project.id),
                label: `${project.code} – ${project.name}`,
            })),
        [projects],
    )

    const handleSubmit = async () => {
        setSuccess(null)
        setError(null)

        if (!formData.projectId) {
            setError('پروژه را انتخاب کنید.')
            return
        }
        if (!formData.requestType) {
            setError('نوع درخواست را انتخاب کنید.')
            return
        }
        if (!formData.date) {
            setError('تاریخ را وارد کنید.')
            return
        }
        if (formData.actionSource.length === 0) {
            setError('حداقل یک منبع اقدام را انتخاب کنید.')
            return
        }

        try {
            setSubmitting(true)
            const action = await createActionForm({
                project: Number(formData.projectId),
                requester_name: formData.requesterName,
                requester_unit_text: formData.requesterUnit,
                request_date: formData.date,
                request_type: requestTypeMap[formData.requestType],
                sources: formData.actionSource.map((item) => sourceMap[item] ?? 'OTHER'),
                nonconformity_or_change_desc: formData.nonConformityDescription,
                root_cause_or_goal_desc: formData.rootCauseObjective,
                needs_risk_update: boolFromYesNo(formData.riskAssessmentUpdate),
                risk_update_date: formData.riskAssessmentDate || null,
                creates_knowledge: boolFromYesNo(formData.newKnowledgeExperience),
                approved_by_performer_name: formData.responsibleApproval || null,
                approved_by_manager_name: formData.managerApproval || null,
            })

            const actionId = action.id

            const actionItems = (formData.requiredActions ?? []).filter((row) =>
                (row.action ?? '').trim() !== '' ||
                (row.resources ?? '').trim() !== '' ||
                (row.deadline ?? '').trim() !== '' ||
                (row.responsible ?? '').trim() !== '',
            )

            for (const item of actionItems) {
                await createActionItem(actionId, {
                    description_text: item.action ?? '',
                    resources_text: item.resources ?? '',
                    due_date: item.deadline || null,
                    owner_text: item.responsible ?? '',
                })
            }

            if (formData.firstReportStatus) {
                const approved = formData.firstReportStatus === 'approved'
                const notes: string[] = []
                if (formData.firstReportDescription) notes.push(`شرح: ${formData.firstReportDescription}`)
                if (formData.firstReportResponsibleSignature) notes.push(`مسئول: ${formData.firstReportResponsibleSignature}`)
                if (formData.firstReportApproverSignature) notes.push(`تأییدکننده: ${formData.firstReportApproverSignature}`)
                await submitExecutionReport(actionId, {
                    report_no: 1,
                    approved,
                    note: notes.join(' | ') || undefined,
                    new_date: formData.firstReportDate || null,
                })
            }

            if (formData.secondReportStatus) {
                const approved = formData.secondReportStatus === 'approved'
                const notes: string[] = []
                if (formData.secondReportDescription) notes.push(`شرح: ${formData.secondReportDescription}`)
                if (formData.secondReportResponsibleSignature) notes.push(`مسئول: ${formData.secondReportResponsibleSignature}`)
                if (formData.secondReportApproverSignature) notes.push(`تأییدکننده: ${formData.secondReportApproverSignature}`)
                await submitExecutionReport(actionId, {
                    report_no: 2,
                    approved,
                    note: notes.join(' | ') || undefined,
                    new_date: formData.secondReportDate || null,
                })
            }

            if (formData.effectivenessStatus) {
                const effective = formData.effectivenessStatus === 'effective'
                if (!formData.effectivenessDate) {
                    throw new Error('تاریخ ارزیابی اثربخشی الزامی است.')
                }
                if (!effective && !formData.newActionNumber) {
                    throw new Error('برای اقدام غیرموثر، شماره اقدام جدید را وارد کنید.')
                }
                const methodParts = [formData.effectivenessMethod]
                if (formData.effectivenessReviewer) methodParts.push(`بررسی‌کننده: ${formData.effectivenessReviewer}`)
                if (formData.effectivenessSignature) methodParts.push(`امضا: ${formData.effectivenessSignature}`)
                await submitEffectiveness(actionId, {
                    checked_at: formData.effectivenessDate,
                    method_text: methodParts.filter(Boolean).join(' | '),
                    effective,
                    new_action_indicator: formData.newActionNumber || null,
                })
            }

            setSuccess(`اقدام با شناسه ${action.indicator} ثبت شد.`)
            setFormData((prev) => ({ ...initialState, projectId: prev.projectId, actionNumber: action.indicator }))
        } catch (err: any) {
            console.error('submit action error', err)
            const detail = err?.message ?? 'خطایی رخ داد. دوباره تلاش کنید.'
            setError(detail)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <FormLayout
            title="اقدام اصلاحی/پیشگیرانه/تغییرات"
            code="FR-01-01-00"
            onReset={resetForm}
            footer={
                <div className="space-y-4">
                    {error && (
                        <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-danger text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-success text-sm">
                            {success}
                        </div>
                    )}
                    <div className="flex items-center justify-end gap-3">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={resetForm}
                            disabled={submitting}
                        >
                            پاک‌کردن فرم
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={submitting || loadingOptions}
                        >
                            {submitting ? 'در حال ثبت...' : 'ثبت اقدام'}
                        </button>
                    </div>
                </div>
            }
        >
            <FormSection title="اطلاعات کلی">
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

            <FormSection title="نوع درخواست">
                <RadioGroup
                    label="نوع درخواست"
                    options={requestTypeOptions}
                    required
                    value={formData.requestType}
                    onChange={(value) => updateField('requestType', value)}
                />
            </FormSection>

            <FormSection title="منشأ اقدام">
                <CheckboxGroup
                    label="منشأ اقدام"
                    options={actionSourceOptions}
                    required
                    value={formData.actionSource}
                    onChange={(value) => updateField('actionSource', value)}
                />
            </FormSection>

            <FormSection title="شرح عدم‌انطباق/درخواست تغییر">
                <Textarea
                    label="شرح عدم‌انطباق/درخواست تغییر"
                    placeholder="چه مشکلی دیدید/چه تغییری می‌خواهید؟"
                    required
                    value={formData.nonConformityDescription}
                    onChange={(value) => updateField('nonConformityDescription', value)}
                />
            </FormSection>

            <FormSection title="ریشه/هدف">
                <Textarea
                    label="ریشه عدم‌انطباق یا هدف اقدام"
                    required
                    value={formData.rootCauseObjective}
                    onChange={(value) => updateField('rootCauseObjective', value)}
                />
            </FormSection>

            <FormSection title="به‌روزرسانی ارزیابی ریسک">
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

            <FormSection title="اقدامات و منابع موردنیاز">
                <RowRepeater
                    label="اقدامات و منابع موردنیاز"
                    columns={[
                        { key: 'action', label: 'شرح اقدام', type: 'text', placeholder: 'مثال: نصب گارد' },
                        { key: 'resources', label: 'منابع موردنیاز', type: 'text', placeholder: 'مثال: جوشکار، آهن‌آلات' },
                        { key: 'deadline', label: 'مهلت انجام', type: 'date' },
                        { key: 'responsible', label: 'مسئول انجام', type: 'text', placeholder: 'نام و سمت' },
                    ]}
                    value={formData.requiredActions}
                    onChange={(value) => updateField('requiredActions', value)}
                />
            </FormSection>

            <FormSection title="تأییدات">
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

            <FormSection title="گزارش انجام اقدامات (مرتبه اول)">
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

            <FormSection title="گزارش انجام اقدامات (مرتبه دوم)">
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

            <FormSection title="ارزیابی اثربخشی">
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
        </FormLayout>
    )
}
