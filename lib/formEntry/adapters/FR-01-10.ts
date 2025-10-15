import type { FormEntryAdapter, FormEntryResponse } from "@/lib/formEntry";
import { registerFormEntryAdapter } from "@/lib/formEntry";

export interface FR0110ServerEntry {
  id: number;
  tbm_no: string | null;
  project: number | null;
  date: string | null;
  topic_text: string | null;
  trainer_text: string | null;
}

export interface FR0110AttendeeRow {
  name: string;
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

export const fr0110Adapter: FormEntryAdapter<FR0110ServerEntry, FR0110State> = {
  formCode: "PR-01-07-01",
  toState(entry: FormEntryResponse<FR0110ServerEntry>): FR0110State {
    const data = entry.data ?? ({} as FR0110ServerEntry);
    return {
      projectId: data.project ? String(data.project) : FR0110_INITIAL_STATE.projectId,
      tbmNumber: data.tbm_no ?? FR0110_INITIAL_STATE.tbmNumber,
      projectLocation: FR0110_INITIAL_STATE.projectLocation,
      date: data.date ?? FR0110_INITIAL_STATE.date,
      subject: data.topic_text ?? FR0110_INITIAL_STATE.subject,
      instructor: data.trainer_text ?? FR0110_INITIAL_STATE.instructor,
      attendees: FR0110_INITIAL_STATE.attendees,
      notes: FR0110_INITIAL_STATE.notes,
    };
  },
  toPayload(state: FR0110State): Partial<FR0110ServerEntry> {
    return {
      project: state.projectId ? Number(state.projectId) : undefined,
      tbm_no: state.tbmNumber || null,
      date: state.date || null,
      topic_text: state.subject || null,
      trainer_text: state.instructor || null,
    };
  },
};

registerFormEntryAdapter(fr0110Adapter);

export default fr0110Adapter;
