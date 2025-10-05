'use client'

import React, { useEffect, useState } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { DateInput } from '@/components/ui/DateInput'
import { Textarea } from '@/components/ui/Textarea'
import { RowRepeater } from '@/components/ui/RowRepeater'
import { Select } from '@/components/ui/Select'
import {
    createChangeLog,
    fetchActions,
    type ActionSummary,
} from '@/lib/hse'

type ChangeFormState = {
    actionId: string
    changeSubject: string
    registrationDate: string
    implementationDate: string
    changeResponsible: string
    requiredActions: Record<string, any>[]
    fr0101Number: string
    description: string
}

const initialState: ChangeFormState = {
    actionId: '',
    changeSubject: '',
    registrationDate: '',
    implementationDate: '',
    changeResponsible: '',
    requiredActions: [],
    fr0101Number: '',
    description: '',
}

export default function FR0103Page() {
    const [formData, setFormData] = useState<ChangeFormState>(initialState)
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
                setError('امکان دریافت فهرست اقدامات وجود ندارد. بعداً تلاش کنید.')
            } finally {
                setLoading(false)
            }
        }
        loadActions()
    }, [])

    const updateField = <K extends keyof ChangeFormState>(field: K, value: ChangeFormState[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        setFormData((prev) => ({ ...initialState, actionId: prev.actionId }))
        setError(null)
        setSuccess(null)
    }

    const actionOptions = actions.map((action) => ({ value: String(action.id), label: action.indicator }))

    const serializeRequiredActions = (items: Record<string, any>[]) => {
        return items
            .filter((item) => (item.action ?? '').trim() !== '')
            .map((item) => {
                const parts = [`اقدام: ${item.action ?? ''}`]
                if (item.responsible) parts.push(`مسئول: ${item.responsible}`)
                if (item.deadline) parts.push(`مهلت: ${item.deadline}`)
                if (item.status) parts.push(`وضعیت: ${item.status}`)
                return parts.join(' | ')
            })
            .join('\n')
    }

    const handleSubmit = async () => {
        setError(null)
        setSuccess(null)

        if (!formData.actionId) {
            setError('شماره اقدام مرتبط را انتخاب کنید.')
            return
        }
        if (!formData.changeSubject) {
            setError('موضوع تغییر را وارد کنید.')
            return
        }
        if (!formData.registrationDate || !formData.implementationDate) {
            setError('تاریخ ثبت و تاریخ اجرا الزامی است.')
            return
        }
        if (!formData.changeResponsible) {
            setError('مسئول تغییر را وارد کنید.')
            return
        }
        if (formData.requiredActions.length === 0) {
            setError('حداقل یک اقدام مورد نیاز را وارد کنید.')
            return
        }

        try {
            setLoading(true)
            const payload: any = {
                action: Number(formData.actionId),
                subject_text: formData.changeSubject,
                date_registered: formData.registrationDate,
                date_applied: formData.implementationDate,
                owner_text: formData.changeResponsible,
                required_actions_text: serializeRequiredActions(formData.requiredActions),
            }

            if (formData.fr0101Number) {
                payload.related_action_no_text = formData.fr0101Number
            }
            if (formData.description) {
                payload.notes_text = formData.description
            }

            await createChangeLog(payload)
            setSuccess('تغییر با موفقیت ثبت شد.')
            setFormData((prev) => ({ ...initialState, actionId: prev.actionId }))
        } catch (err: any) {
            console.error('submit change log error', err)
            setError(err?.message ?? 'ثبت تغییر ناموفق بود.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <FormLayout
            title="ثبت و پیگیری تغییرات"
            code="FR-01-03-00"
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
                            {loading ? 'در حال ثبت...' : 'ثبت تغییر'}
                        </button>
                    </div>
                </div>
            }
        >
            <FormSection title="اطلاعات کلی">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="شماره اقدام مرتبط (FR-01-01)"
                        required
                        options={actionOptions}
                        value={formData.actionId}
                        onChange={(value) => updateField('actionId', value as ChangeFormState['actionId'])}
                        placeholder={loading && actionOptions.length === 0 ? 'در حال بارگذاری...' : 'انتخاب کنید'}
                    />
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

            <FormSection title="اقدامات موردنیاز">
                <RowRepeater
                    label="اقدامات موردنیاز"
                    columns={[
                        { key: 'action', label: 'شرح اقدام', type: 'text', placeholder: 'شرح اقدام موردنیاز' },
                        { key: 'responsible', label: 'مسئول', type: 'text', placeholder: 'نام و سمت' },
                        { key: 'deadline', label: 'مهلت', type: 'date' },
                        { key: 'status', label: 'وضعیت', type: 'text', placeholder: 'انجام شده / در جریان / ...' },
                    ]}
                    value={formData.requiredActions}
                    onChange={(value) => updateField('requiredActions', value)}
                />
            </FormSection>

            <FormSection title="ارتباط با فرم اقدام اصلاحی">
                <TextInput
                    label="شماره فرم اقدام اصلاحی و پیشگیرانه (FR-01-01)"
                    placeholder="مثال: FR-01-01-001"
                    value={formData.fr0101Number}
                    onChange={(value) => updateField('fr0101Number', value)}
                />
            </FormSection>

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
