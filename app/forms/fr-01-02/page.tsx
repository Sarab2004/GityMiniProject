'use client'

import React, { useState } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { DateInput } from '@/components/ui/DateInput'
import { Select } from '@/components/ui/Select'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { Textarea } from '@/components/ui/Textarea'

export default function FR0102Page() {
    const [formData, setFormData] = useState({
        actionNumber: '',
        nonConformityDescription: '',
        correctiveActionDescription: '',
        actionSource: '',
        executor: '',
        deadline: '',
        reviewDate1: '',
        reviewDate2: '',
        reviewDate3: '',
        resolutionStatus: '',
        isKnowledge: '',
        isEffective: '',
        newActionNumber: ''
    })

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
        { value: 'other', label: 'سایر' }
    ]

    const resolutionOptions = [
        { value: 'resolved', label: 'برطرف گردید' },
        { value: 'not_resolved', label: 'برطرف نگردید' }
    ]

    const yesNoOptions = [
        { value: 'yes', label: 'می‌باشد' },
        { value: 'no', label: 'نمی‌باشد' }
    ]

    const effectiveOptions = [
        { value: 'effective', label: 'اثربخش است' },
        { value: 'not_effective', label: 'اثربخش نیست' }
    ]

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        setFormData({
            actionNumber: '',
            nonConformityDescription: '',
            correctiveActionDescription: '',
            actionSource: '',
            executor: '',
            deadline: '',
            reviewDate1: '',
            reviewDate2: '',
            reviewDate3: '',
            resolutionStatus: '',
            isKnowledge: '',
            isEffective: '',
            newActionNumber: ''
        })
    }

    return (
        <FormLayout
            title="پیگیری اقدامات"
            code="FR-01-02-00"
            onReset={resetForm}
        >
            {/* اطلاعات کلی */}
            <FormSection title="اطلاعات کلی">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                        label="شماره اقدام اصلاحی/پیشگیرانه/تغییرات"
                        placeholder="مثال: AS-03-007"
                        required
                        value={formData.actionNumber}
                        onChange={(value) => updateField('actionNumber', value)}
                    />
                    <Select
                        label="منشأ اقدام"
                        options={actionSourceOptions}
                        required
                        value={formData.actionSource}
                        onChange={(value) => updateField('actionSource', value)}
                    />
                </div>
            </FormSection>

            {/* شرح عدم‌انطباق */}
            <FormSection title="شرح عدم‌انطباق">
                <Textarea
                    label="شرح مورد نامنطبق/شرایط یا اعمال ناایمن/شبه‌حادثه"
                    placeholder="شرح کامل مشکل یا شرایط ناایمن"
                    required
                    value={formData.nonConformityDescription}
                    onChange={(value) => updateField('nonConformityDescription', value)}
                />
            </FormSection>

            {/* شرح اقدام */}
            <FormSection title="شرح اقدام">
                <Textarea
                    label="شرح اقدام اصلاحی/پیشگیرانه/تغییرات"
                    placeholder="شرح اقدامات انجام شده"
                    required
                    value={formData.correctiveActionDescription}
                    onChange={(value) => updateField('correctiveActionDescription', value)}
                />
            </FormSection>

            {/* مجری و مهلت */}
            <FormSection title="مجری و مهلت">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                        label="مجری"
                        placeholder="نام و سمت"
                        required
                        value={formData.executor}
                        onChange={(value) => updateField('executor', value)}
                    />
                    <DateInput
                        label="مهلت انجام"
                        required
                        value={formData.deadline}
                        onChange={(value) => updateField('deadline', value)}
                    />
                </div>
            </FormSection>

            {/* تاریخ‌های بررسی */}
            <FormSection title="تاریخ‌های بررسی">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <DateInput
                        label="تاریخ بررسی 1"
                        value={formData.reviewDate1}
                        onChange={(value) => updateField('reviewDate1', value)}
                    />
                    <DateInput
                        label="تاریخ بررسی 2"
                        value={formData.reviewDate2}
                        onChange={(value) => updateField('reviewDate2', value)}
                    />
                    <DateInput
                        label="تاریخ بررسی 3"
                        value={formData.reviewDate3}
                        onChange={(value) => updateField('reviewDate3', value)}
                    />
                </div>
            </FormSection>

            {/* وضعیت برطرف‌سازی */}
            <FormSection title="وضعیت برطرف‌سازی">
                <RadioGroup
                    label="وضعیت برطرف شد/نشد"
                    options={resolutionOptions}
                    required
                    value={formData.resolutionStatus}
                    onChange={(value) => updateField('resolutionStatus', value)}
                />
            </FormSection>

            {/* دانش */}
            <FormSection title="دانش">
                <RadioGroup
                    label="آیا اقدام یک «دانش» است؟"
                    options={yesNoOptions}
                    required
                    value={formData.isKnowledge}
                    onChange={(value) => updateField('isKnowledge', value)}
                />
            </FormSection>

            {/* اثربخشی */}
            <FormSection title="اثربخشی">
                <div className="space-y-4">
                    <RadioGroup
                        label="اثربخش می‌باشد؟"
                        options={effectiveOptions}
                        required
                        value={formData.isEffective}
                        onChange={(value) => updateField('isEffective', value)}
                    />

                    {formData.isEffective === 'not_effective' && (
                        <TextInput
                            label="شماره اقدام اصلاحی جدید"
                            placeholder="شماره اقدام جدید"
                            value={formData.newActionNumber}
                            onChange={(value) => updateField('newActionNumber', value)}
                        />
                    )}
                </div>
            </FormSection>
        </FormLayout>
    )
}
