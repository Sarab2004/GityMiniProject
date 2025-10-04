'use client'

import React, { useState } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { RowRepeater } from '@/components/ui/RowRepeater'

export default function FR0112Page() {
    const [formData, setFormData] = useState({
        teamMembers: [] as Record<string, any>[],
        preparer: '',
        approver: ''
    })

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        setFormData({
            teamMembers: [],
            preparer: '',
            approver: ''
        })
    }

    return (
        <FormLayout
            title="تشکیل تیم همیاران HSE"
            code="FR-01-12-00"
            onReset={resetForm}
        >
            {/* اعضای تیم */}
            <FormSection title="اعضای تیم همیاران HSE">
                <RowRepeater
                    label="اعضای تیم"
                    columns={[
                        { key: 'contractor', label: 'نام پیمانکار', type: 'text', placeholder: 'مثال: نصب‌افزار جنوب' },
                        { key: 'unit', label: 'نام واحد', type: 'text', placeholder: 'مثال: تولید' },
                        { key: 'section', label: 'نام بخش', type: 'text', placeholder: 'مثال: برش‌کاری' },
                        { key: 'representative', label: 'نام نماینده بخش', type: 'text', placeholder: 'نام و سمت' },
                        { key: 'signature', label: 'امضاء', type: 'text', placeholder: 'امضای نماینده' },
                        { key: 'tbmNumber', label: 'شماره TBM', type: 'text', placeholder: 'مثال: TBM-1403-027' }
                    ]}
                    value={formData.teamMembers}
                    onChange={(value) => updateField('teamMembers', value)}
                />
            </FormSection>

            {/* تأییدات */}
            <FormSection title="تأییدات">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                        label="تهیه‌کننده (کارشناس HSE)"
                        placeholder="نام و امضای کارشناس HSE"
                        value={formData.preparer}
                        onChange={(value) => updateField('preparer', value)}
                    />
                    <TextInput
                        label="تصویب‌کننده (مدیر پروژه/سرپرست کارگاه)"
                        placeholder="نام و امضای مدیر پروژه"
                        value={formData.approver}
                        onChange={(value) => updateField('approver', value)}
                    />
                </div>
            </FormSection>
        </FormLayout>
    )
}
