import type { FormEntryAdapter, FormEntryResponse } from "@/lib/formEntry";
import { registerFormEntryAdapter } from "@/lib/formEntry";

export interface FR0101ServerActionItem {
  id: number;
  description_text: string | null;
  resources_text: string | null;
  due_date: string | null;
  owner_text: string | null;
}

export interface FR0101ServerEntry {
  id: number;
  indicator: string | null;
  project: number | null;
  requester_name: string | null;
  requester_unit_text: string | null;
  request_date: string | null;
  request_type: string | null;
  sources: string[] | null;
  nonconformity_or_change_desc: string | null;
  root_cause_or_goal_desc: string | null;
  needs_risk_update: boolean | null;
  risk_update_date: string | null;
  creates_knowledge: boolean | null;
  approved_by_performer_name: string | null;
  approved_by_manager_name: string | null;
  exec1_approved: boolean | null;
  exec1_note: string | null;
  exec1_new_date: string | null;
  exec2_approved: boolean | null;
  exec2_note: string | null;
  exec2_new_date: string | null;
  effectiveness_checked_at: string | null;
  effectiveness_method_text: string | null;
  effective: boolean | null;
  new_action_indicator: string | null;
  items?: FR0101ServerActionItem[] | null;
}

export interface FR0101ActionRow {
  action: string;
  resources: string;
  deadline: string;
  responsible: string;
}

export interface FR0101State {
  projectId: string;
  requesterName: string;
  requesterUnit: string;
  actionNumber: string;
  date: string;
  requestType: string;
  actionSource: string[];
  nonConformityDescription: string;
  rootCauseObjective: string;
  riskAssessmentUpdate: string;
  riskAssessmentDate: string;
  newKnowledgeExperience: string;
  requiredActions: FR0101ActionRow[];
  responsibleApproval: string;
  managerApproval: string;
  affectedDocuments: Record<string, unknown>[];
  firstReportStatus: string;
  firstReportDate: string;
  firstReportDescription: string;
  firstReportResponsibleSignature: string;
  firstReportApproverSignature: string;
  secondReportStatus: string;
  secondReportDate: string;
  secondReportDescription: string;
  secondReportResponsibleSignature: string;
  secondReportApproverSignature: string;
  effectivenessDate: string;
  effectivenessMethod: string;
  effectivenessStatus: string;
  newActionNumber: string;
  effectivenessReviewer: string;
  effectivenessSignature: string;
}

export const FR0101_INITIAL_STATE: FR0101State = {
  projectId: "",
  requesterName: "",
  requesterUnit: "",
  actionNumber: "",
  date: "",
  requestType: "",
  actionSource: [],
  nonConformityDescription: "",
  rootCauseObjective: "",
  riskAssessmentUpdate: "",
  riskAssessmentDate: "",
  newKnowledgeExperience: "",
  requiredActions: [],
  responsibleApproval: "",
  managerApproval: "",
  affectedDocuments: [],
  firstReportStatus: "",
  firstReportDate: "",
  firstReportDescription: "",
  firstReportResponsibleSignature: "",
  firstReportApproverSignature: "",
  secondReportStatus: "",
  secondReportDate: "",
  secondReportDescription: "",
  secondReportResponsibleSignature: "",
  secondReportApproverSignature: "",
  effectivenessDate: "",
  effectivenessMethod: "",
  effectivenessStatus: "",
  newActionNumber: "",
  effectivenessReviewer: "",
  effectivenessSignature: "",
};

const REQUEST_TYPE_TO_STATE: Record<string, string> = {
  CORRECTIVE: "corrective",
  PREVENTIVE: "preventive",
  CHANGE: "change",
  SUGGESTION: "improvement",
};

const REQUEST_TYPE_TO_SERVER: Record<string, string> = {
  corrective: "CORRECTIVE",
  preventive: "PREVENTIVE",
  change: "CHANGE",
  improvement: "SUGGESTION",
};

const SOURCE_TO_STATE: Record<string, string> = {
  AUDIT: "audit",
  LEGAL: "compliance",
  PROCESS_RISKS: "process_risks",
  INCIDENTS: "incidents",
  NEAR_MISS: "near_misses",
  UNSAFE_CONDITION: "unsafe_conditions",
  UNSAFE_ACT: "unsafe_acts",
  CHECKLIST: "checklist",
  HSE_RISKS: "safety_risks",
  ENV_ASPECTS: "environmental",
  MGT_REVIEW: "management_review",
  OTHER: "other",
};

const SOURCE_TO_SERVER: Record<string, string> = {
  audit: "AUDIT",
  compliance: "LEGAL",
  process_risks: "PROCESS_RISKS",
  incidents: "INCIDENTS",
  near_misses: "NEAR_MISS",
  unsafe_conditions: "UNSAFE_CONDITION",
  unsafe_acts: "UNSAFE_ACT",
  checklist: "CHECKLIST",
  safety_risks: "HSE_RISKS",
  environmental: "ENV_ASPECTS",
  management_review: "MGT_REVIEW",
  other: "OTHER",
};

const NOTE_SEPARATOR = " | ";
const NOTE_PREFIX_DESCRIPTION = "شرح: ";
const NOTE_PREFIX_RESPONSIBLE = "مسئول: ";
const NOTE_PREFIX_APPROVER = "تأییدکننده: ";

const METHOD_PREFIX_REVIEWER = "بررسی‌کننده: ";
const METHOD_PREFIX_SIGNATURE = "امضا: ";

const mapBooleanToYesNo = (value: boolean | null | undefined): string => {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
};

const mapYesNoToBoolean = (value: string): boolean | null => {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
};

const mapExecutionStatus = (value: boolean | null | undefined): string => {
  if (value === true) return "approved";
  if (value === false) return "not_approved";
  return "";
};

const mapEffectivenessStatus = (value: boolean | null | undefined): string => {
  if (value === true) return "effective";
  if (value === false) return "not_effective";
  return "";
};

interface ParsedExecutionNote {
  description: string;
  responsible: string;
  approver: string;
}

const parseExecutionNote = (note?: string | null): ParsedExecutionNote => {
  const result: ParsedExecutionNote = {
    description: "",
    responsible: "",
    approver: "",
  };
  if (!note) {
    return result;
  }
  const parts = note.split(NOTE_SEPARATOR).map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith(NOTE_PREFIX_DESCRIPTION)) {
      result.description = part.slice(NOTE_PREFIX_DESCRIPTION.length).trim();
    } else if (part.startsWith(NOTE_PREFIX_RESPONSIBLE)) {
      result.responsible = part.slice(NOTE_PREFIX_RESPONSIBLE.length).trim();
    } else if (part.startsWith(NOTE_PREFIX_APPROVER)) {
      result.approver = part.slice(NOTE_PREFIX_APPROVER.length).trim();
    } else if (!result.description) {
      result.description = part;
    }
  }
  return result;
};

interface ParsedEffectiveness {
  method: string;
  reviewer: string;
  signature: string;
}

const parseEffectiveness = (value?: string | null): ParsedEffectiveness => {
  const result: ParsedEffectiveness = {
    method: "",
    reviewer: "",
    signature: "",
  };
  if (!value) {
    return result;
  }
  const parts = value.split(NOTE_SEPARATOR).map((part) => part.trim());
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith(METHOD_PREFIX_REVIEWER)) {
      result.reviewer = part.slice(METHOD_PREFIX_REVIEWER.length).trim();
    } else if (part.startsWith(METHOD_PREFIX_SIGNATURE)) {
      result.signature = part.slice(METHOD_PREFIX_SIGNATURE.length).trim();
    } else if (!result.method) {
      result.method = part;
    }
  }
  return result;
};

const normalizeSource = (value: string | null | undefined): string | null => {
  if (!value) return null;
  if (SOURCE_TO_STATE[value]) return SOURCE_TO_STATE[value];
  const upper = value.toUpperCase();
  if (SOURCE_TO_STATE[upper]) return SOURCE_TO_STATE[upper];
  return "other";
};

export const fr0101Adapter: FormEntryAdapter<FR0101ServerEntry, FR0101State> = {
  formCode: "FR-01-01",
  toState(entry: FormEntryResponse<FR0101ServerEntry>): FR0101State {
    const data = entry.data ?? ({} as FR0101ServerEntry);
    const execution1 = parseExecutionNote(data.exec1_note);
    const execution2 = parseExecutionNote(data.exec2_note);
    const effectiveness = parseEffectiveness(data.effectiveness_method_text);
    const items: FR0101ActionRow[] = Array.isArray(data.items)
      ? data.items.map((item) => ({
          action: item.description_text ?? "",
          resources: item.resources_text ?? "",
          deadline: item.due_date ?? "",
          responsible: item.owner_text ?? "",
        }))
      : [];
    const sources: string[] = Array.isArray(data.sources)
      ? data.sources
          .map((source) => normalizeSource(source))
          .filter((source): source is string => Boolean(source))
      : FR0101_INITIAL_STATE.actionSource;

    return {
      projectId: data.project ? String(data.project) : FR0101_INITIAL_STATE.projectId,
      requesterName: data.requester_name ?? FR0101_INITIAL_STATE.requesterName,
      requesterUnit: data.requester_unit_text ?? FR0101_INITIAL_STATE.requesterUnit,
      actionNumber: data.indicator ?? FR0101_INITIAL_STATE.actionNumber,
      date: data.request_date ?? FR0101_INITIAL_STATE.date,
      requestType:
        (data.request_type && REQUEST_TYPE_TO_STATE[data.request_type]) ?? FR0101_INITIAL_STATE.requestType,
      actionSource: sources,
      nonConformityDescription:
        data.nonconformity_or_change_desc ?? FR0101_INITIAL_STATE.nonConformityDescription,
      rootCauseObjective: data.root_cause_or_goal_desc ?? FR0101_INITIAL_STATE.rootCauseObjective,
      riskAssessmentUpdate: mapBooleanToYesNo(data.needs_risk_update),
      riskAssessmentDate: data.risk_update_date ?? FR0101_INITIAL_STATE.riskAssessmentDate,
      newKnowledgeExperience: mapBooleanToYesNo(data.creates_knowledge),
      requiredActions: items,
      responsibleApproval: data.approved_by_performer_name ?? FR0101_INITIAL_STATE.responsibleApproval,
      managerApproval: data.approved_by_manager_name ?? FR0101_INITIAL_STATE.managerApproval,
      affectedDocuments: FR0101_INITIAL_STATE.affectedDocuments,
      firstReportStatus: mapExecutionStatus(data.exec1_approved),
      firstReportDate: data.exec1_new_date ?? FR0101_INITIAL_STATE.firstReportDate,
      firstReportDescription: execution1.description,
      firstReportResponsibleSignature: execution1.responsible,
      firstReportApproverSignature: execution1.approver,
      secondReportStatus: mapExecutionStatus(data.exec2_approved),
      secondReportDate: data.exec2_new_date ?? FR0101_INITIAL_STATE.secondReportDate,
      secondReportDescription: execution2.description,
      secondReportResponsibleSignature: execution2.responsible,
      secondReportApproverSignature: execution2.approver,
      effectivenessDate: data.effectiveness_checked_at ?? FR0101_INITIAL_STATE.effectivenessDate,
      effectivenessMethod: effectiveness.method,
      effectivenessStatus: mapEffectivenessStatus(data.effective),
      newActionNumber: data.new_action_indicator ?? FR0101_INITIAL_STATE.newActionNumber,
      effectivenessReviewer: effectiveness.reviewer,
      effectivenessSignature: effectiveness.signature,
    };
  },
  toPayload(state: FR0101State): Partial<FR0101ServerEntry> {
    const needsRiskUpdate = mapYesNoToBoolean(state.riskAssessmentUpdate);
    const createsKnowledge = mapYesNoToBoolean(state.newKnowledgeExperience);

    return {
      project: state.projectId ? Number(state.projectId) : undefined,
      requester_name: state.requesterName || null,
      requester_unit_text: state.requesterUnit || null,
      request_date: state.date || null,
      request_type: state.requestType ? REQUEST_TYPE_TO_SERVER[state.requestType] : null,
      sources: state.actionSource.length
        ? state.actionSource.map((item) => SOURCE_TO_SERVER[item] ?? "OTHER")
        : [],
      nonconformity_or_change_desc: state.nonConformityDescription || null,
      root_cause_or_goal_desc: state.rootCauseObjective || null,
      needs_risk_update: needsRiskUpdate ?? undefined,
      risk_update_date: state.riskAssessmentDate || null,
      creates_knowledge: createsKnowledge ?? undefined,
      approved_by_performer_name: state.responsibleApproval || null,
      approved_by_manager_name: state.managerApproval || null,
    };
  },
};

registerFormEntryAdapter(fr0101Adapter);

export default fr0101Adapter;
