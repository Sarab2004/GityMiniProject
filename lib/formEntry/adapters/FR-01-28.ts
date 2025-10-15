import type { FormEntryAdapter, FormEntryResponse } from "@/lib/formEntry";
import { registerFormEntryAdapter } from "@/lib/formEntry";

export interface FR0128ServerEntry {
  id: number;
  project: number | null;
  unit: number | null;
  section: number | null;
  process_title: string | null;
  activity_desc: string | null;
  routine_flag: "R" | "N" | null;
  hazard_desc: string | null;
  event_desc: string | null;
  consequence_desc: string | null;
  root_cause_desc: string | null;
  existing_controls_desc: string | null;
  inputs: string[] | null;
  legal_requirement_text: string | null;
  legal_status: "COMPLIANT" | "NONCOMPLIANT" | null;
  risk_type: "SAFETY" | "HEALTH" | "PROPERTY" | null;
  A: number | null;
  B: number | null;
  C: number | null;
  S: number | null;
  D: number | null;
  action_number_text: string | null;
  A2: number | null;
  B2: number | null;
  C2: number | null;
  S2: number | null;
  D2: number | null;
  action_number_text2: string | null;
}

export interface FR0128State {
  projectId: string;
  unitId: string;
  sectionId: string;
  processTitle: string;
  activityDesc: string;
  routineFlag: "R" | "N";
  hazardDesc: string;
  eventDesc: string;
  consequenceDesc: string;
  rootCauseDesc: string;
  controlsDesc: string;
  inputs: string[];
  legalRequirement: string;
  legalStatus: "COMPLIANT" | "NONCOMPLIANT";
  riskType: "SAFETY" | "HEALTH" | "PROPERTY";
  A: string;
  B: string;
  C: string;
  S: string;
  D: string;
  actionNumber: string;
  reevalA: string;
  reevalB: string;
  reevalC: string;
  reevalS: string;
  reevalD: string;
  reevalActionNumber: string;
}

export const FR0128_INITIAL_STATE: FR0128State = {
  projectId: "",
  unitId: "",
  sectionId: "",
  processTitle: "",
  activityDesc: "",
  routineFlag: "R",
  hazardDesc: "",
  eventDesc: "",
  consequenceDesc: "",
  rootCauseDesc: "",
  controlsDesc: "",
  inputs: [],
  legalRequirement: "",
  legalStatus: "COMPLIANT",
  riskType: "SAFETY",
  A: "",
  B: "",
  C: "",
  S: "",
  D: "",
  actionNumber: "",
  reevalA: "",
  reevalB: "",
  reevalC: "",
  reevalS: "",
  reevalD: "",
  reevalActionNumber: "",
};

const numberToString = (value: number | null | undefined): string =>
  value === null || value === undefined ? "" : String(value);

const toNumberOrNull = (value: string): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const fr0128Adapter: FormEntryAdapter<FR0128ServerEntry, FR0128State> = {
  formCode: "FR-01-28",
  toState(entry: FormEntryResponse<FR0128ServerEntry>): FR0128State {
    const data = entry.data ?? ({} as FR0128ServerEntry);
    return {
      projectId: data.project ? String(data.project) : FR0128_INITIAL_STATE.projectId,
      unitId: data.unit ? String(data.unit) : FR0128_INITIAL_STATE.unitId,
      sectionId: data.section ? String(data.section) : FR0128_INITIAL_STATE.sectionId,
      processTitle: data.process_title ?? FR0128_INITIAL_STATE.processTitle,
      activityDesc: data.activity_desc ?? FR0128_INITIAL_STATE.activityDesc,
      routineFlag: (data.routine_flag as FR0128State["routineFlag"]) ?? FR0128_INITIAL_STATE.routineFlag,
      hazardDesc: data.hazard_desc ?? FR0128_INITIAL_STATE.hazardDesc,
      eventDesc: data.event_desc ?? FR0128_INITIAL_STATE.eventDesc,
      consequenceDesc: data.consequence_desc ?? FR0128_INITIAL_STATE.consequenceDesc,
      rootCauseDesc: data.root_cause_desc ?? FR0128_INITIAL_STATE.rootCauseDesc,
      controlsDesc: data.existing_controls_desc ?? FR0128_INITIAL_STATE.controlsDesc,
      inputs: Array.isArray(data.inputs) ? data.inputs : FR0128_INITIAL_STATE.inputs,
      legalRequirement: data.legal_requirement_text ?? FR0128_INITIAL_STATE.legalRequirement,
      legalStatus: (data.legal_status as FR0128State["legalStatus"]) ?? FR0128_INITIAL_STATE.legalStatus,
      riskType: (data.risk_type as FR0128State["riskType"]) ?? FR0128_INITIAL_STATE.riskType,
      A: numberToString(data.A),
      B: numberToString(data.B),
      C: numberToString(data.C),
      S: numberToString(data.S),
      D: numberToString(data.D),
      actionNumber: data.action_number_text ?? FR0128_INITIAL_STATE.actionNumber,
      reevalA: numberToString(data.A2),
      reevalB: numberToString(data.B2),
      reevalC: numberToString(data.C2),
      reevalS: numberToString(data.S2),
      reevalD: numberToString(data.D2),
      reevalActionNumber: data.action_number_text2 ?? FR0128_INITIAL_STATE.reevalActionNumber,
    };
  },
  toPayload(state: FR0128State): Partial<FR0128ServerEntry> {
    return {
      project: state.projectId ? Number(state.projectId) : undefined,
      unit: state.unitId ? Number(state.unitId) : undefined,
      section: state.sectionId ? Number(state.sectionId) : null,
      process_title: state.processTitle || null,
      activity_desc: state.activityDesc || null,
      routine_flag: state.routineFlag || null,
      hazard_desc: state.hazardDesc || null,
      event_desc: state.eventDesc || null,
      consequence_desc: state.consequenceDesc || null,
      root_cause_desc: state.rootCauseDesc || null,
      existing_controls_desc: state.controlsDesc || null,
      inputs: state.inputs,
      legal_requirement_text: state.legalRequirement || null,
      legal_status: state.legalStatus || null,
      risk_type: state.riskType || null,
      A: toNumberOrNull(state.A),
      B: toNumberOrNull(state.B),
      C: toNumberOrNull(state.C),
      S: toNumberOrNull(state.S),
      D: toNumberOrNull(state.D),
      action_number_text: state.actionNumber || null,
      A2: toNumberOrNull(state.reevalA),
      B2: toNumberOrNull(state.reevalB),
      C2: toNumberOrNull(state.reevalC),
      S2: toNumberOrNull(state.reevalS),
      D2: toNumberOrNull(state.reevalD),
      action_number_text2: state.reevalActionNumber || null,
    };
  },
};

registerFormEntryAdapter(fr0128Adapter);

export default fr0128Adapter;
