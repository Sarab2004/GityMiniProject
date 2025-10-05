'use client'

import React, { useState, useEffect } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { DateInput } from '@/components/ui/DateInput'
import { Textarea } from '@/components/ui/Textarea'
import { RowRepeater } from '@/components/ui/RowRepeater'
import { createToolboxMeeting, addTBMAttendee, fetchProjects, type Project } from '@/lib/hse'

export default function FR0110Page() {
    const [formData, setFormData] = useState({
        projectId: '',
        tbmNumber: '',
        projectLocation: '',
        date: '',
        subject: '',
        instructor: '',
        attendees: [] as Record<string, any>[],
        notes: ''
    })
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        setFormData({
            projectId: '',
            tbmNumber: '',
            projectLocation: '',
            date: '',
            subject: '',
            instructor: '',
            attendees: [],
            notes: ''
        })
    }

    useEffect(() => {
        const loadProjects = async () => {
            try {
                const projectList = await fetchProjects()
                setProjects(projectList)
            } catch (error) {
                console.error('Failed to load projects:', error)
            }
        }
        loadProjects()
    }, [])

    const handleSubmit = async () => {
        setError(null)
        setSuccess(null)

        if (!formData.projectId) {
            setError('انتخاب پروژه الزامی است.')
            return
        }
        if (!formData.tbmNumber || !formData.projectLocation || !formData.date || !formData.subject || !formData.instructor) {
            setError('تمامی فیلدهای الزامی را تکمیل کنید.')
            return
        }
        if (formData.attendees.length === 0) {
            setError('حداقل یک حاضر باید ثبت شود.')
            return
        }

        try {
            setLoading(true)
            
            // Create TBM meeting
            const tbm = await createToolboxMeeting({
                tbm_no: formData.tbmNumber,
                project: Number(formData.projectId),
                date: formData.date,
                topic_text: formData.subject,
                trainer_text: formData.instructor,
                location_text: formData.projectLocation,
                notes_text: formData.notes || undefined,
            })

            // Add attendees
            for (const attendee of formData.attendees) {
                if (attendee.name && attendee.signature) {
                    await addTBMAttendee(tbm.id, {
                        full_name: attendee.name,
                        role_text: attendee.signature,
                        signature_text: attendee.signature,
                    })
                }
            }

            setSuccess(`جلسه TBM با شماره ${formData.tbmNumber} با موفقیت ثبت شد.`)
            resetForm()
        } catch (err: any) {
            console.error('submit TBM error', err)
            setError(err?.message ?? 'ثبت جلسه TBM ناموفق بود.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <FormLayout
            title="TBM - آموزش حین کار"
            code="PR-01-07-01"
            onReset={resetForm}
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            success={success}
        >
            {/* اطلاعات کلی */}
            <FormSection title="اطلاعات کلی">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text mb-2">
                            پروژه <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.projectId}
                            onChange={(e) => updateField('projectId', e.target.value)}
                            required
                        >
                            <option value="">انتخاب پروژه</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.code} - {project.name}
                                </option>
                            ))}
                        </select>
                    </div>
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
