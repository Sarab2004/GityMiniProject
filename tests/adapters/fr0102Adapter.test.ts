import assert from "node:assert/strict";
import test from "node:test";

import {
  FR0102_INITIAL_STATE,
  type FR0102ServerEntry,
  fr0102Adapter,
} from "../../lib/formEntry/adapters/FR-01-02";
import type { FormEntryResponse } from "../../lib/formEntry";

test("fr0102Adapter sanitizes payload and restores state", () => {
  const state = {
    ...FR0102_INITIAL_STATE,
    actionId: "42",
    issueDesc: "  شرح مسئله" + " طولانی".repeat(100),
    actionDesc: "اقدام اصلاحی" + " بسیار".repeat(100),
    actionSource: "  AUDIT  ",
    executor: "  کارشناس  ",
    deadline: "2025-10-20",
    reviewDate1: "2025-10-21",
    reviewDate2: "",
    reviewDate3: "2025-10-25",
    resolutionStatus: "resolved" as const,
    isKnowledge: "yes" as const,
    isEffective: "effective" as const,
    newActionNumber: "  NEW-000000000000000123  ",
  };

  const payload = fr0102Adapter.toPayload(state);

  const expectedNewAction = "NEW-000000000000000123".slice(0, 20);
  assert.equal(payload.action, 42);
  assert(payload.issue_desc && payload.issue_desc.length <= 400);
  assert(payload.action_desc && payload.action_desc.length <= 400);
  assert.equal(payload.source, "AUDIT");
  assert.equal(payload.executor_text, "کارشناس");
  assert.equal(payload.new_action_indicator, expectedNewAction);

  const serverIssue = `${payload.issue_desc ?? "شرح پایه"}   `;
  const serverAction = `${payload.action_desc ?? "اقدام پایه"}   `;
  const serverNewAction = `${expectedNewAction}   `;

  const responseData: FR0102ServerEntry = {
    action: Number(payload.action),
    issue_desc: serverIssue,
    action_desc: serverAction,
    source: "  LEGAL  ",
    executor_text: "  ناظر  ",
    due_date: payload.due_date ?? "2025-10-20",
    review_date_1: payload.review_date_1 ?? "2025-10-21",
    review_date_2: null,
    review_date_3: payload.review_date_3 ?? "2025-10-25",
    resolved: true,
    is_knowledge: false,
    effective: true,
    new_action_indicator: serverNewAction,
  };

  const response: FormEntryResponse<FR0102ServerEntry> = {
    form_type: "FR",
    form_code: "FR-01-02",
    form_title: "Test",
    data: responseData,
  };

  const restored = fr0102Adapter.toState(response);

  assert.equal(restored.actionId, "42");
  assert(restored.issueDesc.length <= 400);
  assert(restored.actionDesc.length <= 400);
  assert.equal(restored.actionSource, "LEGAL");
  assert.equal(restored.executor, "ناظر");
  assert(restored.newActionNumber.length <= 20);
});
