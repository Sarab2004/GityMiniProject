import assert from "node:assert/strict";
import test from "node:test";

import {
  FR0103_INITIAL_STATE,
  type FR0103ServerEntry,
  fr0103Adapter,
  serializeFR0103RequiredActions,
} from "../../lib/formEntry/adapters/FR-01-03";
import type { FormEntryResponse } from "../../lib/formEntry";

test("fr0103Adapter trims and limits requiredActions round-trip", () => {
  const state = {
    ...FR0103_INITIAL_STATE,
    actionId: "7",
    changeSubject: "  اصلاح فرآیند تولید  ",
    registrationDate: "2025-10-16",
    implementationDate: "2025-11-01",
    changeResponsible: "  مدیر تولید  ",
    requiredActions: [
      {
        action: "اقدام خیلی خیلی طولانی".repeat(10),
        responsible: "  سرپرست ارشد تغییرات  ",
        deadline: "2025-11-05",
        status: "  برنامه‌ریزی‌شده  ",
      },
    ],
    fr0101Number: "  FR-01-01-009  ",
    description: "  یادداشت های طولانی  ".repeat(10),
  };

  const payload = fr0103Adapter.toPayload(state);
  const serialized = serializeFR0103RequiredActions(state.requiredActions);

  assert.equal(payload.action, 7);
  assert(payload.subject_text && payload.subject_text.length <= 200);
  assert(payload.owner_text && payload.owner_text.length <= 60);
  assert(payload.required_actions_text && payload.required_actions_text.length > 0);
  assert.equal(serialized && serialized.length > 0, true);

  const responseData: FR0103ServerEntry = {
    id: 1,
    action: payload.action ?? null,
    subject_text: payload.subject_text ? `${payload.subject_text}   ` : null,
    date_registered: payload.date_registered ?? null,
    date_applied: payload.date_applied ?? null,
    owner_text: payload.owner_text ? `${payload.owner_text}   ` : null,
    required_actions_text: payload.required_actions_text ?? null,
    related_action_no_text: payload.related_action_no_text ? `${payload.related_action_no_text}   ` : null,
    notes_text: payload.notes_text ? `${payload.notes_text}   ` : null,
  };

  const response: FormEntryResponse<FR0103ServerEntry> = {
    form_type: "FR",
    form_code: "FR-01-03",
    form_title: "Test",
    data: responseData,
  };

  const restored = fr0103Adapter.toState(response);

  assert.equal(restored.actionId, "7");
  assert(restored.changeSubject.length <= 200);
  assert(restored.changeResponsible.length <= 60);
  assert.equal(restored.requiredActions.length, 1);
  const row = restored.requiredActions[0];
  assert(row.action.length <= 120);
  assert(row.responsible.length <= 60);
  assert(row.status.length <= 60);
});
