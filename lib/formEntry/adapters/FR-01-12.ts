import type { FormEntryAdapter, FormEntryResponse } from "@/lib/formEntry";
import { registerFormEntryAdapter } from "@/lib/formEntry";

export interface FR0112ServerMember {
  id: number;
  contractor: number | null;
  unit: number | null;
  section: number | null;
  representative_name: string | null;
  contact_info: string | null;
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
  fullName: string;
  contactInfo: string;
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

const NAME_MAX_LENGTH = 60;
const CONTACT_INFO_MAX_LENGTH = 80;
const SIGNATURE_MAX_LENGTH = 255;
const TBM_MAX_LENGTH = 50;

const trimToString = (value: unknown): string => {
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
};

const trimAndLimit = (value: string, maxLength: number): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
};

const trimOptionalToNull = (value: string, maxLength: number): string | null => {
  const trimmed = trimAndLimit(value, maxLength);
  return trimmed ? trimmed : null;
};

export const sanitizeMemberRow = (row: FR0112MemberRow): FR0112MemberRow => ({
  contractor: trimAndLimit(row.contractor, NAME_MAX_LENGTH),
  unit: trimAndLimit(row.unit, NAME_MAX_LENGTH),
  section: trimAndLimit(row.section, NAME_MAX_LENGTH),
  fullName: trimAndLimit(row.fullName, NAME_MAX_LENGTH),
  contactInfo: trimAndLimit(row.contactInfo, CONTACT_INFO_MAX_LENGTH),
  signature: trimAndLimit(row.signature, SIGNATURE_MAX_LENGTH),
  tbmNumber: trimAndLimit(row.tbmNumber, TBM_MAX_LENGTH),
});

const sanitizeServerMember = (member: FR0112ServerMember): FR0112MemberRow =>
  sanitizeMemberRow({
    contractor: member.contractor ? String(member.contractor) : "",
    unit: member.unit ? String(member.unit) : "",
    section: member.section ? String(member.section) : "",
    fullName: trimToString(member.representative_name ?? ""),
    contactInfo: trimToString(member.contact_info ?? ""),
    signature: trimToString(member.signature_text ?? ""),
    tbmNumber: trimToString(member.tbm_no ?? ""),
  });

const sanitizeMembersFromServer = (members: FR0112ServerMember[] | null | undefined): FR0112MemberRow[] => {
  if (!Array.isArray(members)) {
    return [];
  }
  return members.map(sanitizeServerMember);
};

export const fr0112Adapter: FormEntryAdapter<FR0112ServerEntry, FR0112State> = {
  formCode: "FR-01-12",
  toState(entry: FormEntryResponse<FR0112ServerEntry>): FR0112State {
    const data = entry.data ?? ({} as FR0112ServerEntry);

    return {
      projectId: data.project ? String(data.project) : FR0112_INITIAL_STATE.projectId,
      teamMembers: sanitizeMembersFromServer(data.members),
      preparer: trimAndLimit(trimToString(data.prepared_by_name ?? ""), NAME_MAX_LENGTH),
      approver: trimAndLimit(trimToString(data.approved_by_name ?? ""), NAME_MAX_LENGTH),
    };
  },
  toPayload(state: FR0112State): Partial<FR0112ServerEntry> {
    return {
      project: state.projectId ? Number(state.projectId) : undefined,
      prepared_by_name: trimOptionalToNull(state.preparer, NAME_MAX_LENGTH),
      approved_by_name: trimOptionalToNull(state.approver, NAME_MAX_LENGTH),
    };
  },
};

registerFormEntryAdapter(fr0112Adapter);

export default fr0112Adapter;
