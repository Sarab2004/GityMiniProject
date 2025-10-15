import type { FormEntryAdapter, FormEntryResponse } from "@/lib/formEntry";
import { registerFormEntryAdapter } from "@/lib/formEntry";

export interface FR0112ServerMember {
  id: number;
  contractor: number | null;
  unit: number | null;
  section: number | null;
  representative_name: string | null;
  signature_text: string | null;
  tbm_no: string | null;
}

export interface FR0112ServerEntry {
  id: number;
  project: number | null;
  prepared_by_name: string | null;
  approved_by_name: string | null;
  members?: FR0112ServerMember[] | null;
}

export interface FR0112MemberRow {
  contractor: string;
  unit: string;
  section: string;
  representative: string;
  signature: string;
  tbmNumber: string;
}

export interface FR0112State {
  projectId: string;
  teamMembers: FR0112MemberRow[];
  preparer: string;
  approver: string;
}

export const FR0112_INITIAL_STATE: FR0112State = {
  projectId: "",
  teamMembers: [],
  preparer: "",
  approver: "",
};

export const fr0112Adapter: FormEntryAdapter<FR0112ServerEntry, FR0112State> = {
  formCode: "FR-01-12",
  toState(entry: FormEntryResponse<FR0112ServerEntry>): FR0112State {
    const data = entry.data ?? ({} as FR0112ServerEntry);
    const members: FR0112MemberRow[] = Array.isArray(data.members)
      ? data.members.map((member) => ({
          contractor: member.contractor ? String(member.contractor) : "",
          unit: member.unit ? String(member.unit) : "",
          section: member.section ? String(member.section) : "",
          representative: member.representative_name ?? "",
          signature: member.signature_text ?? "",
          tbmNumber: member.tbm_no ?? "",
        }))
      : FR0112_INITIAL_STATE.teamMembers;

    return {
      projectId: data.project ? String(data.project) : FR0112_INITIAL_STATE.projectId,
      teamMembers: members,
      preparer: data.prepared_by_name ?? FR0112_INITIAL_STATE.preparer,
      approver: data.approved_by_name ?? FR0112_INITIAL_STATE.approver,
    };
  },
  toPayload(state: FR0112State): Partial<FR0112ServerEntry> {
    return {
      project: state.projectId ? Number(state.projectId) : undefined,
      prepared_by_name: state.preparer || null,
      approved_by_name: state.approver || null,
    };
  },
};

registerFormEntryAdapter(fr0112Adapter);

export default fr0112Adapter;
