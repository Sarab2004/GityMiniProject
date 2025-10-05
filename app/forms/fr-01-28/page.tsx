'use client'

import React, { useEffect, useMemo, useState } from 'react'
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

type RiskFormState = {
    projectId: string
    unitId: string
    sectionId: string
    processTitle: string
    activityDesc: string
    routineFlag: 'R' | 'N'
    hazardDesc: string
    eventDesc: string
    consequenceDesc: string
    rootCauseDesc: string
    controlsDesc: string
    inputs: string[]
    legalRequirement: string
    legalStatus: 'COMPLIANT' | 'NONCOMPLIANT'
    riskType: 'SAFETY' | 'HEALTH' | 'PROPERTY'
    A: string
    B: string
    C: string
    S: string
    D: string
    actionNumber: string
    reevalA: string
    reevalB: string
    reevalC: string
    reevalS: string
    reevalD: string
    reevalActionNumber: string
}

const initialState: RiskFormState = {
    projectId: '',
    unitId: '',
    sectionId: '',
    processTitle: '',
    activityDesc: '',
    routineFlag: 'R',
    hazardDesc: '',
    eventDesc: '',
    consequenceDesc: '',
    rootCauseDesc: '',
    controlsDesc: '',
    inputs: [],
    legalRequirement: '',
    legalStatus: 'COMPLIANT',
    riskType: 'SAFETY',
    A: '',
    B: '',
    C: '',
    S: '',
    D: '',
    actionNumber: '',
    reevalA: '',
    reevalB: '',
    reevalC: '',
    reevalS: '',
    reevalD: '',
    reevalActionNumber: '',
}

const routineOptions = [
    { value: 'R', label: 'R (روتین)' },
    { value: 'N', label: 'N (غیرروتین)' },
]

const legalOptions = [
    { value: 'COMPLIANT', label: 'منطبق' },
    { value: 'NONCOMPLIANT', label: 'نامنطبق' },
]

const riskTypeOptions = [
    { value: 'SAFETY', label: 'ایمنی (S)' },
    { value: 'HEALTH', label: 'بهداشتی (H)' },
    { value: 'PROPERTY', label: 'اموال (F)' },
]

const inputOptions = [
    { value: 'INCIDENTS', label: 'حوادث (INCIDENTS)' },
    { value: 'NEAR_MISS', label: 'شبه‌حوادث (NEAR_MISS)' },
    { value: 'HARMFUL_AGENTS', label: 'عوامل زیان‌آور (HARMFUL_AGENTS)' },
    { value: 'OPERATIONAL_CONTROL', label: 'کنترل‌های عملیاتی (OPERATIONAL_CONTROL)' },
    { value: 'LEGAL_COMPLIANCE', label: 'الزامات قانونی (LEGAL_COMPLIANCE)' },
    { value: 'CONTINUAL_IMPROVEMENT', label: 'بهبود مستمر (CONTINUAL_IMPROVEMENT)' },
]

export default function FR0128Page() {
    const [formData, setFormData] = useState<RiskFormState>(initialState)
    const [projects, setProjects] = useState<Project[]>([])
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        const loadOptions = async () => {
            try {
                setLoading(true)
                const [proj, units, secs] = await Promise.all([
                    fetchProjects(),
                    fetchOrgUnits(),
                    fetchSections(),
                ])
                setProjects(proj)
                setOrgUnits(units)
                setSections(secs)
            } catch (err) {
                console.error('load risk options failed', err)
                setError('بارگیری داده‌های پایه ممکن نشد. لطفاً صفحه را بازنشانی کنید.')
            } finally {
                setLoading(false)
            }
        }
        loadOptions()
    }, [])

    const updateField = <K extends keyof RiskFormState>(field: K, value: RiskFormState[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        setFormData(initialState)
        setError(null)
        setSuccess(null)
    }

    const projectOptions = projects.map((project) => ({
        value: String(project.id),
        label: `${project.code} – ${project.name}`,
    }))

    const unitOptions = orgUnits.map((unit) => ({ value: String(unit.id), label: unit.name }))

    const filteredSections = useMemo(
        () => sections.filter((section) => String(section.org_unit) === formData.unitId),
        [sections, formData.unitId],
    )

    const sectionOptions = filteredSections.map((section) => ({ value: String(section.id), label: section.name }))

    const ensureNumbers = (...values: string[]) => values.every((value) => value && !Number.isNaN(Number(value)))

    const handleSubmit = async () => {
        setError(null)
        setSuccess(null)

        if (!formData.projectId || !formData.unitId) {
            setError('انتخاب پروژه و واحد الزامی است.')
            return
        }
        if (!formData.processTitle || !formData.activityDesc) {
            setError('عنوان فرآیند و شرح فعالیت را تکمیل کنید.')
            return
        }
        if (!formData.hazardDesc || !formData.eventDesc || !formData.consequenceDesc) {
            setError('شرح خطر، رویداد و پیامد الزامی است.')
            return
        }
        if (!formData.rootCauseDesc || !formData.controlsDesc) {
            setError('علت ریشه‌ای و کنترل‌های موجود الزامی است.')
            return
        }
        if (!ensureNumbers(formData.A, formData.B, formData.C, formData.S, formData.D)) {
            setError('مقادیر A، B، C، S و D باید عددی باشند.')
            return
        }

        try {
            setLoading(true)
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

            setSuccess('ریسک با موفقیت ثبت شد.')
            setFormData((prev) => ({
                ...initialState,
                projectId: prev.projectId,
                unitId: prev.unitId,
                sectionId: prev.sectionId,
            }))
        } catch (err: any) {
            console.error('submit risk error', err)
            setError(err?.message ?? 'خطا در ثبت ریسک رخ داد.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <FormLayout
            title="شناسایی و ارزیابی ریسک‌های ایمنی، بهداشتی و اموال"
            code="FR-01-28-00"
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
                            disabled={loading}
                        >
                            پاک‌کردن فرم
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'در حال ثبت...' : 'ثبت ریسک'}
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
                        onChange={(value) => updateField('projectId', value as RiskFormState['projectId'])}
                        placeholder={loading && projectOptions.length === 0 ? 'در حال بارگذاری...' : 'انتخاب کنید'}
                    />
                    <Select
                        label="واحد"
                        required
                        options={unitOptions}
                        value={formData.unitId}
                        onChange={(value) => {
                            updateField('unitId', value as RiskFormState['unitId'])
                            updateField('sectionId', '')
                        }}
                    />
                    <Select
                        label="بخش"
                        options={sectionOptions}
                        value={formData.sectionId}
                        onChange={(value) => updateField('sectionId', value as RiskFormState['sectionId'])}
                        placeholder={filteredSections.length === 0 ? 'بخشی ثبت نشده است' : 'انتخاب کنید'}
                    />
                </div>
            </FormSection>

            <FormSection title="تعریف فرآیند">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                        label="عنوان فرآیند"
                        required
                        value={formData.processTitle}
                        onChange={(value) => updateField('processTitle', value)}
                    />
                    <TextInput
                        label="شرح فعالیت"
                        required
                        value={formData.activityDesc}
                        onChange={(value) => updateField('activityDesc', value)}
                    />
                    <RadioGroup
                        label="نوع فعالیت"
                        options={routineOptions}
                        value={formData.routineFlag}
                        onChange={(value) => updateField('routineFlag', value as 'R' | 'N')}
                    />
                </div>
            </FormSection>

            <FormSection title="تحلیل ریسک">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Textarea
                        label="خطر/عامل زیان‌آور"
                        value={formData.hazardDesc}
                        onChange={(value) => updateField('hazardDesc', value)}
                    />
                    <Textarea
                        label="رویداد محتمل"
                        value={formData.eventDesc}
                        onChange={(value) => updateField('eventDesc', value)}
                    />
                    <Textarea
                        label="پیامد/اثرات"
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
                    label="منشأ شناسایی"
                    options={inputOptions}
                    value={formData.inputs}
                    onChange={(value) => updateField('inputs', value)}
                />
            </FormSection>

            <FormSection title="وضعیت قانونی و نوع ریسک">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Textarea
                        label="الزام قانونی"
                        value={formData.legalRequirement}
                        onChange={(value) => updateField('legalRequirement', value)}
                    />
                    <RadioGroup
                        label="وضعیت الزام قانونی"
                        options={legalOptions}
                        value={formData.legalStatus}
                        onChange={(value) => updateField('legalStatus', value as RiskFormState['legalStatus'])}
                    />
                    <RadioGroup
                        label="نوع ریسک"
                        options={riskTypeOptions}
                        value={formData.riskType}
                        onChange={(value) => updateField('riskType', value as RiskFormState['riskType'])}
                    />
                    <TextInput
                        label="شماره اقدام اصلاحی/پیشگیرانه/تغییر"
                        value={formData.actionNumber}
                        onChange={(value) => updateField('actionNumber', value)}
                        helper="در صورت نیاز به اقدام، شماره FR-01-01 را وارد کنید."
                    />
                </div>
            </FormSection>

            <FormSection title="ارزیابی عددی">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <NumberInput
                        label="A (آمار حوادث/سال)"
                        value={formData.A}
                        onChange={(value) => updateField('A', String(value))}
                    />
                    <NumberInput
                        label="B (تعداد افراد/تجهیزات در معرض)"
                        value={formData.B}
                        onChange={(value) => updateField('B', String(value))}
                    />
                    <NumberInput
                        label="C (مدت مواجهه)"
                        value={formData.C}
                        onChange={(value) => updateField('C', String(value))}
                    />
                    <NumberInput
                        label="S (شدت اثر 1-10)"
                        value={formData.S}
                        onChange={(value) => updateField('S', String(value))}
                    />
                    <NumberInput
                        label="D (احتمال کشف خطر 1-10)"
                        value={formData.D}
                        onChange={(value) => updateField('D', String(value))}
                    />
                </div>
            </FormSection>

            <FormSection title="ارزیابی مجدد (در صورت اجرا شدن اقدام)">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <NumberInput
                        label="A جدید"
                        value={formData.reevalA}
                        onChange={(value) => updateField('reevalA', String(value))}
                    />
                    <NumberInput
                        label="B جدید"
                        value={formData.reevalB}
                        onChange={(value) => updateField('reevalB', String(value))}
                    />
                    <NumberInput
                        label="C جدید"
                        value={formData.reevalC}
                        onChange={(value) => updateField('reevalC', String(value))}
                    />
                    <NumberInput
                        label="S جدید"
                        value={formData.reevalS}
                        onChange={(value) => updateField('reevalS', String(value))}
                    />
                    <NumberInput
                        label="D جدید"
                        value={formData.reevalD}
                        onChange={(value) => updateField('reevalD', String(value))}
                    />
                    <TextInput
                        label="شماره اقدام مرتبط"
                        value={formData.reevalActionNumber}
                        onChange={(value) => updateField('reevalActionNumber', value)}
                    />
                </div>
                <p className="text-xs text-muted">
                    برای ثبت ارزیابی مجدد باید همه مقادیر عددی تکمیل شوند؛ در غیر این صورت سامانه فقط ارزیابی اولیه را ذخیره می‌کند.
                </p>
            </FormSection>
        </FormLayout>
    )
}
