import type { FormEntryAdapter, FormEntryResponse } from "@/lib/formEntry";

export interface FR0102ServerEntry {
  action: number | null;
  issue_desc: string | null;
  action_desc: string | null;
  source: string | null;
  executor_text: string | null;
  due_date: string | null;
  review_date_1: string | null;
  review_date_2: string | null;
  review_date_3: string | null;
  resolved: boolean | null;
  is_knowledge: boolean | null;
  effective: boolean | null;
  new_action_indicator: string | null;
}

export interface FR0102State {
  actionId: string;
  issueDesc: string;
  actionDesc: string;
  actionSource: string;
  executor: string;
  deadline: string;
  reviewDate1: string;
  reviewDate2: string;
  reviewDate3: string;
  resolutionStatus: "" | "resolved" | "not_resolved";
  isKnowledge: "" | "yes" | "no";
  isEffective: "" | "effective" | "not_effective";
  newActionNumber: string;
}

export const FR0102_INITIAL_STATE: FR0102State = {
  actionId: "",
  issueDesc: "",
  actionDesc: "",
  actionSource: "",
  executor: "",
  deadline: "",
  reviewDate1: "",
  reviewDate2: "",
  reviewDate3: "",
  resolutionStatus: "",
  isKnowledge: "",
  isEffective: "",
  newActionNumber: "",
};

const ISSUE_DESC_MAX_LENGTH = 400;
const ACTION_DESC_MAX_LENGTH = 400;
const NEW_ACTION_NUMBER_MAX_LENGTH = 20;

const sanitizeText = (value: string | null | undefined, max: number): string => {
  if (!value) return "";
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
};

const sanitizeOptionalText = (value: string | null | undefined, max: number): string | null => {
  const sanitized = sanitizeText(value, max);
  return sanitized.length > 0 ? sanitized : null;
};

const trimOrEmpty = (value: string | null | undefined): string => (value ? value.trim() : "");
const trimOrNull = (value: string | null | undefined): string | null => {
  const trimmed = value ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : null;
};

const mapServerBooleanToStatus = (
  value: boolean | null,
  positive: string,
  negative: string,
): "" | typeof positive | typeof negative => {
  if (value === true) return positive;
  if (value === false) return negative;
  return "";
};

const mapStatusToBoolean = (
  value: string,
  positive: string,
  negative: string,
): boolean | null => {
  if (value === positive) return true;
  if (value === negative) return false;
  return null;
};

export const fr0102Adapter: FormEntryAdapter<FR0102ServerEntry, FR0102State> = {
  formCode: "FR-01-02",
  toState(entry: FormEntryResponse<FR0102ServerEntry>): FR0102State {
    const data = entry.data ?? ({} as FR0102ServerEntry);
    return {
      actionId: data.action ? String(data.action) : FR0102_INITIAL_STATE.actionId,
      issueDesc: sanitizeText(data.issue_desc, ISSUE_DESC_MAX_LENGTH) || FR0102_INITIAL_STATE.issueDesc,
      actionDesc: sanitizeText(data.action_desc, ACTION_DESC_MAX_LENGTH) || FR0102_INITIAL_STATE.actionDesc,
      actionSource: trimOrEmpty(data.source) || FR0102_INITIAL_STATE.actionSource,
      executor: trimOrEmpty(data.executor_text),
      deadline: trimOrEmpty(data.due_date),
      reviewDate1: trimOrEmpty(data.review_date_1),
      reviewDate2: trimOrEmpty(data.review_date_2),
      reviewDate3: trimOrEmpty(data.review_date_3),
      resolutionStatus: mapServerBooleanToStatus(
        data.resolved,
        "resolved",
        "not_resolved",
      ) as FR0102State["resolutionStatus"],
      isKnowledge: mapServerBooleanToStatus(
        data.is_knowledge,
        "yes",
        "no",
      ) as FR0102State["isKnowledge"],
      isEffective: mapServerBooleanToStatus(
        data.effective,
        "effective",
        "not_effective",
      ) as FR0102State["isEffective"],
      newActionNumber:
        sanitizeText(data.new_action_indicator, NEW_ACTION_NUMBER_MAX_LENGTH) ||
        FR0102_INITIAL_STATE.newActionNumber,
    };
  },
  toPayload(state: FR0102State): Partial<FR0102ServerEntry> {
    return {
      action: state.actionId ? Number(state.actionId) : null,
      issue_desc: sanitizeOptionalText(state.issueDesc, ISSUE_DESC_MAX_LENGTH),
      action_desc: sanitizeOptionalText(state.actionDesc, ACTION_DESC_MAX_LENGTH),
      source: trimOrNull(state.actionSource),
      executor_text: trimOrNull(state.executor),
      due_date: trimOrNull(state.deadline),
      review_date_1: trimOrNull(state.reviewDate1),
      review_date_2: trimOrNull(state.reviewDate2),
      review_date_3: trimOrNull(state.reviewDate3),
      resolved: mapStatusToBoolean(state.resolutionStatus, "resolved", "not_resolved"),
      is_knowledge: mapStatusToBoolean(state.isKnowledge, "yes", "no"),
      effective: mapStatusToBoolean(state.isEffective, "effective", "not_effective"),
      new_action_indicator: sanitizeOptionalText(state.newActionNumber, NEW_ACTION_NUMBER_MAX_LENGTH),
    };
  },
};

// Register adapter on module load.
import { registerFormEntryAdapter } from "@/lib/formEntry";

registerFormEntryAdapter(fr0102Adapter);

export default fr0102Adapter;
