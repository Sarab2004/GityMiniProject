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
      issueDesc: data.issue_desc ?? FR0102_INITIAL_STATE.issueDesc,
      actionDesc: data.action_desc ?? FR0102_INITIAL_STATE.actionDesc,
      actionSource: data.source ?? FR0102_INITIAL_STATE.actionSource,
      executor: data.executor_text ?? FR0102_INITIAL_STATE.executor,
      deadline: data.due_date ?? FR0102_INITIAL_STATE.deadline,
      reviewDate1: data.review_date_1 ?? FR0102_INITIAL_STATE.reviewDate1,
      reviewDate2: data.review_date_2 ?? FR0102_INITIAL_STATE.reviewDate2,
      reviewDate3: data.review_date_3 ?? FR0102_INITIAL_STATE.reviewDate3,
      resolutionStatus: mapServerBooleanToStatus(data.resolved, "resolved", "not_resolved"),
      isKnowledge: mapServerBooleanToStatus(data.is_knowledge, "yes", "no"),
      isEffective: mapServerBooleanToStatus(data.effective, "effective", "not_effective"),
      newActionNumber: data.new_action_indicator ?? FR0102_INITIAL_STATE.newActionNumber,
    };
  },
  toPayload(state: FR0102State): Partial<FR0102ServerEntry> {
    return {
      action: state.actionId ? Number(state.actionId) : null,
      issue_desc: state.issueDesc || null,
      action_desc: state.actionDesc || null,
      source: state.actionSource || null,
      executor_text: state.executor || null,
      due_date: state.deadline || null,
      review_date_1: state.reviewDate1 || null,
      review_date_2: state.reviewDate2 || null,
      review_date_3: state.reviewDate3 || null,
      resolved: mapStatusToBoolean(state.resolutionStatus, "resolved", "not_resolved"),
      is_knowledge: mapStatusToBoolean(state.isKnowledge, "yes", "no"),
      effective: mapStatusToBoolean(state.isEffective, "effective", "not_effective"),
      new_action_indicator: state.newActionNumber || null,
    };
  },
};

// Register adapter on module load.
import { registerFormEntryAdapter } from "@/lib/formEntry";

registerFormEntryAdapter(fr0102Adapter);

export default fr0102Adapter;
