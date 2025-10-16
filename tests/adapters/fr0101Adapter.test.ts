import assert from "node:assert/strict";
import test from "node:test";

import {
  FR0101_INITIAL_STATE,
  type FR0101ServerEntry,
  fr0101Adapter,
  sanitizeAffectedDocuments,
} from "../../lib/formEntry/adapters/FR-01-01";
import type { FormEntryResponse } from "../../lib/formEntry/types";

test("sanitizeAffectedDocuments enforces limits and reports warnings", () => {
  const input = [
    "  سند اول  ",
    "سند دوم",
    "سند دوم",
    `سند خیلی طولانی ${"x".repeat(70)}`,
  ];

  const result = sanitizeAffectedDocuments(input);

  assert.deepEqual(result.items, ["سند اول", "سند دوم"]);
  assert.ok(
    result.warnings.some((message) => message.includes("تکراری")),
    "should warn about duplicates"
  );
  assert.ok(
    result.warnings.some((message) => message.includes("حداکثر 60")),
    "should warn about excessive length"
  );
});

test("fr0101Adapter round-trips affectedDocuments through payload/state", () => {
  const state = {
    ...FR0101_INITIAL_STATE,
    projectId: "42",
    requesterName: "کاربر تست",
    requesterUnit: "واحد تست",
    date: "2025-10-16",
    requestType: "corrective" as const,
    actionSource: ["audit"],
    nonConformityDescription: "شرح نمونه",
    rootCauseObjective: "هدف نمونه",
    riskAssessmentUpdate: "yes",
    riskAssessmentDate: "2025-10-20",
    newKnowledgeExperience: "no",
    affectedDocuments: [" سند اول ", "سند دوم", "سند دوم"],
  };

  const payload = fr0101Adapter.toPayload(state);

  assert.deepEqual(payload.affected_documents, ["سند اول", "سند دوم"]);

  const responseData: FR0101ServerEntry = {
    id: 1,
    indicator: "FR-01-01-001",
    project: Number(state.projectId),
    requester_name: payload.requester_name ?? null,
    requester_unit_text: payload.requester_unit_text ?? null,
    request_date: payload.request_date ?? null,
    request_type: payload.request_type ?? null,
    sources: payload.sources ?? [],
    nonconformity_or_change_desc: payload.nonconformity_or_change_desc ?? null,
    root_cause_or_goal_desc: payload.root_cause_or_goal_desc ?? null,
    affected_documents: payload.affected_documents ?? [],
    needs_risk_update: true,
    risk_update_date: payload.risk_update_date ?? null,
    creates_knowledge: false,
    approved_by_performer_name: payload.approved_by_performer_name ?? null,
    approved_by_manager_name: payload.approved_by_manager_name ?? null,
    exec1_approved: null,
    exec1_note: null,
    exec1_new_date: null,
    exec2_approved: null,
    exec2_note: null,
    exec2_new_date: null,
    effectiveness_checked_at: null,
    effectiveness_method_text: null,
    effective: null,
    new_action_indicator: null,
    items: [],
  };

  const response: FormEntryResponse<FR0101ServerEntry> = {
    form_type: "FR",
    form_code: "FR-01-01",
    form_title: "Test",
    data: responseData,
  };

  const roundTripped = fr0101Adapter.toState(response);

  assert.deepEqual(roundTripped.affectedDocuments, ["سند اول", "سند دوم"]);
});
