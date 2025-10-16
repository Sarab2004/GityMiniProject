import assert from "node:assert/strict";
import test from "node:test";

import {
  FR0112_INITIAL_STATE,
  type FR0112ServerEntry,
  fr0112Adapter,
} from "../../lib/formEntry/adapters/FR-01-12";
import type { FormEntryResponse } from "../../lib/formEntry/types";

test("fr0112Adapter.toState trims and clamps member contact info", () => {
  const longContact = `0${"9".repeat(90)}`;
  const response: FormEntryResponse<FR0112ServerEntry> = {
    form_type: "team",
    form_code: "FR-01-12",
    form_title: "تشکیل تیم همیاران HSE",
    data: {
      id: 12,
      project: 7,
      prepared_by_name: "  مهندس علی   ",
      approved_by_name: "  مدیر پروژه ارشد   ",
      members: [
        {
          id: 1,
          contractor: 5,
          unit: 9,
          section: 3,
          representative_name: "  علی رضایی  ",
          contact_info: `  ${longContact}`,
          signature_text: "  امضا  ",
          tbm_no: "  TBM-1403-027  ",
        },
      ],
    },
  };

  const state = fr0112Adapter.toState(response);
  assert.equal(state.preparer, "مهندس علی");
  assert.equal(state.approver, "مدیر پروژه ارشد");
  assert.equal(state.teamMembers.length, 1);
  const member = state.teamMembers[0];
  assert.equal(member.fullName, "علی رضایی");
  assert.equal(member.signature, "امضا");
  assert.equal(member.tbmNumber, "TBM-1403-027");
  assert.equal(member.contactInfo.length, 80);
  assert.ok(member.contactInfo.startsWith("09"));
});

test("fr0112Adapter.toPayload trims top-level fields and keeps numeric project id", () => {
  const state = {
    ...FR0112_INITIAL_STATE,
    projectId: "15",
    preparer: `  ${"نام خیلی طولانی".repeat(6)}`,
    approver: "   ",
    teamMembers: [
      {
        contractor: "",
        unit: "",
        section: "",
        fullName: "عضو نمونه",
        contactInfo: "",
        signature: "",
        tbmNumber: "",
      },
    ],
  };

  const payload = fr0112Adapter.toPayload(state);
  assert.equal(payload.project, 15);
  assert.ok(payload.prepared_by_name);
  assert.ok((payload.prepared_by_name as string).length <= 60);
  assert.equal(payload.approved_by_name, null);
});
