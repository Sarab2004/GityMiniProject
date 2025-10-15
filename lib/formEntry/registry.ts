import type { AnyFormEntryAdapter } from "./types";

const registry = new Map<string, AnyFormEntryAdapter>();

export function registerFormEntryAdapter(adapter: AnyFormEntryAdapter): void {
  registry.set(adapter.formCode, adapter);
}

export function getFormEntryAdapter(formCode: string): AnyFormEntryAdapter | undefined {
  return registry.get(formCode);
}

export function requireFormEntryAdapter(formCode: string): AnyFormEntryAdapter {
  const adapter = getFormEntryAdapter(formCode);
  if (!adapter) {
    throw new Error(`Form entry adapter not found for form code "${formCode}".`);
  }
  return adapter;
}

export function listRegisteredAdapters(): string[] {
  return Array.from(registry.keys());
}
