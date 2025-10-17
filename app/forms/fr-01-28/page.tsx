'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { NumberInput } from '@/components/ui/NumberInput'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { CheckboxGroup } from '@/components/ui/CheckboxGroup'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import {
    createRiskRecord,
    fetchOrgUnits,
    fetchProjects,
    fetchSections,
    submitRiskReevaluation,
    type OrgUnit,
    type Project,
    type Section,
} from '@/lib/hse'
import { ApiError } from '@/lib/api/_client'
import { getEntry, updateEntry } from '@/lib/api/formEntry'
import { usePermissions } from '@/hooks/usePermissions'
import { Button as StatefulButton } from '@/components/ui/stateful-button'
import {
    FR0128_INITIAL_STATE,
    type FR0128State,
    fr0128Adapter,
} from '@/lib/formEntry/adapters/FR-01-28'

// گزینه‌ها
const routineOptions = [
    { value: 'R', label: 'R (روتین)' },
    { value: 'N', label: 'N (غیرروتین)' },
]

const legalOptions = [
    { value: 'COMPLIANT', label: 'مطابق' },
    { value: 'NONCOMPLIANT', label: 'نامطابق' },
]

const riskTypeOptions = [
    { value: 'SAFETY', label: 'ایمنی (S)' },
    { value: 'HEALTH', label: 'بهداشت (H)' },
    { value: 'PROPERTY', label: 'اموال/دارایی (F)' },
]

const inputOptions = [
    { value: 'INCIDENTS', label: 'حوادث (INCIDENTS)' },
    { value: 'NEAR_MISS', label: 'نزدیک‌به‌حادثه (NEAR_MISS)' },
    { value: 'HARMFUL_AGENTS', label: 'عوامل زیان‌آور (HARMFUL_AGENTS)' },
    { value: 'OPERATIONAL_CONTROL', label: 'کنترل‌های عملیاتی (OPERATIONAL_CONTROL)' },
    { value: 'LEGAL_COMPLIANCE', label: 'مطابقت قانونی (LEGAL_COMPLIANCE)' },
    { value: 'CONTINUAL_IMPROVEMENT', label: 'بهبود مستمر (CONTINUAL_IMPROVEMENT)' },
]

const ensureNumbers = (...values: string[]) => values.every((value) => value && !Number.isNaN(Number(value)))

const validateState = (state: FR0128State): string | null => {
    if (!state.projectId || !state.unitId) {
        return 'انتخاب «پروژه» و «واحد» الزامی است.'
    }
    if (!state.processTitle || !state.activityDesc) {
        return '«عنوان فرایند» و «شرح فعالیت» باید تکمیل شود.'
    }
    if (!state.hazardDesc || !state.eventDesc || !state.consequenceDesc) {
        return '«شرح خطر»، «توصیف رویداد» و «پیامد/نتیجه» الزامی است.'
    }
    if (!state.rootCauseDesc || !state.controlsDesc) {
        return '«علت ریشه‌ای» و «کنترل‌های موجود» باید تکمیل شود.'
    }
    if (!ensureNumbers(state.A, state.B, state.C, state.S, state.D)) {
        return 'مقادیر A، B، C، S و D باید عدد معتبر باشند.'
    }
    return null
}

export default function FR0128Page() {
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode')
    const entryIdParam = searchParams.get('entryId')
    const entryId = entryIdParam ? Number(entryIdParam) : null
    const isEditMode = mode === 'edit' && entryId !== null && !Number.isNaN(entryId)

    const { can } = usePermissions()
    const canEditArchiveEntries = can('archive', 'update')

    const [formData, setFormData] = useState<FR0128State>(FR0128_INITIAL_STATE)
    const [projects, setProjects] = useState<Project[]>([])
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [optionsLoading, setOptionsLoading] = useState(false)
    const [entryLoading, setEntryLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<string[]>([])
    const [prefilledState, setPrefilledState] = useState<FR0128State | null>(null)

    useEffect(() => {
        const loadOptions = async () => {
            try {
                setOptionsLoading(true)
                const [proj, units, secs] = await Promise.all([fetchProjects(), fetchOrgUnits(), fetchSections()])
                setProjects(proj)
                setOrgUnits(units)
                setSections(secs)
            } catch (err) {
                console.error('load risk options failed', err)
                setError('بارگذاری گزینه‌ها با خطا مواجه شد. لطفاً دوباره تلاش کنید.')
            } finally {
                setOptionsLoading(false)
            }
        }
        loadOptions()
    }, [])

    useEffect(() => {
        if (!isEditMode || entryId === null) {
            setFormData(FR0128_INITIAL_STATE)
            setPrefilledState(null)
            setFieldErrors([])
            return
        }

        const loadEntry = async () => {
            setEntryLoading(true)
            try {
                const entry = await getEntry('FR-01-28', entryId)
                const mapped = fr0128Adapter.toState(entry)
                setFormData(mapped)
                setPrefilledState({ ...mapped })
                setError(null)
                setFieldErrors([])
            } catch (err) {
                console.error('load risk entry failed', err)
                setError('بازیابی رکورد ارزیابی ریسک با خطا مواجه شد.')
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

    const unitOptions = useMemo(
        () =>
            orgUnits.map((unit) => ({
                value: String(unit.id),
                label: unit.name,
            })),
        [orgUnits],
    )

    const filteredSections = useMemo(() => {
        if (!formData.unitId) {
            return sections
        }
        const unitId = Number(formData.unitId)
        return sections.filter((section) => section.org_unit === unitId)
    }, [formData.unitId, sections])

    const sectionOptions = useMemo(
        () =>
            filteredSections.map((section) => ({
                value: String(section.id),
                label: section.name,
            })),
        [filteredSections],
    )

    const updateField = <K extends keyof FR0128State>(field: K, value: FR0128State[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        if (isEditMode && prefilledState) {
            setFormData(prefilledState)
        } else {
            setFormData((prev) => ({
                ...FR0128_INITIAL_STATE,
                projectId: prev.projectId,
                unitId: prev.unitId,
                sectionId: prev.sectionId,
            }))
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
                setError('شما مجوز ویرایش رکوردهای آرشیو را ندارید.')
                return
            }
            try {
                setSubmitting(true)
                const payload = fr0128Adapter.toPayload(formData)
                await updateEntry('FR-01-28', entryId, payload)
                setPrefilledState({ ...formData })
                setSuccess('با موفقیت به‌روزرسانی شد.')
            } catch (err) {
                console.error('update risk record error', err)
                if (err instanceof ApiError) {
                    if (err.status === 403) {
                        setError('دسترسی شما برای ویرایش این رکورد کافی نیست.')
                        setFieldErrors([])
                    } else if (err.status === 400 || err.status === 422) {
                        const messages = err.messages && err.messages.length > 0 ? err.messages : null
                        setError('بروز خطا در اعتبارسنجی. لطفاً فیلدهای مشخص‌شده را بررسی کنید.')
                        setFieldErrors(messages ?? ['پاسخی از سرور دریافت نشد.'])
                    } else {
                        setError('خطای غیرمنتظره هنگام به‌روزرسانی.')
                        setFieldErrors([])
                    }
                } else {
                    setError('خطای غیرمنتظره هنگام به‌روزرسانی.')
                    setFieldErrors([])
                }
            } finally {
                setSubmitting(false)
            }
            return
        }

        try {
            setSubmitting(true)
            const risk = await createRiskRecord({
                project: Number(formData.projectId),
                unit: Number(formData.unitId),
                section: formData.sectionId ? Number(formData.sectionId) : null,
                process_title: formData.processTitle,
                activity_desc: formData.activityDesc,
                routine_flag: formData.routineFlag,
                hazard_desc: formData.hazardDesc,
                event_desc: formData.eventDesc,
                consequence_desc: formData.consequenceDesc,
                root_cause_desc: formData.rootCauseDesc,
                existing_controls_desc: formData.controlsDesc,
                inputs: formData.inputs,
                legal_requirement_text: formData.legalRequirement,
                legal_status: formData.legalStatus,
                risk_type: formData.riskType,
                A: Number(formData.A),
                B: Number(formData.B),
                C: Number(formData.C),
                S: Number(formData.S),
                D: Number(formData.D),
                action_number_text: formData.actionNumber || null,
            })

            if (
                formData.reevalA &&
                formData.reevalB &&
                formData.reevalC &&
                formData.reevalS &&
                formData.reevalD &&
                ensureNumbers(formData.reevalA, formData.reevalB, formData.reevalC, formData.reevalS, formData.reevalD)
            ) {
                await submitRiskReevaluation(risk.id, {
                    A2: Number(formData.reevalA),
                    B2: Number(formData.reevalB),
                    C2: Number(formData.reevalC),
                    S2: Number(formData.reevalS),
                    D2: Number(formData.reevalD),
                    action_number_text2: formData.reevalActionNumber || null,
                })
            }

            setSuccess('فرم با موفقیت ثبت شد.')
            setFormData((prev) => ({
                ...FR0128_INITIAL_STATE,
                projectId: prev.projectId,
                unitId: prev.unitId,
                sectionId: prev.sectionId,
            }))
        } catch (err: any) {
            console.error('submit risk error', err)
            if (err instanceof ApiError) {
                if (err.status === 403) {
                    setError('شما مجوز ثبت این اطلاعات را ندارید.')
                    setFieldErrors([])
                } else if (err.status === 400 || err.status === 422) {
                    const messages = err.messages && err.messages.length > 0 ? err.messages : null
                    setError('بروز خطا در اعتبارسنجی. لطفاً فیلدهای مشخص‌شده را بررسی کنید.')
                    setFieldErrors(messages ?? ['هیچ پیام دقیقی از سرور دریافت نشد.'])
                } else {
                    setError(err.message ?? 'خطای غیرمنتظره هنگام ثبت.')
                    setFieldErrors([])
                }
            } else {
                const detail = (err as { message?: string })?.message ?? 'خطای غیرمنتظره هنگام ثبت.'
                setError(detail)
                setFieldErrors([])
            }
        } finally {
            setSubmitting(false)
        }
    }

    const primaryButtonLabel = isEditMode
        ? submitting
            ? 'در حال به‌روزرسانی...'
            : 'به‌روزرسانی'
        : submitting
            ? 'در حال ثبت...'
            : 'ثبت فرم'

    const primaryDisabled =
        submitting || optionsLoading || (isEditMode && (entryLoading || !canEditArchiveEntries))

    const resetDisabled = submitting || optionsLoading || (isEditMode && entryLoading)

    return (
        <FormLayout
            title="ارزیابی ریسک فعالیت/فرایند"
            code="FR-01-28-00"
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
                            پاک کردن فرم
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
            {isEditMode ? (
                <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    <div className="flex flex-col gap-2">
                        <span>در حال ویرایش رکورد #{entryId}</span>
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            <Link href="/archive" className="text-amber-700 underline">
                                بازگشت به بایگانی
                            </Link>
                            {!canEditArchiveEntries ? (
                                <span className="text-amber-600">دسترسی ویرایش برای شما فعال نیست.</span>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}

            {isEditMode && entryLoading ? (
                <div className="mb-6 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    در حال بارگذاری اطلاعات...
                </div>
            ) : null}

            <FormSection title="اطلاعات پایه">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Select
                        label="پروژه"
                        required
                        options={projectOptions}
                        value={formData.projectId}
                        onChange={(value) => updateField('projectId', value as FR0128State['projectId'])}
                        placeholder={optionsLoading && projectOptions.length === 0 ? 'در حال بارگذاری...' : 'انتخاب کنید'}
                        disabled={optionsLoading}
                    />
                    <Select
                        label="واحد"
                        required
                        options={unitOptions}
                        value={formData.unitId}
                        onChange={(value) => {
                            updateField('unitId', value as FR0128State['unitId'])
                            updateField('sectionId', '')
                        }}
                        placeholder={optionsLoading && unitOptions.length === 0 ? 'در حال بارگذاری...' : 'انتخاب کنید'}
                        disabled={optionsLoading}
                    />
                    <Select
                        label="بخش"
                        options={sectionOptions}
                        value={formData.sectionId}
                        onChange={(value) => updateField('sectionId', value as FR0128State['sectionId'])}
                        placeholder={filteredSections.length === 0 ? 'ابتدا واحد را انتخاب کنید' : 'انتخاب کنید'}
                        disabled={filteredSections.length === 0}
                    />
                </div>
            </FormSection>

            <FormSection title="شرح فعالیت">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <TextInput
                        label="عنوان فرایند"
                        value={formData.processTitle}
                        onChange={(value) => updateField('processTitle', value)}
                    />
                    <Textarea
                        label="شرح فعالیت/وظیفه"
                        value={formData.activityDesc}
                        onChange={(value) => updateField('activityDesc', value)}
                    />
                    <RadioGroup
                        label="وضعیت فعالیت (روتین/غیرروتین)"
                        options={routineOptions}
                        value={formData.routineFlag}
                        onChange={(value) => updateField('routineFlag', value as FR0128State['routineFlag'])}
                    />
                </div>
            </FormSection>

            <FormSection title="شناسایی خطرات">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Textarea
                        label="شرح خطر"
                        value={formData.hazardDesc}
                        onChange={(value) => updateField('hazardDesc', value)}
                    />
                    <Textarea
                        label="توصیف رویداد"
                        value={formData.eventDesc}
                        onChange={(value) => updateField('eventDesc', value)}
                    />
                    <Textarea
                        label="پیامد/نتیجه"
                        value={formData.consequenceDesc}
                        onChange={(value) => updateField('consequenceDesc', value)}
                    />
                    <Textarea
                        label="علت ریشه‌ای"
                        value={formData.rootCauseDesc}
                        onChange={(value) => updateField('rootCauseDesc', value)}
                    />
                    <Textarea
                        label="کنترل‌های موجود"
                        value={formData.controlsDesc}
                        onChange={(value) => updateField('controlsDesc', value)}
                    />
                </div>
                <CheckboxGroup
                    label="ورودی‌های ارزیابی"
                    options={inputOptions}
                    value={formData.inputs}
                    onChange={(value) => updateField('inputs', value)}
                />
            </FormSection>

            <FormSection title="الزامات قانونی و نوع ریسک">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Textarea
                        label="الزامات قانونی"
                        value={formData.legalRequirement}
                        onChange={(value) => updateField('legalRequirement', value)}
                    />
                    <RadioGroup
                        label="وضعیت انطباق"
                        options={legalOptions}
                        value={formData.legalStatus}
                        onChange={(value) => updateField('legalStatus', value as FR0128State['legalStatus'])}
                    />
                    <RadioGroup
                        label="نوع ریسک"
                        options={riskTypeOptions}
                        value={formData.riskType}
                        onChange={(value) => updateField('riskType', value as FR0128State['riskType'])}
                    />
                    <TextInput
                        label="کُد اقدام (FR-01-01)"
                        value={formData.actionNumber}
                        onChange={(value) => updateField('actionNumber', value)}
                        helper="در صورت نیاز به اقدام، کُد اقدام FR-01-01 را وارد کنید."
                    />
                </div>
            </FormSection>

            <FormSection title="امتیازدهی اولیه">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <NumberInput
                        label="A (مواجهه/تماس)"
                        value={formData.A}
                        onChange={(value) => updateField('A', String(value))}
                    />
                    <NumberInput
                        label="B (احتمال وقوع/تکرار در سال)"
                        value={formData.B}
                        onChange={(value) => updateField('B', String(value))}
                    />
                    <NumberInput
                        label="C (قابلیت کشف)"
                        value={formData.C}
                        onChange={(value) => updateField('C', String(value))}
                    />
                    <NumberInput
                        label="S (شدت 1-10)"
                        value={formData.S}
                        onChange={(value) => updateField('S', String(value))}
                    />
                    <NumberInput
                        label="D (احتمال 1-10)"
                        value={formData.D}
                        onChange={(value) => updateField('D', String(value))}
                    />
                </div>
            </FormSection>

            <FormSection title="ارزیابی مجدد (در صورت اجرای اقدام)">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <NumberInput
                        label="A بازبینی"
                        value={formData.reevalA}
                        onChange={(value) => updateField('reevalA', String(value))}
                    />
                    <NumberInput
                        label="B بازبینی"
                        value={formData.reevalB}
                        onChange={(value) => updateField('reevalB', String(value))}
                    />
                    <NumberInput
                        label="C بازبینی"
                        value={formData.reevalC}
                        onChange={(value) => updateField('reevalC', String(value))}
                    />
                    <NumberInput
                        label="S بازبینی"
                        value={formData.reevalS}
                        onChange={(value) => updateField('reevalS', String(value))}
                    />
                    <NumberInput
                        label="D بازبینی"
                        value={formData.reevalD}
                        onChange={(value) => updateField('reevalD', String(value))}
                    />
                    <TextInput
                        label="کُد اقدام بازبینی"
                        value={formData.reevalActionNumber}
                        onChange={(value) => updateField('reevalActionNumber', value)}
                    />
                </div>
                <p className="text-xs text-muted">
                    توجه: مقادیر عددی باید در بازهٔ ۱ تا ۱۰ وارد شوند. پس از اجرای اقدام اصلاحی، ارزیابی مجدد را تکمیل کنید.
                </p>
            </FormSection>
        </FormLayout>
    )
}
