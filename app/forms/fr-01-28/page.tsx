'use client'

import React, { useState } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { NumberInput } from '@/components/ui/NumberInput'
import { DateInput } from '@/components/ui/DateInput'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { CheckboxGroup } from '@/components/ui/CheckboxGroup'
import { Textarea } from '@/components/ui/Textarea'
import { RowRepeater } from '@/components/ui/RowRepeater'

export default function FR0128Page() {
    const [formData, setFormData] = useState({
        projectName: '',
        date: '',
        riskItems: [] as Record<string, any>[],
        reEvaluationItems: [] as Record<string, any>[]
    })

    const routineOptions = [
        { value: 'R', label: 'R (روتین)' },
        { value: 'N', label: 'N (غیرروتین)' }
    ]

    const complianceOptions = [
        { value: 'compliant', label: 'منطبق' },
        { value: 'non_compliant', label: 'نامنطبق' }
    ]

    const riskTypeOptions = [
        { value: 'S', label: 'ایمنی (S)' },
        { value: 'H', label: 'بهداشتی (H)' },
        { value: 'F', label: 'اموال (F)' }
    ]

    const acceptanceOptions = [
        { value: 'L', label: 'قابل پذیرش (L)' },
        { value: 'H', label: 'غیرقابل پذیرش (H)' },
        { value: 'non_compliant', label: 'منطبق نبودن با الزامات قانونی' }
    ]

    const riskIdentificationOptions = [
        { value: 'incidents', label: 'حوادث' },
        { value: 'near_misses', label: 'شبه‌حوادث' },
        { value: 'harmful_factors', label: 'عوامل زیان‌آور' },
        { value: 'operation_control', label: 'کنترل عملیات' },
        { value: 'legal_compliance', label: 'انطباق با قوانین' },
        { value: 'continuous_improvement', label: 'بهبود مستمر' }
    ]

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        setFormData({
            projectName: '',
            date: '',
            riskItems: [],
            reEvaluationItems: []
        })
    }

    return (
        <FormLayout
            title="شناسایی و ارزیابی ریسک‌های ایمنی، بهداشتی و اموال"
            onReset={resetForm}
        >
            {/* اطلاعات کلی */}
            <FormSection title="اطلاعات کلی">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                        label="نام پروژه"
                        placeholder="نام پروژه"
                        required
                        value={formData.projectName}
                        onChange={(value) => updateField('projectName', value)}
                    />
                    <DateInput
                        label="تاریخ"
                        required
                        value={formData.date}
                        onChange={(value) => updateField('date', value)}
                    />
                </div>
            </FormSection>

            {/* ارزیابی ریسک */}
            <FormSection title="ارزیابی ریسک">
                <RowRepeater
                    label="موارد ارزیابی ریسک"
                    columns={[
                        { key: 'unit', label: 'نام واحد/محل ارزیابی', type: 'text' },
                        { key: 'process', label: 'عنوان فرآیند', type: 'text', placeholder: 'مثال: برش‌کاری' },
                        { key: 'activity', label: 'شرح فعالیت', type: 'text', placeholder: 'مثال: کار با سنگ‌فرز دستی' },
                        { key: 'routine', label: 'روتین/غیرروتین', type: 'text' },
                        { key: 'hazard', label: 'شرح ریسک (Hazard)', type: 'text' },
                        { key: 'event', label: 'رویداد ریسک', type: 'text' },
                        { key: 'consequence', label: 'پیامد/اثرات ریسک', type: 'text' },
                        { key: 'rootCause', label: 'علت ریشه‌ای ریسک', type: 'text' },
                        { key: 'existingControl', label: 'کنترل موجود', type: 'text' },
                        { key: 'legalRequirement', label: 'الزام قانونی', type: 'text' },
                        { key: 'legalStatus', label: 'وضعیت الزام قانونی', type: 'text' },
                        { key: 'riskType', label: 'نوع ریسک', type: 'text' },
                        { key: 'contactA', label: 'A (آمار حوادث/سال)', type: 'number', placeholder: 'آمار حوادث/سال' },
                        { key: 'contactB', label: 'B (تعداد افراد/تجهیزات)', type: 'number', placeholder: 'تعداد افراد/تجهیزات در معرض' },
                        { key: 'contactC', label: 'C (مدت مواجهه)', type: 'number', placeholder: 'مدت مواجهه' },
                        { key: 'contactE', label: 'E = A×B×C', type: 'number', placeholder: 'ورودی دستی در دمو' },
                        { key: 'severity', label: 'شدت اثر (S)', type: 'number', placeholder: '1-10' },
                        { key: 'probability', label: 'احتمال وقوع (P)', type: 'number', placeholder: '1-10' },
                        { key: 'detection', label: 'احتمال کشف خطر (D)', type: 'number', placeholder: '1-10' },
                        { key: 'rpn', label: 'سطح ریسک (RPN = S×P×D)', type: 'number', placeholder: 'ورودی دستی' },
                        { key: 'acceptance', label: 'وضعیت پذیرش', type: 'text' },
                        { key: 'actionNumber', label: 'شماره اقدام اصلاحی/پیشگیرانه/تغییرات', type: 'text' }
                    ]}
                    value={formData.riskItems}
                    onChange={(value) => updateField('riskItems', value)}
                />
            </FormSection>

            {/* کنترل و ارزیابی مجدد */}
            <FormSection title="کنترل و ارزیابی مجدد (پس از اقدام)">
                <RowRepeater
                    label="ارزیابی مجدد"
                    columns={[
                        { key: 'contactA', label: 'A (آمار حوادث/سال)', type: 'number', placeholder: 'آمار حوادث/سال' },
                        { key: 'contactB', label: 'B (تعداد افراد/تجهیزات)', type: 'number', placeholder: 'تعداد افراد/تجهیزات در معرض' },
                        { key: 'contactC', label: 'C (مدت مواجهه)', type: 'number', placeholder: 'مدت مواجهه' },
                        { key: 'contactE', label: 'E = A×B×C', type: 'number', placeholder: 'ورودی دستی در دمو' },
                        { key: 'severity', label: 'شدت اثر (S)', type: 'number', placeholder: '1-10' },
                        { key: 'probability', label: 'احتمال وقوع (P)', type: 'number', placeholder: '1-10' },
                        { key: 'detection', label: 'احتمال کشف خطر (D)', type: 'number', placeholder: '1-10' },
                        { key: 'rpn', label: 'سطح ریسک (RPN = S×P×D)', type: 'number', placeholder: 'ورودی دستی' },
                        { key: 'acceptance', label: 'وضعیت پذیرش', type: 'text' },
                        { key: 'actionNumber', label: 'شماره اقدام', type: 'text' }
                    ]}
                    value={formData.reEvaluationItems}
                    onChange={(value) => updateField('reEvaluationItems', value)}
                />
            </FormSection>
        </FormLayout>
    )
}
