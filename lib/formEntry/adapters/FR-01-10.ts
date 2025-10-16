import type { FormEntryAdapter, FormEntryResponse } from "@/lib/formEntry";
import { registerFormEntryAdapter } from "@/lib/formEntry";

export interface FR0110ServerAttendee {
  full_name: string | null;
  role_text: string | null;
  signature_text: string | null;
}

export interface FR0110ServerEntry {
  id: number;
  tbm_no: string | null;
  project: number | null;
  date: string | null;
  topic_text: string | null;
  trainer_text: string | null;
  location_text?: string | null;
  notes_text?: string | null;
  attendees?: FR0110ServerAttendee[] | null;
}

export interface FR0110AttendeeRow {
  fullName: string;
  role: string;
  signature: string;
}

export interface FR0110State {
  projectId: string;
  tbmNumber: string;
  projectLocation: string;
  date: string;
  subject: string;
  instructor: string;
  attendees: FR0110AttendeeRow[];
  notes: string;
}

export const FR0110_INITIAL_STATE: FR0110State = {
  projectId: "",
  tbmNumber: "",
  projectLocation: "",
  date: "",
  subject: "",
  instructor: "",
  attendees: [],
  notes: "",
};

const TBM_NUMBER_MAX_LENGTH = 20;
const LOCATION_MAX_LENGTH = 120;
const SUBJECT_MAX_LENGTH = 120;
const INSTRUCTOR_MAX_LENGTH = 60;
const NOTES_MAX_LENGTH = 1000;
const ATTENDEE_NAME_MAX_LENGTH = 60;
const ATTENDEE_ROLE_MAX_LENGTH = 40;
const ATTENDEE_SIGNATURE_MAX_LENGTH = 40;

const limitText = (value: string | null | undefined, max: number): string => {
  if (!value) return "";
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
};

const optionalText = (value: string | null | undefined, max: number): string | null => {
  const sanitized = limitText(value, max);
  return sanitized.length > 0 ? sanitized : null;
};

const sanitizeStateAttendee = (value: FR0110AttendeeRow): FR0110AttendeeRow => ({
  fullName: limitText(value.fullName, ATTENDEE_NAME_MAX_LENGTH),
  role: limitText(value.role, ATTENDEE_ROLE_MAX_LENGTH),
  signature: limitText(value.signature, ATTENDEE_SIGNATURE_MAX_LENGTH),
});

const sanitizeServerAttendee = (value: FR0110ServerAttendee): FR0110AttendeeRow => ({
  fullName: limitText(value.full_name, ATTENDEE_NAME_MAX_LENGTH),
  role: limitText(value.role_text, ATTENDEE_ROLE_MAX_LENGTH),
  signature: limitText(value.signature_text, ATTENDEE_SIGNATURE_MAX_LENGTH),
});

const sanitizeStateAttendees = (items: FR0110AttendeeRow[]): FR0110AttendeeRow[] =>
  items.map(sanitizeStateAttendee).filter((item) => item.fullName.length > 0 || item.role.length > 0 || item.signature.length > 0);

const sanitizeServerAttendees = (items: FR0110ServerAttendee[] | null | undefined): FR0110AttendeeRow[] => {
  if (!Array.isArray(items)) {
    return [];
  }
  return sanitizeStateAttendees(items.map((item) => sanitizeServerAttendee(item)));
};

export const fr0110Adapter: FormEntryAdapter<FR0110ServerEntry, FR0110State> = {
  formCode: "PR-01-07-01",
  toState(entry: FormEntryResponse<FR0110ServerEntry>): FR0110State {
    const data = entry.data ?? ({} as FR0110ServerEntry);
    return {
      projectId: data.project ? String(data.project) : FR0110_INITIAL_STATE.projectId,
      tbmNumber: limitText(data.tbm_no, TBM_NUMBER_MAX_LENGTH),
      projectLocation: limitText(data.location_text, LOCATION_MAX_LENGTH),
      date: data.date ?? FR0110_INITIAL_STATE.date,
      subject: limitText(data.topic_text, SUBJECT_MAX_LENGTH),
      instructor: limitText(data.trainer_text, INSTRUCTOR_MAX_LENGTH),
      attendees: sanitizeServerAttendees(data.attendees),
      notes: limitText(data.notes_text, NOTES_MAX_LENGTH),
    };
  },
  toPayload(state: FR0110State): Partial<FR0110ServerEntry> {
    return {
      project: state.projectId ? Number(state.projectId) : undefined,
      tbm_no: optionalText(state.tbmNumber, TBM_NUMBER_MAX_LENGTH),
      date: state.date || null,
      topic_text: optionalText(state.subject, SUBJECT_MAX_LENGTH),
      trainer_text: optionalText(state.instructor, INSTRUCTOR_MAX_LENGTH),
      location_text: optionalText(state.projectLocation, LOCATION_MAX_LENGTH),
      notes_text: optionalText(state.notes, NOTES_MAX_LENGTH),
    };
  },
};

registerFormEntryAdapter(fr0110Adapter);

export default fr0110Adapter;
