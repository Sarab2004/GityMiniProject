import assert from "node:assert/strict";
import test from "node:test";

import {
  FR0110_INITIAL_STATE,
  type FR0110ServerEntry,
  fr0110Adapter,
} from "../../lib/formEntry/adapters/FR-01-10";
import type { FormEntryResponse } from "../../lib/formEntry";

test("fr0110Adapter trims and limits meeting data", () => {
  const state = {
    ...FR0110_INITIAL_STATE,
    projectId: "12",
    tbmNumber: "  TBM-1403-027-EXTRA  ",
    projectLocation: "  ???? ???? ?????  ",
    date: "2025-10-16",
    subject: "  ???????? ????? ??? ?? ??????  " + "*".repeat(200),
    instructor: "  ????? ???? HSE  ",
    notes: "  ??????? ??? ????? ??????  ".repeat(50),
    attendees: [
      {
        fullName: "  ??? ?????  ",
        role: "  ?????? ?????  ",
        signature: "  ???? ?????? ??  ",
      },
      {
        fullName: "  ",
        role: "  ???????  ",
        signature: "  ",
      },
    ],
  };

  const payload = fr0110Adapter.toPayload(state);

  assert.equal(payload.project, 12);
  assert.equal(payload.tbm_no, "TBM-1403-027-EXTRA".slice(0, 20));
  assert.equal(payload.location_text, "???? ???? ?????".slice(0, 120));
  assert(payload.topic_text && payload.topic_text.length <= 120);
  assert.equal(payload.trainer_text, "????? ???? HSE".slice(0, 60));
  assert(payload.notes_text && payload.notes_text.length <= 1000);

  const responseData: FR0110ServerEntry = {
    id: 5,
    tbm_no: payload.tbm_no ?? null,
    project: payload.project ?? null,
    date: payload.date ?? null,
    topic_text: payload.topic_text ?? null,
    trainer_text: payload.trainer_text ?? null,
    location_text: payload.location_text ?? null,
    notes_text: payload.notes_text ?? null,
    attendees: [
      {
        full_name: "  ???? ?????  ",
        role_text: "  ????  ",
        signature_text: "  ???? ??  ",
      },
      {
        full_name: "  ",
        role_text: null,
        signature_text: null,
      },
    ],
  };

  const response: FormEntryResponse<FR0110ServerEntry> = {
    form_type: "PR",
    form_code: "PR-01-07-01",
    form_title: "TBM",
    data: responseData,
  };

  const restored = fr0110Adapter.toState(response);

  assert.equal(restored.projectId, "12");
  assert.equal(restored.tbmNumber, payload.tbm_no ?? "");
  assert.equal(restored.projectLocation, payload.location_text ?? "");
  assert.equal(restored.subject, payload.topic_text ?? "");
  assert.equal(restored.instructor, payload.trainer_text ?? "");
  assert.equal(restored.notes, payload.notes_text ?? "");
  assert.equal(restored.attendees.length, 1);
  const attendee = restored.attendees[0];
  assert.equal(attendee.fullName, "???? ?????");
  assert.equal(attendee.role, "????");
  assert.equal(attendee.signature, "???? ??");
});
