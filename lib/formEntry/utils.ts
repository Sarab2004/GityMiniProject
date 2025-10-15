type KeyConverter = (key: string) => string;

const OBJECT_TAG = "[object Object]";

const camelCache = new Map<string, string>();
const snakeCache = new Map<string, string>();

const camelCase = (input: string): string => {
  if (camelCache.has(input)) {
    return camelCache.get(input)!;
  }
  const result = input.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
  camelCache.set(input, result);
  return result;
};

const snakeCase = (input: string): string => {
  if (snakeCache.has(input)) {
    return snakeCache.get(input)!;
  }
  const result = input
    .replace(/([A-Z])/g, "_$1")
    .replace(/-{1,}/g, "_")
    .toLowerCase()
    .replace(/^_+/, "");
  snakeCache.set(input, result);
  return result;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === OBJECT_TAG;

const convertKeys = (value: unknown, converter: KeyConverter): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => convertKeys(item, converter));
  }
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      result[converter(key)] = convertKeys(nested, converter);
    }
    return result;
  }
  return value;
};

export const toCamelCaseKeys = <T = unknown>(value: unknown): T =>
  convertKeys(value, camelCase) as T;

export const toSnakeCaseKeys = <T = unknown>(value: unknown): T =>
  convertKeys(value, snakeCase) as T;
