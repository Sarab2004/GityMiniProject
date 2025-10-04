'use client'

import React, { useState } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { DateInput } from '@/components/ui/DateInput'
import { Textarea } from '@/components/ui/Textarea'
import { RowRepeater } from '@/components/ui/RowRepeater'

export default function FR0110Page() {
    const [formData, setFormData] = useState({
        tbmNumber: '',
        projectLocation: '',
        date: '',
        subject: '',
        instructor: '',
        attendees: [] as Record<string, any>[],
        notes: ''
    })

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        setFormData({
            tbmNumber: '',
            projectLocation: '',
            date: '',
            subject: '',
            instructor: '',
            attendees: [],
            notes: ''
        })
    }

    return (
        <FormLayout
            title="TBM - آموزش حین کار"
            code="PR-01-07-01"
            onReset={resetForm}
        >
            {/* اطلاعات کلی */}
            <FormSection title="اطلاعات کلی">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                        label="شماره TBM"
                        placeholder="TBM-1403-027"
                        required
                        value={formData.tbmNumber}
                        onChange={(value) => updateField('tbmNumber', value)}
                    />
                    <TextInput
                        label="پروژه/محل"
                        placeholder="نام پروژه یا محل کار"
                        required
                        value={formData.projectLocation}
                        onChange={(value) => updateField('projectLocation', value)}
                    />
                    <DateInput
                        label="تاریخ"
                        required
                        value={formData.date}
                        onChange={(value) => updateField('date', value)}
                    />
                    <TextInput
                        label="موضوع/سرفصل"
                        placeholder="موضوع آموزش"
                        required
                        value={formData.subject}
                        onChange={(value) => updateField('subject', value)}
                    />
                    <TextInput
                        label="مدرس/مسئول"
                        placeholder="نام و سمت مدرس"
                        required
                        value={formData.instructor}
                        onChange={(value) => updateField('instructor', value)}
                    />
                </div>
            </FormSection>

            {/* حاضرین */}
            <FormSection title="حاضرین">
                <RowRepeater
                    label="لیست حاضرین"
                    columns={[
                        { key: 'name', label: 'نام و سمت', type: 'text', placeholder: 'نام و سمت فرد' },
                        { key: 'signature', label: 'امضاء', type: 'text', placeholder: 'امضای فرد' }
                    ]}
                    value={formData.attendees}
                    onChange={(value) => updateField('attendees', value)}
                />
            </FormSection>

            {/* یادداشت‌ها */}
            <FormSection title="یادداشت‌ها و ضمائم">
                <Textarea
                    label="یادداشت‌ها/ضمائم"
                    placeholder="یادداشت‌های تکمیلی، ضمائم و توضیحات"
                    rows={6}
                    value={formData.notes}
                    onChange={(value) => updateField('notes', value)}
                />
            </FormSection>
        </FormLayout>
    )
}
