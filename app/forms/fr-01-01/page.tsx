'use client'

import React, { useState } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { DateInput } from '@/components/ui/DateInput'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { CheckboxGroup } from '@/components/ui/CheckboxGroup'
import { Textarea } from '@/components/ui/Textarea'
import { RowRepeater } from '@/components/ui/RowRepeater'

export default function FR0101Page() {
    const [formData, setFormData] = useState({
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
        firstReportDate: '',
        firstReportApproverSignature: '',
        secondReportStatus: '',
        secondReportDate: '',
        secondReportDescription: '',
        secondReportResponsibleSignature: '',
        secondReportDate: '',
        secondReportApproverSignature: '',
        effectivenessDate: '',
        effectivenessMethod: '',
        effectivenessStatus: '',
        newActionNumber: '',
        effectivenessReviewer: '',
        effectivenessDate: '',
        effectivenessSignature: ''
    })

    const requestTypeOptions = [
        { value: 'corrective', label: 'اقدام اصلاحی' },
        { value: 'preventive', label: 'اقدام پیشگیرانه' },
        { value: 'change', label: 'تغییرات' },
        { value: 'improvement', label: 'پیشنهاد بهبود' }
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
        { value: 'other', label: 'سایر' }
    ]

    const yesNoOptions = [
        { value: 'yes', label: 'بله' },
        { value: 'no', label: 'خیر' }
    ]

    const hasNotOptions = [
        { value: 'has', label: 'دارد' },
        { value: 'not', label: 'ندارد' }
    ]

    const approvedOptions = [
        { value: 'approved', label: 'مورد تأیید هستند' },
        { value: 'not_approved', label: 'مورد تأیید نیستند' }
    ]

    const effectiveOptions = [
        { value: 'effective', label: 'اثربخش هستند' },
        { value: 'not_effective', label: 'اثربخش نیستند' }
    ]

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        setFormData({
            requesterName: '',
            requesterUnit: '',
            actionNumber: '',
            date: '',
            requestType: '',
            actionSource: [],
            nonConformityDescription: '',
            rootCauseObjective: '',
            riskAssessmentUpdate: '',
            riskAssessmentDate: '',
            newKnowledgeExperience: '',
            requiredActions: [],
            responsibleApproval: '',
            managerApproval: '',
            affectedDocuments: [],
            firstReportStatus: '',
            firstReportDate: '',
            firstReportDescription: '',
            firstReportResponsibleSignature: '',
            firstReportDate: '',
            firstReportApproverSignature: '',
            secondReportStatus: '',
            secondReportDate: '',
            secondReportDescription: '',
            secondReportResponsibleSignature: '',
            secondReportDate: '',
            secondReportApproverSignature: '',
            effectivenessDate: '',
            effectivenessMethod: '',
            effectivenessStatus: '',
            newActionNumber: '',
            effectivenessReviewer: '',
            effectivenessDate: '',
            effectivenessSignature: ''
        })
    }

    return (
        <FormLayout
            title="اقدام اصلاحی/پیشگیرانه/تغییرات"
            code="FR-01-01-00"
            onReset={resetForm}
        >
            {/* اطلاعات کلی */}
            <FormSection title="اطلاعات کلی">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="مثال: NP-03-001"
                        required
                        value={formData.actionNumber}
                        onChange={(value) => updateField('actionNumber', value)}
                    />
                    <DateInput
                        label="تاریخ"
                        required
                        value={formData.date}
                        onChange={(value) => updateField('date', value)}
                    />
                </div>
            </FormSection>

            {/* نوع درخواست */}
            <FormSection title="نوع درخواست">
                <RadioGroup
                    label="نوع درخواست"
                    options={requestTypeOptions}
                    required
                    value={formData.requestType}
                    onChange={(value) => updateField('requestType', value)}
                />
            </FormSection>

            {/* منشأ اقدام */}
            <FormSection title="منشأ اقدام">
                <CheckboxGroup
                    label="منشأ اقدام"
                    options={actionSourceOptions}
                    required
                    value={formData.actionSource}
                    onChange={(value) => updateField('actionSource', value)}
                />
            </FormSection>

            {/* شرح عدم‌انطباق */}
            <FormSection title="شرح عدم‌انطباق/درخواست تغییر">
                <Textarea
                    label="شرح عدم‌انطباق/درخواست تغییر"
                    placeholder="چه مشکلی دیدید/چه تغییری می‌خواهید؟"
                    required
                    value={formData.nonConformityDescription}
                    onChange={(value) => updateField('nonConformityDescription', value)}
                />
            </FormSection>

            {/* ریشه‌یابی */}
            <FormSection title="ریشه‌یابی/هدف تغییر">
                <Textarea
                    label="ریشه‌یابی/هدف تغییر"
                    placeholder="علت اصلی یا هدف دقیق چیست؟"
                    required
                    value={formData.rootCauseObjective}
                    onChange={(value) => updateField('rootCauseObjective', value)}
                />
            </FormSection>

            {/* بروزرسانی ارزیابی ریسک */}
            <FormSection title="بروزرسانی ارزیابی ریسک/جنبه">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <RadioGroup
                        label="نیاز به به‌روزرسانی ارزیابی ریسک/جنبه"
                        options={hasNotOptions}
                        required
                        value={formData.riskAssessmentUpdate}
                        onChange={(value) => updateField('riskAssessmentUpdate', value)}
                    />
                    {formData.riskAssessmentUpdate === 'has' && (
                        <DateInput
                            label="تاریخ بروزرسانی"
                            required
                            value={formData.riskAssessmentDate}
                            onChange={(value) => updateField('riskAssessmentDate', value)}
                        />
                    )}
                </div>
            </FormSection>

            {/* دانش جدید */}
            <FormSection title="ایجاد دانش یا تجربه جدید">
                <RadioGroup
                    label="ایجاد دانش یا تجربه جدید؟"
                    options={yesNoOptions}
                    required
                    value={formData.newKnowledgeExperience}
                    onChange={(value) => updateField('newKnowledgeExperience', value)}
                />
            </FormSection>

            {/* اقدامات موردنیاز */}
            <FormSection title="اقدامات و منابع موردنیاز">
                <RowRepeater
                    label="اقدامات و منابع موردنیاز"
                    columns={[
                        { key: 'action', label: 'شرح اقدام', type: 'text', placeholder: 'مثال: نصب گارد' },
                        { key: 'resources', label: 'منابع موردنیاز', type: 'text', placeholder: 'مثال: جوشکار، آهن‌آلات' },
                        { key: 'deadline', label: 'مهلت انجام', type: 'date' },
                        { key: 'responsible', label: 'مسئول انجام', type: 'text', placeholder: 'نام و سمت' }
                    ]}
                    value={formData.requiredActions}
                    onChange={(value) => updateField('requiredActions', value)}
                />
            </FormSection>

            {/* تأییدات */}
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

            {/* مستندات متاثر */}
            <FormSection title="مستندات متاثر از تغییر">
                <RowRepeater
                    label="مستندات متاثر از تغییر"
                    columns={[
                        { key: 'title', label: 'عنوان سند', type: 'text' },
                        { key: 'code', label: 'کد سند', type: 'text' }
                    ]}
                    value={formData.affectedDocuments}
                    onChange={(value) => updateField('affectedDocuments', value)}
                />
            </FormSection>

            {/* گزارش انجام اقدامات (مرتبه اول) */}
            <FormSection title="گزارش انجام اقدامات (مرتبه اول)">
                <div className="space-y-4">
                    <RadioGroup
                        label="وضعیت اقدامات"
                        options={approvedOptions}
                        required
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
                        <DateInput
                            label="تاریخ"
                            value={formData.firstReportDate}
                            onChange={(value) => updateField('firstReportDate', value)}
                        />
                        <TextInput
                            label="امضای تایید کننده"
                            value={formData.firstReportApproverSignature}
                            onChange={(value) => updateField('firstReportApproverSignature', value)}
                        />
                    </div>
                </div>
            </FormSection>

            {/* گزارش دوم */}
            <FormSection title="گزارش دوم (در صورت نیاز)">
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
                        <DateInput
                            label="تاریخ"
                            value={formData.secondReportDate}
                            onChange={(value) => updateField('secondReportDate', value)}
                        />
                        <TextInput
                            label="امضای تایید کننده"
                            value={formData.secondReportApproverSignature}
                            onChange={(value) => updateField('secondReportApproverSignature', value)}
                        />
                    </div>
                </div>
            </FormSection>

            {/* بررسی اثربخشی */}
            <FormSection title="بررسی اثربخشی">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DateInput
                            label="تاریخ بررسی"
                            value={formData.effectivenessDate}
                            onChange={(value) => updateField('effectivenessDate', value)}
                        />
                        <TextInput
                            label="نحوه بررسی"
                            value={formData.effectivenessMethod}
                            onChange={(value) => updateField('effectivenessMethod', value)}
                        />
                    </div>

                    <RadioGroup
                        label="وضعیت اثربخشی"
                        options={effectiveOptions}
                        required
                        value={formData.effectivenessStatus}
                        onChange={(value) => updateField('effectivenessStatus', value)}
                    />

                    {formData.effectivenessStatus === 'not_effective' && (
                        <TextInput
                            label="شماره اقدام جدید"
                            value={formData.newActionNumber}
                            onChange={(value) => updateField('newActionNumber', value)}
                        />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <TextInput
                            label="نام بررسی‌کننده"
                            value={formData.effectivenessReviewer}
                            onChange={(value) => updateField('effectivenessReviewer', value)}
                        />
                        <DateInput
                            label="تاریخ"
                            value={formData.effectivenessDate}
                            onChange={(value) => updateField('effectivenessDate', value)}
                        />
                        <TextInput
                            label="امضاء"
                            value={formData.effectivenessSignature}
                            onChange={(value) => updateField('effectivenessSignature', value)}
                        />
                    </div>
                </div>
            </FormSection>
        </FormLayout>
    )
}
