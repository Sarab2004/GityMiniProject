'use client'

import React, { useEffect, useState } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { DateInput } from '@/components/ui/DateInput'
import { Select } from '@/components/ui/Select'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { Textarea } from '@/components/ui/Textarea'
import {
    createActionTracking,
    fetchActions,
    type ActionSummary,
} from '@/lib/hse'

type TrackingFormState = {
    actionId: string
    issueDesc: string
    actionDesc: string
    actionSource: string
    executor: string
    deadline: string
    reviewDate1: string
    reviewDate2: string
    reviewDate3: string
    resolutionStatus: string
    isKnowledge: string
    isEffective: string
    newActionNumber: string
}

const initialState: TrackingFormState = {
    actionId: '',
    issueDesc: '',
    actionDesc: '',
    actionSource: '',
    executor: '',
    deadline: '',
    reviewDate1: '',
    reviewDate2: '',
    reviewDate3: '',
    resolutionStatus: '',
    isKnowledge: '',
    isEffective: '',
    newActionNumber: '',
}

const actionSourceOptions = [
    { value: 'AUDIT', label: 'ممیزی' },
    { value: 'LEGAL', label: 'انطباق با قوانین' },
    { value: 'PROCESS_RISKS', label: 'ریسک‌ها و فرصت‌های فرآیندی' },
    { value: 'INCIDENTS', label: 'حوادث' },
    { value: 'NEAR_MISS', label: 'شبه‌حوادث' },
    { value: 'UNSAFE_CONDITION', label: 'شرایط ناایمن' },
    { value: 'UNSAFE_ACT', label: 'اعمال ناایمن' },
    { value: 'CHECKLIST', label: 'چک‌لیست' },
    { value: 'HSE_RISKS', label: 'ریسک‌های ایمنی/بهداشتی/اموال' },
    { value: 'ENV_ASPECTS', label: 'جنبه‌های زیست‌محیطی' },
    { value: 'MGT_REVIEW', label: 'بازنگری مدیریت' },
    { value: 'OTHER', label: 'سایر' },
]

const resolutionOptions = [
    { value: 'resolved', label: 'برطرف گردید' },
    { value: 'not_resolved', label: 'برطرف نگردید' },
]

const yesNoOptions = [
    { value: 'yes', label: 'می‌باشد' },
    { value: 'no', label: 'نمی‌باشد' },
]

const effectiveOptions = [
    { value: 'effective', label: 'اثربخش است' },
    { value: 'not_effective', label: 'اثربخش نیست' },
]

export default function FR0102Page() {
    const [formData, setFormData] = useState<TrackingFormState>(initialState)
    const [actions, setActions] = useState<ActionSummary[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        const loadActions = async () => {
            try {
                setLoading(true)
                const data = await fetchActions()
                setActions(data)
            } catch (err) {
                console.error('load actions failed', err)
                setError('فهرست اقدامات قابل دریافت نیست. بعداً دوباره تلاش کنید.')
            } finally {
                setLoading(false)
            }
        }
        loadActions()
    }, [])

    const actionOptions = actions.map((action) => ({
        value: String(action.id),
        label: action.indicator,
    }))

    const updateField = <K extends keyof TrackingFormState>(field: K, value: TrackingFormState[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        setFormData(initialState)
        setError(null)
        setSuccess(null)
    }

    const handleSubmit = async () => {
        setError(null)
        setSuccess(null)

        if (!formData.actionId) {
            setError('انتخاب اقدام الزامی است.')
            return
        }
        if (!formData.issueDesc || !formData.actionDesc) {
            setError('شرح عدم انطباق و اقدام اصلاحی را تکمیل کنید.')
            return
        }
        if (!formData.deadline) {
            setError('مهلت انجام را مشخص کنید.')
            return
        }

        try {
            setLoading(true)
            await createActionTracking({
                action: Number(formData.actionId),
                issue_desc: formData.issueDesc,
                action_desc: formData.actionDesc,
                source: formData.actionSource || 'OTHER',
                executor_text: formData.executor,
                due_date: formData.deadline,
                review_date_1: formData.reviewDate1 || null,
                review_date_2: formData.reviewDate2 || null,
                review_date_3: formData.reviewDate3 || null,
                resolved:
                    formData.resolutionStatus === ''
                        ? null
                        : formData.resolutionStatus === 'resolved',
                is_knowledge:
                    formData.isKnowledge === '' ? null : formData.isKnowledge === 'yes',
                effective:
                    formData.isEffective === '' ? null : formData.isEffective === 'effective',
                new_action_indicator: formData.newActionNumber || null,
            })
            setSuccess('پیگیری اقدام با موفقیت ثبت شد.')
            setFormData((prev) => ({ ...initialState, actionId: prev.actionId }))
        } catch (err: any) {
            console.error('submit tracking error', err)
            setError(err?.message ?? 'ثبت پیگیری اقدام ناموفق بود.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <FormLayout
            title="پیگیری اقدام اصلاحی/پیشگیرانه"
            code="FR-01-02-00"
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
                            {loading ? 'در حال ثبت...' : 'ثبت پیگیری'}
                        </button>
                    </div>
                </div>
            }
        >
            <FormSection title="اطلاعات اقدام">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="شماره اقدام (FR-01-01)"
                        required
                        options={actionOptions}
                        value={formData.actionId}
                        onChange={(value) => updateField('actionId', value as TrackingFormState['actionId'])}
                        placeholder={loading && actionOptions.length === 0 ? 'در حال بارگذاری...' : 'انتخاب کنید'}
                    />
                    <Select
                        label="منشأ"
                        options={actionSourceOptions}
                        value={formData.actionSource}
                        onChange={(value) => updateField('actionSource', value as TrackingFormState['actionSource'])}
                    />
                    <Textarea
                        label="شرح عدم انطباق/مسأله"
                        required
                        value={formData.issueDesc}
                        onChange={(value) => updateField('issueDesc', value)}
                    />
                    <Textarea
                        label="شرح اقدام اصلاحی/پیشگیرانه"
                        required
                        value={formData.actionDesc}
                        onChange={(value) => updateField('actionDesc', value)}
                    />
                </div>
            </FormSection>

            <FormSection title="زمان‌بندی و اجرا">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextInput
                        label="مجری"
                        value={formData.executor}
                        onChange={(value) => updateField('executor', value)}
                        placeholder="نام و سمت مجری"
                    />
                    <DateInput
                        label="مهلت انجام"
                        required
                        value={formData.deadline}
                        onChange={(value) => updateField('deadline', value)}
                    />
                    <DateInput
                        label="تاریخ بازنگری ۱"
                        value={formData.reviewDate1}
                        onChange={(value) => updateField('reviewDate1', value)}
                    />
                    <DateInput
                        label="تاریخ بازنگری ۲"
                        value={formData.reviewDate2}
                        onChange={(value) => updateField('reviewDate2', value)}
                    />
                    <DateInput
                        label="تاریخ بازنگری ۳"
                        value={formData.reviewDate3}
                        onChange={(value) => updateField('reviewDate3', value)}
                    />
                </div>
            </FormSection>

            <FormSection title="نتیجه و درس‌آموخته">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <RadioGroup
                        label="وضعیت برطرف شدن"
                        options={resolutionOptions}
                        value={formData.resolutionStatus}
                        onChange={(value) => updateField('resolutionStatus', value as TrackingFormState['resolutionStatus'])}
                    />
                    <RadioGroup
                        label="درس‌آموخته/دانش جدید"
                        options={yesNoOptions}
                        value={formData.isKnowledge}
                        onChange={(value) => updateField('isKnowledge', value as TrackingFormState['isKnowledge'])}
                    />
                    <RadioGroup
                        label="اثربخش بودن"
                        options={effectiveOptions}
                        value={formData.isEffective}
                        onChange={(value) => updateField('isEffective', value as TrackingFormState['isEffective'])}
                    />
                    {formData.isEffective === 'not_effective' && (
                        <TextInput
                            label="شماره اقدام جدید"
                            required
                            value={formData.newActionNumber}
                            onChange={(value) => updateField('newActionNumber', value)}
                        />
                    )}
                </div>
            </FormSection>
        </FormLayout>
    )
}
