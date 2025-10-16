'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
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
import { ApiError } from '@/lib/api/_client'
import { getEntry, updateEntry } from '@/lib/api/formEntry'
import { usePermissions } from '@/hooks/usePermissions'
import {
    FR0112_INITIAL_STATE,
    type FR0112State,
    type FR0112MemberRow,
    type FR0112ServerEntry,
    fr0112Adapter,
    sanitizeMemberRow,
} from '@/lib/formEntry/adapters/FR-01-12'

const NAME_MAX_LENGTH = 60

const trimAndLimit = (value: string | null | undefined, maxLength: number): string => {
    if (!value) return ''
    const trimmed = value.trim()
    if (!trimmed) return ''
    return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed
}

const normalizeMemberRow = (row: Partial<FR0112MemberRow>): FR0112MemberRow => ({
    contractor: typeof row.contractor === 'string' ? row.contractor : '',
    unit: typeof row.unit === 'string' ? row.unit : '',
    section: typeof row.section === 'string' ? row.section : '',
    fullName: typeof row.fullName === 'string' ? row.fullName : '',
    contactInfo: typeof row.contactInfo === 'string' ? row.contactInfo : '',
    signature: typeof row.signature === 'string' ? row.signature : '',
    tbmNumber: typeof row.tbmNumber === 'string' ? row.tbmNumber : '',
})

const sanitizeTeamMembers = (rows: FR0112MemberRow[]): FR0112MemberRow[] =>
    rows.map((row) => sanitizeMemberRow(normalizeMemberRow(row)))

const validateState = (state: FR0112State): string | null => {
    if (!state.projectId) {
        return 'Ù¾Ø±ÙˆÚ˜Ù‡ Ø±Ø§ Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒØ¯.'
    }
    if (!state.preparer.trim()) {
        return 'Ù†Ø§Ù… ØªÙ‡ÛŒÙ‡â€ŒÚ©Ù†Ù†Ø¯Ù‡ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.'
    }
    if (!state.approver.trim()) {
        return 'Ù†Ø§Ù… ØªØ£ÛŒÛŒØ¯Ú©Ù†Ù†Ø¯Ù‡ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.'
    }
    const sanitizedMembers = sanitizeTeamMembers(state.teamMembers)
    const hasValidMember = sanitizedMembers.some((member) => member.fullName.length > 0)
    if (!hasValidMember) {
        return 'Ø­Ø¯Ø§Ù‚Ù„ ÛŒÚ© Ø¹Ø¶Ùˆ Ø¨Ø§ Ù†Ø§Ù… Ú©Ø§Ù…Ù„ Ø«Ø¨Øª Ú©Ù†ÛŒØ¯.'
    }
    return null
}

const hydrateMemberRow = (
    row: FR0112MemberRow,
    contractors: Contractor[],
    orgUnits: OrgUnit[],
    sections: Section[],
): FR0112MemberRow => {
    const sanitized = sanitizeMemberRow(normalizeMemberRow(row))
    const contractor = contractors.find((item) => String(item.id) === sanitized.contractor)
    const unit = orgUnits.find((item) => String(item.id) === sanitized.unit)
    const section = sections.find((item) => String(item.id) === sanitized.section)
    return sanitizeMemberRow({
        ...sanitized,
        contractor: contractor?.name ?? sanitized.contractor,
        unit: unit?.name ?? sanitized.unit,
        section: section?.name ?? sanitized.section,
    })
}

export default function FR0112Page() {
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode')
    const entryIdParam = searchParams.get('entryId')
    const entryId = entryIdParam ? Number(entryIdParam) : null
    const isEditMode = mode === 'edit' && entryId !== null && !Number.isNaN(entryId)

    const { can } = usePermissions()
    const canEditArchiveEntries = can('archive', 'update')

    const [formData, setFormData] = useState<FR0112State>(FR0112_INITIAL_STATE)
    const [projects, setProjects] = useState<Project[]>([])
    const [contractors, setContractors] = useState<Contractor[]>([])
    const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [optionsLoading, setOptionsLoading] = useState(false)
    const [entryLoading, setEntryLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<string[]>([])
    const [prefilledState, setPrefilledState] = useState<FR0112State | null>(null)
    const [prefillApplied, setPrefillApplied] = useState(false)

    useEffect(() => {
        const loadBasics = async () => {
            try {
                setOptionsLoading(true)
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
                setError('??? ?? ?????? ?اطلاعات کلی??. ????? ???? ?? ?اطلاعات کلی?.')
            } finally {
                setOptionsLoading(false)
            }
        }
        loadBasics()
    }, [])

    useEffect(() => {
        if (!isEditMode || entryId === null) {
            setFormData(FR0112_INITIAL_STATE)
            setPrefilledState(null)
            setPrefillApplied(false)
            setFieldErrors([])
            return
        }

        const loadEntry = async () => {
            setEntryLoading(true)
            try {
                const entry = await getEntry<FR0112ServerEntry>('FR-01-12', entryId)
                const mapped = fr0112Adapter.toState(entry)
                setPrefilledState(mapped)
                setPrefillApplied(false)
                setError(null)
                setFieldErrors([])
            } catch (err) {
                console.error('load safety team failed', err)
                setError('?????? ????? ??? ???? ?????? ???? ???.')
                setFieldErrors([])
            } finally {
                setEntryLoading(false)
            }
        }

        loadEntry()
    }, [entryId, isEditMode])

    useEffect(() => {
        if (!prefilledState || prefillApplied) {
            return
        }
        const hydratedMembers = prefilledState.teamMembers.map((member) =>
            hydrateMemberRow(member, contractors, orgUnits, sections),
        )
        setFormData({
            projectId: prefilledState.projectId,
            preparer: trimAndLimit(prefilledState.preparer, NAME_MAX_LENGTH),
            approver: trimAndLimit(prefilledState.approver, NAME_MAX_LENGTH),
            teamMembers: sanitizeTeamMembers(hydratedMembers),
        })
        setPrefillApplied(true)
    }, [contractors, orgUnits, sections, prefilledState, prefillApplied])

    const projectOptions = useMemo(
        () =>
            projects.map((project) => ({
                value: String(project.id),
                label: `${project.code} - ${project.name}`,
            })),
        [projects],
    )

    const handleProjectChange = (value: string) => {
        if (optionsLoading) {
            return
        }
        updateField('projectId', value as FR0112State['projectId'])
    }

    const updateField = <K extends keyof FR0112State>(field: K, value: FR0112State[K]) => {
        if (field === 'preparer' || field === 'approver') {
            const sanitized = trimAndLimit(typeof value === 'string' ? value : '', NAME_MAX_LENGTH)
            setFormData((prev) => ({ ...prev, [field]: sanitized }))
            return
        }
        if (field === 'teamMembers') {
            const sanitizedRows = sanitizeTeamMembers((value as FR0112MemberRow[]) ?? [])
            setFormData((prev) => ({ ...prev, teamMembers: sanitizedRows }))
            return
        }
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const resetForm = () => {
        if (isEditMode && prefilledState) {
            const hydrated = prefilledState.teamMembers.map((member) =>
                hydrateMemberRow(member, contractors, orgUnits, sections),
            )
            setFormData({
                projectId: prefilledState.projectId,
                preparer: trimAndLimit(prefilledState.preparer, NAME_MAX_LENGTH),
                approver: trimAndLimit(prefilledState.approver, NAME_MAX_LENGTH),
                teamMembers: sanitizeTeamMembers(hydrated),
            })
        } else {
            setFormData((prev) => ({ ...FR0112_INITIAL_STATE, projectId: prev.projectId }))
        }
        setError(null)
        setSuccess(null)
        setFieldErrors([])
    }

    const ensureContractorId = async (name?: string) => {
        const trimmed = trimAndLimit(name ?? '', NAME_MAX_LENGTH)
        if (!trimmed) return null
        const existing = contractors.find((item) => item.name === trimmed)
        if (existing) return existing.id
        const created = await createContractor(trimmed)
        setContractors((prev) => [...prev, created])
        return created.id
    }

    const ensureOrgUnitId = async (name?: string) => {
        const trimmed = trimAndLimit(name ?? '', NAME_MAX_LENGTH)
        if (!trimmed) return null
        const existing = orgUnits.find((item) => item.name === trimmed)
        if (existing) return existing.id
        const created = await createOrgUnit(trimmed)
        setOrgUnits((prev) => [...prev, created])
        return created.id
    }

    const ensureSectionId = async (name: string | undefined, orgUnitId: number | null) => {
        const trimmed = trimAndLimit(name ?? '', NAME_MAX_LENGTH)
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
        setFieldErrors([])

        const stateForSubmit: FR0112State = {
            ...formData,
            preparer: trimAndLimit(formData.preparer, NAME_MAX_LENGTH),
            approver: trimAndLimit(formData.approver, NAME_MAX_LENGTH),
            teamMembers: sanitizeTeamMembers(formData.teamMembers),
        }

        const validationError = validateState(stateForSubmit)
        if (validationError) {
            setError(validationError)
            return
        }

        if (isEditMode && entryId !== null) {
            if (!canEditArchiveEntries) {
                setError('Ø¯Ø³ØªØ±Ø³ÛŒ Ù„Ø§Ø²Ù… Ø¨Ø±Ø§ÛŒ ÙˆÛŒØ±Ø§ÛŒØ´ Ø§ÛŒÙ† Ø±Ú©ÙˆØ±Ø¯ Ø±Ø§ Ù†Ø¯Ø§Ø±ÛŒØ¯.')
                return
            }
            try {
                setSubmitting(true)
                const payload = fr0112Adapter.toPayload(stateForSubmit)
                await updateEntry('FR-01-12', entryId, payload)
                setPrefilledState({ ...stateForSubmit })
                setSuccess('Ø¨Ø±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø´Ø¯')
                setFieldErrors([])
            } catch (err) {
                console.error('update safety team error', err)
                if (err instanceof ApiError) {
                    if (err.status === 403) {
                        setError('Ø§Ø¬Ø§Ø²Ù‡ Ø¨Ø±ÙˆØ²Ø±Ø³Ø§Ù†ÛŒ Ø§ÛŒÙ† Ø±Ú©ÙˆØ±Ø¯ Ø±Ø§ Ù†Ø¯Ø§Ø±ÛŒØ¯.')
                        setFieldErrors([])
                    } else if (err.status === 400 || err.status === 422) {
                        const messages = err.messages && err.messages.length > 0 ? err.messages : null
                        setError('Ù„Ø·ÙØ§Ù‹ Ø®Ø·Ø§Ù‡Ø§ÛŒ Ø²ÛŒØ± Ø±Ø§ Ø¨Ø±Ø±Ø³ÛŒ Ú©Ù†ÛŒØ¯ Ùˆ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.')
                        setFieldErrors(messages ?? ['بروزرسانی فرم Ø¨Ø§ Ø®Ø·Ø§ Ø±ÙˆØ¨Ù‡â€ŒØ±Ùˆ Ø´Ø¯.'])
                    } else {
                        setError('بروزرسانی فرم Ø¨Ø§ Ø®Ø·Ø§ÛŒ ØºÛŒØ±Ù…Ù†ØªØ¸Ø±Ù‡ Ø±ÙˆØ¨Ù‡â€ŒØ±Ùˆ Ø´Ø¯.')
                        setFieldErrors([])
                    }
                } else {
                    setError('بروزرسانی فرم Ø¨Ø§ Ø®Ø·Ø§ÛŒ ØºÛŒØ±Ù…Ù†ØªØ¸Ø±Ù‡ Ø±ÙˆØ¨Ù‡â€ŒØ±Ùˆ Ø´Ø¯.')
                    setFieldErrors([])
                }
            } finally {
                setSubmitting(false)
            }
            return
        }

        try {
            setSubmitting(true)
            const team = await createSafetyTeam({
                project: Number(stateForSubmit.projectId),
                prepared_by_name: stateForSubmit.preparer,
                approved_by_name: stateForSubmit.approver,
            })

            for (const member of stateForSubmit.teamMembers) {
                if (!member.fullName) {
                    continue
                }
                const contractorId = await ensureContractorId(member.contractor)
                const unitId = await ensureOrgUnitId(member.unit)
                const sectionId = await ensureSectionId(member.section, unitId)
                await addTeamMember(team.id, {
                    contractor: contractorId,
                    unit: unitId,
                    section: sectionId,
                    representative_name: member.fullName,
                    contact_info: member.contactInfo || undefined,
                    signature_text: member.signature || undefined,
                    tbm_no: member.tbmNumber || undefined,
                })
            }

            setFormData((prev) => ({ ...FR0112_INITIAL_STATE, projectId: prev.projectId }))
            setSuccess('ÙØ±Ù… Ø¨Ø§ Ù…ÙˆÙÙ‚ÛŒØª Ø«Ø¨Øª Ø´Ø¯.')
            setFieldErrors([])
        } catch (err) {
            console.error('submit safety team error', err)
            if (err instanceof ApiError) {
                if (err.status === 403) {
                    setError('Ø§Ø¬Ø§Ø²Ù‡ Ø«Ø¨Øª Ø§ÛŒÙ† ÙØ±Ù… Ø±Ø§ Ù†Ø¯Ø§Ø±ÛŒØ¯.')
                    setFieldErrors([])
                } else if (err.status === 400 || err.status === 422) {
                    const messages = err.messages && err.messages.length > 0 ? err.messages : null
                    setError('Ù„Ø·ÙØ§Ù‹ Ø®Ø·Ø§Ù‡Ø§ÛŒ Ø²ÛŒØ± Ø±Ø§ Ø¨Ø±Ø±Ø³ÛŒ Ú©Ù†ÛŒØ¯ Ùˆ Ø¯ÙˆØ¨Ø§Ø±Ù‡ ØªÙ„Ø§Ø´ Ú©Ù†ÛŒØ¯.')
                    setFieldErrors(messages ?? ['ثبت فرم Ø¨Ø§ Ø®Ø·Ø§ Ø±ÙˆØ¨Ù‡â€ŒØ±Ùˆ Ø´Ø¯.'])
                } else {
                    setError('ثبت فرم Ø¨Ø§ Ø®Ø·Ø§ÛŒ ØºÛŒØ±Ù…Ù†ØªØ¸Ø±Ù‡ Ø±ÙˆØ¨Ù‡â€ŒØ±Ùˆ Ø´Ø¯.')
                    setFieldErrors([])
                }
            } else {
                setError('ثبت فرم Ø¨Ø§ Ø®Ø·Ø§ÛŒ ØºÛŒØ±Ù…Ù†ØªØ¸Ø±Ù‡ Ø±ÙˆØ¨Ù‡â€ŒØ±Ùˆ Ø´Ø¯.')
                setFieldErrors([])
            }
        } finally {
            setSubmitting(false)
        }
    }

    const primaryButtonLabel = isEditMode
        ? submitting
            ? 'در حال بروزرسانی...'
            : 'بروزرسانی فرم'
        : submitting
            ? 'در حال ثبت...'
            : 'ثبت فرم'

    const primaryDisabled =
        submitting ||
        optionsLoading ||
        (isEditMode && (entryLoading || !canEditArchiveEntries))

    const resetDisabled = submitting || optionsLoading || (isEditMode && entryLoading)
    const fullWidthSectionClass = 'p-4 sm:p-6 md:col-span-2'

    return (
        <FormLayout
            title="تشکیل تیم همیاران HSE"
            code="FR-01-12-00"
            onReset={resetForm}
            mobileFriendly
            footer={
                <div className="space-y-4">
                    {error ? (
                        <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-danger text-sm">
                            {error}
                        </div>
                    ) : null}
                    {fieldErrors.length > 0 ? (
                        <ul className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                            {fieldErrors.map((message, index) => (
                                <li key={index} className="leading-relaxed">
                                    {message}
                                </li>
                            ))}
                        </ul>
                    ) : null}
                    {success ? (
                        <div className="rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-success text-sm">
                            {success}
                        </div>
                    ) : null}
                    <div className="flex flex-col-reverse gap-2 md:flex-row md:items-center md:justify-end md:gap-3">
                        <button
                            type="button"
                            className="btn-secondary w-full md:w-auto"
                            onClick={resetForm}
                            disabled={resetDisabled}
                        >
                            پاک کردن فرم
                        </button>
                        <button
                            type="button"
                            className="btn-primary w-full md:w-auto"
                            onClick={handleSubmit}
                            disabled={primaryDisabled}
                        >
                            {primaryButtonLabel}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
                {isEditMode ? (
                    <div className="md:col-span-2 mb-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        <div className="flex flex-col gap-2 min-w-0">
                            <span className="truncate max-w-full" title={`در حال ویرایش رکورد #${entryId}`}>
                                در حال ویرایش رکورد #{entryId}
                            </span>
                            <div className="flex w-full flex-wrap items-center gap-3 text-xs text-amber-700/90">
                                <Link
                                    href="/archive"
                                    className="text-amber-700 underline truncate max-w-full"
                                    title="بازگشت به آرشیو"
                                >
                                    بازگشت به آرشیو
                                </Link>
                                {!canEditArchiveEntries ? (
                                    <span className="truncate max-w-full" title="مجوز ویرایش برای شما فعال نیست.">
                                        مجوز ویرایش برای شما فعال نیست.
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>
                ) : null}

                {isEditMode && entryLoading ? (
                    <div className="md:col-span-2 mb-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        در حال بارگذاری اطلاعات فرم...
                    </div>
                ) : null}

                <FormSection title="اطلاعات کلی" className={fullWidthSectionClass}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Select
                            label="پروژه"
                            required
                            options={projectOptions}
                            value={formData.projectId}
                            onChange={handleProjectChange}
                            placeholder={optionsLoading && projectOptions.length === 0 ? 'در حال بارگذاری...' : 'پروژه را انتخاب کنید'}
                            className={optionsLoading ? 'pointer-events-none opacity-60' : undefined}
                            aria-disabled={optionsLoading}
                        />
                        <TextInput
                            label="نام تهیه‌کننده"
                            placeholder="مثلاً: کارشناس HSE"
                            required
                            value={formData.preparer}
                            onChange={(value) => updateField('preparer', value)}
                        />
                        <TextInput
                            label="نام تأییدکننده"
                            placeholder="مثلاً: مدیر پروژه"
                            required
                            value={formData.approver}
                            onChange={(value) => updateField('approver', value)}
                        />
                    </div>
                </FormSection>

                <FormSection title="اعضای تیم همیاران HSE" className={fullWidthSectionClass}>
                    <div className="fr0112-repeater">
                        <RowRepeater
                            label="اعضای تیم"
                            columns={[
                                { key: 'contractor', label: 'نام پیمانکار', type: 'text', placeholder: 'مثلاً: شرکت توسعه' },
                                { key: 'unit', label: 'واحد', type: 'text', placeholder: 'مثلاً: تولید' },
                                { key: 'section', label: 'بخش', type: 'text', placeholder: 'مثلاً: نگهداری' },
                                { key: 'fullName', label: 'نام عضو تیم', type: 'text', placeholder: 'مثلاً: علی رضایی' },
                                { key: 'contactInfo', label: 'اطلاعات تماس', type: 'text', placeholder: 'مثلاً: 0912xxxxxxx، داخلی ۱۲۳' },
                                { key: 'signature', label: 'امضا', type: 'text', placeholder: 'در صورت نیاز' },
                                { key: 'tbmNumber', label: 'شماره TBM', type: 'text', placeholder: 'مثلاً: TBM-1403-027' },
                            ]}
                            value={formData.teamMembers}
                            onChange={(value) => updateField('teamMembers', value as FR0112MemberRow[])}
                            helper="در صورت موجود بودن نام پیمانکار/واحد/بخش در مرجع، از همان نام استفاده کنید تا تکراری ایجاد نشود."
                        />
                    </div>
                </FormSection>
            </div>

            <style jsx>{`
                .fr0112-repeater :global(> div:first-child > label::after) {
                    content: ' *';
                    color: #dc2626;
                    font-weight: 600;
                    margin-right: 0.25rem;
                }

                @media (max-width: 640px) {
                    .fr0112-repeater :global(.overflow-x-auto) {
                        overflow: visible;
                    }
                    .fr0112-repeater :global(table) {
                        display: grid;
                        gap: 0.75rem;
                        border: none;
                        border-radius: 0;
                    }
                    .fr0112-repeater :global(thead) {
                        display: none;
                    }
                    .fr0112-repeater :global(tbody) {
                        display: grid;
                        gap: 0.75rem;
                    }
                    .fr0112-repeater :global(tr) {
                        display: grid;
                        gap: 0.75rem;
                        border: 1px solid rgba(148, 163, 184, 0.35);
                        border-radius: 0.75rem;
                        padding: 1rem;
                        background: #ffffff;
                    }
                    .fr0112-repeater :global(td) {
                        border: none !important;
                        padding: 0 !important;
                    }
                    .fr0112-repeater :global(td::before) {
                        display: block;
                        font-size: 0.75rem;
                        font-weight: 500;
                        color: #64748b;
                        margin-bottom: 0.25rem;
                    }
                    .fr0112-repeater :global(td:nth-child(1)::before) {
                        content: 'نام پیمانکار';
                    }
                    .fr0112-repeater :global(td:nth-child(2)::before) {
                        content: 'واحد';
                    }
                    .fr0112-repeater :global(td:nth-child(3)::before) {
                        content: 'بخش';
                    }
                    .fr0112-repeater :global(td:nth-child(4)::before) {
                        content: 'نام عضو تیم';
                    }
                    .fr0112-repeater :global(td:nth-child(5)::before) {
                        content: 'اطلاعات تماس';
                    }
                    .fr0112-repeater :global(td:nth-child(6)::before) {
                        content: 'امضا';
                    }
                    .fr0112-repeater :global(td:nth-child(7)::before) {
                        content: 'شماره TBM';
                    }
                    .fr0112-repeater :global(td:last-child) {
                        display: flex;
                        justify-content: flex-end;
                        align-items: center;
                        padding-top: 0.5rem !important;
                    }
                    .fr0112-repeater :global(td:last-child::before) {
                        content: none;
                    }
                }
            `}</style>
        </FormLayout>
    )
}








