'use client'

import React, { useEffect, useState } from 'react'
import { FormLayout } from '@/components/forms/FormLayout'
import { FormSection } from '@/components/ui/FormSection'
import { TextInput } from '@/components/ui/TextInput'
import { RowRepeater } from '@/components/ui/RowRepeater'
import { Select } from '@/components/ui/Select'
import {
    addTeamMember,
    createContractor,
    createOrgUnit,
    createSafetyTeam,
    createSection,
    fetchContractors,
    fetchOrgUnits,
    fetchProjects,
    fetchSections,
    type Contractor,
    type OrgUnit,
    type Project,
    type Section,
} from '@/lib/hse'

type TeamMemberRow = {
    contractor?: string
    unit?: string
    section?: string
    representative?: string
    signature?: string
    tbmNumber?: string
}

const initialState = {
    projectId: '',
    teamMembers: [] as TeamMemberRow[],
    preparer: '',
    approver: '',
}

type FormState = typeof initialState

export default function FR0112Page() {
    const [formData, setFormData] = useState<FormState>(initialState)
    const [projects, setProjects] = useState<Project[]>([])
    const [contractors, setContractors] = useState<Contractor[]>([])
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        const loadBasics = async () => {
            try {
                setLoading(true)
                const [proj, cons, units, secs] = await Promise.all([
                    fetchProjects(),
                    fetchContractors(),
                    fetchOrgUnits(),
                    fetchSections(),
                ])
                setProjects(proj)
                setContractors(cons)
                setOrgUnits(units)
                setSections(secs)
            } catch (err) {
                console.error('load basics failed', err)
                setError('خطا در دریافت داده‌های اولیه. لطفاً صفحه را بازنشانی کنید.')
            } finally {
                setLoading(false)
            }
        }
        loadBasics()
    }, [])

    const updateField = (field: keyof FormState, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        setFormData((prev) => ({ ...initialState, projectId: prev.projectId }))
        setError(null)
        setSuccess(null)
    }

    const projectOptions = projects.map((project) => ({
        value: String(project.id),
        label: `${project.code} – ${project.name}`,
    }))

    const ensureContractorId = async (name?: string) => {
        const trimmed = (name ?? '').trim()
        if (!trimmed) return null
        const existing = contractors.find((item) => item.name === trimmed)
        if (existing) return existing.id
        const created = await createContractor(trimmed)
        setContractors((prev) => [...prev, created])
        return created.id
    }

    const ensureOrgUnitId = async (name?: string) => {
        const trimmed = (name ?? '').trim()
        if (!trimmed) return null
        const existing = orgUnits.find((item) => item.name === trimmed)
        if (existing) return existing.id
        const created = await createOrgUnit(trimmed)
        setOrgUnits((prev) => [...prev, created])
        return created.id
    }

    const ensureSectionId = async (name: string | undefined, orgUnitId: number | null) => {
        const trimmed = (name ?? '').trim()
        if (!trimmed || !orgUnitId) return null
        const existing = sections.find((item) => item.name === trimmed && item.org_unit === orgUnitId)
        if (existing) return existing.id
        const created = await createSection(trimmed, orgUnitId)
        setSections((prev) => [...prev, created])
        return created.id
    }

    const handleSubmit = async () => {
        setError(null)
        setSuccess(null)

        if (!formData.projectId) {
            setError('پروژه را انتخاب کنید.')
            return
        }
        if (!formData.preparer) {
            setError('نام تهیه‌کننده را وارد کنید.')
            return
        }
        if (!formData.approver) {
            setError('نام تاییدکننده را وارد کنید.')
            return
        }
        if ((formData.teamMembers ?? []).length === 0) {
            setError('حداقل یک عضو تیم را ثبت کنید.')
            return
        }

        try {
            setLoading(true)
            const team = await createSafetyTeam({
                project: Number(formData.projectId),
                prepared_by_name: formData.preparer,
                approved_by_name: formData.approver,
            })

            for (const member of formData.teamMembers) {
                const representative = (member.representative ?? '').trim()
                if (!representative) {
                    continue
                }
                const contractorId = await ensureContractorId(member.contractor)
                const unitId = await ensureOrgUnitId(member.unit)
                const sectionId = await ensureSectionId(member.section, unitId)
                await addTeamMember(team.id, {
                    contractor: contractorId,
                    unit: unitId,
                    section: sectionId,
                    representative_name: representative,
                    signature_text: member.signature?.trim() || undefined,
                    tbm_no: member.tbmNumber?.trim() || undefined,
                })
            }

            setSuccess('تیم همیاران با موفقیت ثبت شد.')
            setFormData((prev) => ({ ...initialState, projectId: prev.projectId }))
        } catch (err: any) {
            console.error('submit safety team error', err)
            setError(err?.message ?? 'ثبت تیم با خطا مواجه شد.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <FormLayout
            title="تشکیل تیم همیاران HSE"
            code="FR-01-12-00"
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
                            {loading ? 'در حال ثبت...' : 'ثبت تیم'}
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
                        onChange={(value) => updateField('projectId', value)}
                        placeholder={loading && projectOptions.length === 0 ? 'در حال بارگذاری...' : 'انتخاب کنید'}
                    />
                    <TextInput
                        label="تهیه‌کننده (کارشناس HSE)"
                        placeholder="نام و امضای کارشناس HSE"
                        required
                        value={formData.preparer}
                        onChange={(value) => updateField('preparer', value)}
                    />
                    <TextInput
                        label="تصویب‌کننده (مدیر پروژه/سرپرست کارگاه)"
                        placeholder="نام و امضای مدیر پروژه"
                        required
                        value={formData.approver}
                        onChange={(value) => updateField('approver', value)}
                    />
                </div>
            </FormSection>

            <FormSection title="اعضای تیم همیاران HSE">
                <RowRepeater
                    label="اعضای تیم"
                    columns={[
                        { key: 'contractor', label: 'نام پیمانکار', type: 'text', placeholder: 'مثال: نصب‌افزار جنوب' },
                        { key: 'unit', label: 'نام واحد', type: 'text', placeholder: 'مثال: تولید' },
                        { key: 'section', label: 'نام بخش', type: 'text', placeholder: 'مثال: برش‌کاری' },
                        { key: 'representative', label: 'نام نماینده بخش', type: 'text', placeholder: 'نام و سمت' },
                        { key: 'signature', label: 'امضا', type: 'text', placeholder: 'امضای نماینده' },
                        { key: 'tbmNumber', label: 'شماره TBM', type: 'text', placeholder: 'مثال: TBM-1403-027' },
                    ]}
                    value={formData.teamMembers}
                    onChange={(value) => updateField('teamMembers', value as TeamMemberRow[])}
                    helper="در زمان ثبت، در صورت وجود نام واحد/بخش/پیمانکار در سامانه از همان استفاده می‌شود؛ در غیر این صورت به صورت خودکار ایجاد خواهند شد."
                />
            </FormSection>
        </FormLayout>
    )
}
