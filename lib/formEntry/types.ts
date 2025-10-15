export interface FormEntryResponse<TData = Record<string, unknown>> {
  form_type: string;
  form_code: string;
  form_title: string;
  data: TData;
}

export interface FormEntryAdapter<TServer, TState> {
  formCode: string;
  toState(entry: FormEntryResponse<TServer>): TState;
  toPayload(state: TState): Partial<TServer>;
}

export type AnyFormEntryAdapter = FormEntryAdapter<Record<string, unknown>, unknown>;
