"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormLayout } from "@/components/forms/FormLayout";
import { FormSection } from "@/components/ui/FormSection";
import { TextInput } from "@/components/ui/TextInput";
import { DateInput } from "@/components/ui/DateInput";
import { Select } from "@/components/ui/Select";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Textarea } from "@/components/ui/Textarea";
import {
  createActionTracking,
  fetchActions,
  type ActionSummary,
} from "@/lib/hse";
import {
  FR0102_INITIAL_STATE,
  FR0102State,
  FR0102ServerEntry,
  fr0102Adapter,
} from "@/lib/formEntry/adapters/FR-01-02";
import { getEntry, updateEntry } from "@/lib/api/formEntry";
import { usePermissions } from "@/hooks/usePermissions";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { ApiError } from "@/lib/api/_client";

const actionSourceOptions = [
  { value: "AUDIT", label: "ممیزی" },
  { value: "LEGAL", label: "الزامات قانونی" },
  { value: "PROCESS_RISKS", label: "ریسک‌های فرآیندی" },
  { value: "INCIDENTS", label: "حوادث" },
  { value: "NEAR_MISS", label: "نزدیک به حادثه" },
  { value: "UNSAFE_CONDITION", label: "شرایط ناایمن" },
  { value: "UNSAFE_ACT", label: "اقدام ناایمن" },
  { value: "CHECKLIST", label: "چک‌لیست" },
  { value: "HSE_RISKS", label: "ریسک‌های HSE" },
  { value: "ENV_ASPECTS", label: "جنبه‌های محیط‌زیستی" },
  { value: "MGT_REVIEW", label: "بازنگری مدیریت" },
  { value: "OTHER", label: "سایر" },
];

const resolutionOptions = [
  { value: "resolved", label: "اقدام مؤثر انجام شد" },
  { value: "not_resolved", label: "اقدام مؤثر انجام نشد" },
];

const yesNoOptions = [
  { value: "yes", label: "بله" },
  { value: "no", label: "خیر" },
];

const effectiveOptions = [
  { value: "effective", label: "مؤثر" },
  { value: "not_effective", label: "غیرمؤثر" },
];

const ISSUE_DESC_MAX_LENGTH = 400;
const ACTION_DESC_MAX_LENGTH = 400;
const NEW_ACTION_NUMBER_MAX_LENGTH = 20;

const limitText = (text: string, max: number) => (text.length > max ? text.slice(0, max) : text);

function validateState(state: FR0102State): string | null {
  if (!state.actionId) {
    return "لطفاً اقدام مرتبط را انتخاب کنید.";
  }
  if (!state.actionSource.trim()) {
    return "منبع اقدام الزامی است.";
  }
  const hasIssueDesc = state.issueDesc.trim().length > 0;
  const hasActionDesc = state.actionDesc.trim().length > 0;
  if (!hasIssueDesc || !hasActionDesc) {
    return "شرح مسئله و اقدام اصلاحی/پیشگیرانه را کامل کنید.";
  }
  if (!state.deadline) {
    return "تاریخ سررسید را وارد کنید.";
  }
  return null;
}

export default function FR0102Page() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const entryIdParam = searchParams.get("entryId");
  const entryId = entryIdParam ? Number(entryIdParam) : null;
  const isEditMode = mode === "edit" && entryId !== null && !Number.isNaN(entryId);

  const { can } = usePermissions();
  const canEditArchiveEntries = can("archive", "update");

  const [formData, setFormData] = useState<FR0102State>(FR0102_INITIAL_STATE);
  const [actions, setActions] = useState<ActionSummary[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [entryLoading, setEntryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [prefilledState, setPrefilledState] = useState<FR0102State | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  useEffect(() => {
    const loadActions = async () => {
      try {
        setActionsLoading(true);
        const data = await fetchActions();
        setActions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("load actions failed", err);
        setError("بارگذاری فهرست اقدامات با خطا روبه‌رو شد. لطفاً دوباره امتحان کنید.");
        setFieldErrors([]);
      } finally {
        setActionsLoading(false);
      }
    };
    loadActions();
  }, []);

  useEffect(() => {
    if (!isEditMode || entryId === null) {
      setFormData(FR0102_INITIAL_STATE);
      setPrefilledState(null);
      setFieldErrors([]);
      return;
    }

    const loadEntry = async () => {
      setEntryLoading(true);
      try {
        const entry = await getEntry<FR0102ServerEntry>("FR-01-02", entryId);
        const mapped = fr0102Adapter.toState(entry);
        setFormData(mapped);
        setPrefilledState({ ...mapped });
        setError(null);
        setFieldErrors([]);
      } catch (err) {
        console.error("load entry failed", err);
        setError("بارگذاری اطلاعات فرم با خطا روبه‌رو شد.");
        setFieldErrors([]);
      } finally {
        setEntryLoading(false);
      }
    };

    loadEntry();
  }, [entryId, isEditMode]);

  const actionOptions = useMemo(() => {
    const base = actions.map((action) => ({
      value: String(action.id),
      label: `${action.indicator}`,
    }));
    if (isEditMode && formData.actionId && base.every((option) => option.value !== formData.actionId)) {
      base.unshift({ value: formData.actionId, label: formData.actionId });
    }
    return base;
  }, [actions, formData.actionId, isEditMode]);

  const updateField = <K extends keyof FR0102State>(field: K, value: FR0102State[K]) => {
    let nextValue = value;

    if (typeof value === "string") {
      if (field === "issueDesc") {
        nextValue = limitText(value, ISSUE_DESC_MAX_LENGTH) as FR0102State[K];
      } else if (field === "actionDesc") {
        nextValue = limitText(value, ACTION_DESC_MAX_LENGTH) as FR0102State[K];
      } else if (field === "newActionNumber") {
        nextValue = limitText(value, NEW_ACTION_NUMBER_MAX_LENGTH) as FR0102State[K];
      } else if (
        field === "actionSource" ||
        field === "actionId" ||
        field === "executor" ||
        field === "deadline" ||
        field === "reviewDate1" ||
        field === "reviewDate2" ||
        field === "reviewDate3"
      ) {
        nextValue = value.trim() as FR0102State[K];
      }
    }

    setFormData((prev) => ({ ...prev, [field]: nextValue }));
  };

  const resetForm = () => {
    if (isEditMode && prefilledState) {
      setFormData(prefilledState);
    } else {
      setFormData(FR0102_INITIAL_STATE);
    }
    setError(null);
    setSuccess(null);
    setFieldErrors([]);
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    setFieldErrors([]);

    const validationError = validateState(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isEditMode && entryId !== null) {
      if (!canEditArchiveEntries) {
        setError("دسترسی لازم برای ویرایش این رکورد را ندارید.");
        return;
      }
      try {
        setSubmitting(true);
        const payload = fr0102Adapter.toPayload(formData);
        await updateEntry<FR0102ServerEntry>("FR-01-02", entryId, payload);
        setPrefilledState({ ...formData });
        setSuccess("بروزرسانی شد");
        setFieldErrors([]);
      } catch (err) {
        console.error("update tracking error", err);
        if (err instanceof ApiError) {
          if (err.status === 403) {
            setError("اجازه بروزرسانی این رکورد را ندارید.");
            setFieldErrors([]);
          } else if (err.status === 400 || err.status === 422) {
            const messages = err.messages && err.messages.length > 0 ? err.messages : null;
            setError("لطفاً خطاهای زیر را بررسی کنید و سپس دوباره تلاش کنید.");
            setFieldErrors(messages ?? ["بروزرسانی فرم با خطا روبه‌رو شد."]);
          } else {
            setError("بروزرسانی فرم با خطای غیرمنتظره روبه‌رو شد.");
            setFieldErrors([]);
          }
        } else {
          setError("بروزرسانی فرم با خطای غیرمنتظره روبه‌رو شد.");
          setFieldErrors([]);
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    try {
      setSubmitting(true);
      await createActionTracking({
        action: Number(formData.actionId),
        issue_desc: formData.issueDesc,
        action_desc: formData.actionDesc,
        source: formData.actionSource || "OTHER",
        executor_text: formData.executor,
        due_date: formData.deadline,
        review_date_1: formData.reviewDate1 || null,
        review_date_2: formData.reviewDate2 || null,
        review_date_3: formData.reviewDate3 || null,
        resolved:
          formData.resolutionStatus === ""
            ? null
            : formData.resolutionStatus === "resolved",
        is_knowledge:
          formData.isKnowledge === "" ? null : formData.isKnowledge === "yes",
        effective:
          formData.isEffective === ""
            ? null
            : formData.isEffective === "effective",
        new_action_indicator: formData.newActionNumber || null,
      });
      setSuccess("ثبت اقدام با موفقیت انجام شد.");
      setFormData((prev) => ({ ...FR0102_INITIAL_STATE, actionId: prev.actionId }));
      setFieldErrors([]);
    } catch (err) {
      console.error("submit tracking error", err);
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setError("اجازه ثبت این فرم را ندارید.");
          setFieldErrors([]);
        } else if (err.status === 400 || err.status === 422) {
          const messages = err.messages && err.messages.length > 0 ? err.messages : null;
          setError("لطفاً خطاهای زیر را بررسی کنید.");
          setFieldErrors(messages ?? ["اطلاعات ارسال‌شده معتبر نیست."]);
        } else {
          setError("ثبت فرم با خطای غیرمنتظره روبه‌رو شد.");
          setFieldErrors([]);
        }
      } else {
        const fallbackMessage = (err as { message?: string })?.message ?? "ثبت فرم با خطای غیرمنتظره روبه‌رو شد.";
        setError(fallbackMessage);
        setFieldErrors([]);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const primaryButtonLabel = isEditMode
    ? submitting
      ? "در حال بروزرسانی..."
      : "بروزرسانی"
    : submitting
      ? "در حال ثبت..."
      : "ثبت فرم";

  const primaryDisabled =
    submitting || actionsLoading || (isEditMode && (entryLoading || !canEditArchiveEntries));

  const resetDisabled = submitting || actionsLoading || (isEditMode && entryLoading);

  const sectionClassName = "p-4 sm:p-6";
  const fullWidthSectionClass = `${sectionClassName} md:col-span-2`;
  const actionPlaceholder = actionsLoading ? "در حال بارگذاری..." : "اقدام را انتخاب کنید";
  const actionSourcePlaceholder = "منبع اقدام را انتخاب کنید";

  return (
    <FormLayout
      title="پیگیری اقدام اصلاحی/پیشگیرانه"
      code="FR-01-02-00"
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
              بازنشانی فرم
            </button>
            <StatefulButton
              onClick={handleSubmit}
              className="w-full sm:w-auto"
              disabled={primaryDisabled}
            >
              {primaryButtonLabel}
            </StatefulButton>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
        {isEditMode ? (
          <div className="md:col-span-2 mb-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <div className="flex flex-col gap-2 min-w-0">
              <span className="truncate max-w-full" title={`در حال ویرایش رکورد #${entryId}`}>
                {`در حال ویرایش رکورد #${entryId}`}
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
                  <span className="truncate max-w-full" title="اجازه ویرایش ندارید.">
                    اجازه ویرایش ندارید.
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="کد اقدام"
              required
              options={actionOptions}
              placeholder={actionPlaceholder}
              value={formData.actionId}
              onChange={(value) => {
                if (actionsLoading) return;
                updateField("actionId", value);
              }}
              helper={actionsLoading ? "در حال بارگذاری فهرست اقدامات" : undefined}
            />
            <Select
              label="منبع اقدام"
              required
              options={actionSourceOptions}
              placeholder={actionSourcePlaceholder}
              value={formData.actionSource}
              onChange={(value) => updateField("actionSource", value)}
            />
          </div>
        </FormSection>

        <FormSection title="شرح مسئله و اقدام" className={fullWidthSectionClass}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Textarea
              label="شرح مسئله"
              required
              placeholder="شرح مسئله"
              value={formData.issueDesc}
              onChange={(value) => updateField("issueDesc", value)}
            />
            <Textarea
              label="شرح اقدام اصلاحی/پیشگیرانه"
              required
              placeholder="شرح اقدام انجام‌شده"
              value={formData.actionDesc}
              onChange={(value) => updateField("actionDesc", value)}
            />
            <TextInput
              label="مجری"
              placeholder="نام مجری"
              value={formData.executor}
              onChange={(value) => updateField("executor", value)}
            />
            <DateInput
              label="تاریخ سررسید"
              required
              helper="مهلت انجام"
              value={formData.deadline}
              onChange={(value) => updateField("deadline", value)}
            />
          </div>
        </FormSection>

        <FormSection title="وضعیت بازبینی" className={fullWidthSectionClass}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DateInput
              label="تاریخ بازبینی اول"
              value={formData.reviewDate1}
              onChange={(value) => updateField("reviewDate1", value)}
            />
            <DateInput
              label="تاریخ بازبینی دوم"
              value={formData.reviewDate2}
              onChange={(value) => updateField("reviewDate2", value)}
            />
            <DateInput
              label="تاریخ بازبینی سوم"
              value={formData.reviewDate3}
              onChange={(value) => updateField("reviewDate3", value)}
            />
          </div>
        </FormSection>

        <FormSection title="نتیجه اقدام" className={fullWidthSectionClass}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RadioGroup
              label="وضعیت اقدام"
              options={resolutionOptions}
              value={formData.resolutionStatus}
              onChange={(value) => updateField("resolutionStatus", value as FR0102State["resolutionStatus"])}
            />
            <RadioGroup
              label="آیا دانش جدید ایجاد شد؟"
              options={yesNoOptions}
              value={formData.isKnowledge}
              onChange={(value) => updateField("isKnowledge", value as FR0102State["isKnowledge"])}
            />
            <RadioGroup
              label="ارزیابی اثربخشی"
              options={effectiveOptions}
              value={formData.isEffective}
              onChange={(value) => updateField("isEffective", value as FR0102State["isEffective"])}
            />
            <TextInput
              label="شماره اقدام جدید (در صورت نیاز)"
              placeholder="در صورت نیاز به اقدام جدید"
              value={formData.newActionNumber}
              onChange={(value) => updateField("newActionNumber", value)}
            />
          </div>
        </FormSection>
      </div>
    </FormLayout>
  );
}
