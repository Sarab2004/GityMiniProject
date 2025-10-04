'use client'

import React, { useState } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { DateInput } from '@/components/ui/DateInput'
import { Textarea } from '@/components/ui/Textarea'
import { RowRepeater } from '@/components/ui/RowRepeater'

export default function FR0103Page() {
    const [formData, setFormData] = useState({
        changeSubject: '',
        registrationDate: '',
        implementationDate: '',
        changeResponsible: '',
        requiredActions: [] as Record<string, any>[],
        fr0101Number: '',
        description: ''
    })

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        setFormData({
            changeSubject: '',
            registrationDate: '',
            implementationDate: '',
            changeResponsible: '',
            requiredActions: [],
            fr0101Number: '',
            description: ''
        })
    }

    return (
        <FormLayout
            title="ثبت و پیگیری تغییرات"
            code="FR-01-03-00"
            onReset={resetForm}
        >
            {/* اطلاعات کلی */}
            <FormSection title="اطلاعات کلی">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                        label="موضوع تغییر"
                        placeholder="مثال: جایگزینی حلال A با B"
                        required
                        value={formData.changeSubject}
                        onChange={(value) => updateField('changeSubject', value)}
                    />
                    <TextInput
                        label="مسئول تغییر"
                        placeholder="نام و سمت مسئول"
                        required
                        value={formData.changeResponsible}
                        onChange={(value) => updateField('changeResponsible', value)}
                    />
                </div>
            </FormSection>

            {/* تاریخ‌ها */}
            <FormSection title="تاریخ‌ها">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DateInput
                        label="تاریخ ثبت"
                        required
                        value={formData.registrationDate}
                        onChange={(value) => updateField('registrationDate', value)}
                    />
                    <DateInput
                        label="تاریخ انجام تغییر"
                        required
                        value={formData.implementationDate}
                        onChange={(value) => updateField('implementationDate', value)}
                    />
                </div>
            </FormSection>

            {/* اقدامات موردنیاز */}
            <FormSection title="اقدامات موردنیاز">
                <RowRepeater
                    label="اقدامات موردنیاز"
                    columns={[
                        { key: 'action', label: 'شرح اقدام', type: 'text', placeholder: 'شرح اقدام موردنیاز' },
                        { key: 'responsible', label: 'مسئول', type: 'text', placeholder: 'نام و سمت' },
                        { key: 'deadline', label: 'مهلت', type: 'date' },
                        { key: 'status', label: 'وضعیت', type: 'text', placeholder: 'انجام شده/در حال انجام/برنامه‌ریزی شده' }
                    ]}
                    value={formData.requiredActions}
                    onChange={(value) => updateField('requiredActions', value)}
                />
            </FormSection>

            {/* ارتباط با فرم اقدام اصلاحی */}
            <FormSection title="ارتباط با فرم اقدام اصلاحی">
                <TextInput
                    label="شماره فرم اقدام اصلاحی و پیشگیرانه (FR‑01‑01)"
                    placeholder="مثال: FR-01-01-001"
                    value={formData.fr0101Number}
                    onChange={(value) => updateField('fr0101Number', value)}
                />
            </FormSection>

            {/* توضیحات */}
            <FormSection title="توضیحات">
                <Textarea
                    label="توضیحات"
                    placeholder="توضیحات تکمیلی در مورد تغییر"
                    rows={4}
                    value={formData.description}
                    onChange={(value) => updateField('description', value)}
                />
            </FormSection>
        </FormLayout>
    )
}
