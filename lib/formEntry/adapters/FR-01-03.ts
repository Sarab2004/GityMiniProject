import type { FormEntryAdapter, FormEntryResponse } from "@/lib/formEntry";
import { registerFormEntryAdapter } from "@/lib/formEntry";

export interface FR0103ServerEntry {
  id: number;
  action: number | null;
  subject_text: string | null;
  date_registered: string | null;
  date_applied: string | null;
  owner_text: string | null;
  required_actions_text: string | null;
  related_action_no_text: string | null;
  notes_text: string | null;
}

export interface FR0103ActionRow {
  action: string;
  responsible: string;
  deadline: string;
  status: string;
}

export interface FR0103State {
  actionId: string;
  changeSubject: string;
  registrationDate: string;
  implementationDate: string;
  changeResponsible: string;
  requiredActions: FR0103ActionRow[];
  fr0101Number: string;
  description: string;
}

export const FR0103_INITIAL_STATE: FR0103State = {
  actionId: "",
  changeSubject: "",
  registrationDate: "",
  implementationDate: "",
  changeResponsible: "",
  requiredActions: [],
  fr0101Number: "",
  description: "",
};

const ACTION_PREFIX = "اقدام: ";
const RESPONSIBLE_PREFIX = "مسئول: ";
const DEADLINE_PREFIX = "مهلت: ";
const STATUS_PREFIX = "وضعیت: ";
const NOTE_SEPARATOR = " | ";

const ACTION_MAX_LENGTH = 120;
const RESPONSIBLE_MAX_LENGTH = 60;
const STATUS_MAX_LENGTH = 60;
const NOTE_MAX_LENGTH = 200;

const sanitizeLimited = (value: string | null | undefined, max: number): string => {
  if (!value) return "";
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
};

const sanitizeOptional = (value: string | null | undefined, max: number): string | null => {
  const sanitized = sanitizeLimited(value, max);
  return sanitized.length > 0 ? sanitized : null;
};

export const parseFR0103RequiredActions = (value?: string | null): FR0103ActionRow[] => {
  if (!value) {
    return [];
  }
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split(NOTE_SEPARATOR).map((part) => part.trim());
      const row: FR0103ActionRow = {
        action: "",
        responsible: "",
        deadline: "",
        status: "",
      };
      for (const part of parts) {
        if (part.startsWith(ACTION_PREFIX)) {
          row.action = part.slice(ACTION_PREFIX.length).trim();
        } else if (part.startsWith(RESPONSIBLE_PREFIX)) {
          row.responsible = part.slice(RESPONSIBLE_PREFIX.length).trim();
        } else if (part.startsWith(DEADLINE_PREFIX)) {
          row.deadline = part.slice(DEADLINE_PREFIX.length).trim();
        } else if (part.startsWith(STATUS_PREFIX)) {
          row.status = part.slice(STATUS_PREFIX.length).trim();
        } else if (!row.action) {
          row.action = part;
        }
      }
      return {
        action: sanitizeLimited(row.action, ACTION_MAX_LENGTH),
        responsible: sanitizeLimited(row.responsible, RESPONSIBLE_MAX_LENGTH),
        deadline: row.deadline?.trim() ?? "",
        status: sanitizeLimited(row.status, STATUS_MAX_LENGTH),
      };
    });
};

export const serializeFR0103RequiredActions = (items: FR0103ActionRow[]): string | null => {
  const lines = items
    .map((item) => ({
      action: sanitizeLimited(item.action, ACTION_MAX_LENGTH),
      responsible: sanitizeLimited(item.responsible, RESPONSIBLE_MAX_LENGTH),
      deadline: item.deadline?.trim() ?? "",
      status: sanitizeLimited(item.status, STATUS_MAX_LENGTH),
    }))
    .filter((item) => item.action.length > 0)
    .map((item) => {
      const segments = [`${ACTION_PREFIX}${item.action}`];
      if (item.responsible) {
        segments.push(`${RESPONSIBLE_PREFIX}${item.responsible}`);
      }
      if (item.deadline) {
        segments.push(`${DEADLINE_PREFIX}${item.deadline}`);
      }
      if (item.status) {
        segments.push(`${STATUS_PREFIX}${item.status}`);
      }
      return segments.join(NOTE_SEPARATOR);
    });
  return lines.length > 0 ? lines.join("\n") : null;
};

export const fr0103Adapter: FormEntryAdapter<FR0103ServerEntry, FR0103State> = {
  formCode: "FR-01-03",
  toState(entry: FormEntryResponse<FR0103ServerEntry>): FR0103State {
    const data = entry.data ?? ({} as FR0103ServerEntry);
    return {
      actionId: data.action ? String(data.action) : FR0103_INITIAL_STATE.actionId,
      changeSubject: sanitizeLimited(data.subject_text, NOTE_MAX_LENGTH),
      registrationDate: data.date_registered ?? FR0103_INITIAL_STATE.registrationDate,
      implementationDate: data.date_applied ?? FR0103_INITIAL_STATE.implementationDate,
      changeResponsible: sanitizeLimited(data.owner_text, RESPONSIBLE_MAX_LENGTH),
      requiredActions: parseFR0103RequiredActions(data.required_actions_text),
      fr0101Number: sanitizeLimited(data.related_action_no_text, NOTE_MAX_LENGTH),
      description: sanitizeLimited(data.notes_text, NOTE_MAX_LENGTH),
    };
  },
  toPayload(state: FR0103State): Partial<FR0103ServerEntry> {
    return {
      action: state.actionId ? Number(state.actionId) : undefined,
      subject_text: sanitizeOptional(state.changeSubject, NOTE_MAX_LENGTH),
      date_registered: state.registrationDate || null,
      date_applied: state.implementationDate || null,
      owner_text: sanitizeOptional(state.changeResponsible, RESPONSIBLE_MAX_LENGTH),
      required_actions_text: serializeFR0103RequiredActions(state.requiredActions),
      related_action_no_text: sanitizeOptional(state.fr0101Number, NOTE_MAX_LENGTH),
      notes_text: sanitizeOptional(state.description, NOTE_MAX_LENGTH),
    };
  },
};

registerFormEntryAdapter(fr0103Adapter);

export default fr0103Adapter;
