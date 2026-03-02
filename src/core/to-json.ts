import { assertDepth, assertNotCircular, isDate, isPlainObject, joinPath, mergeOptions } from './helpers';
import type { SerializeOptions } from './types';

const normalize = (
  value: unknown,
  options: Required<SerializeOptions>,
  path = 'root',
  depth = 0,
  inPath = new WeakSet<object>()
): unknown => {
  assertDepth(depth, options.maxDepth, path);

  if (value === undefined) {
    return options.undefineds === 'string' ? 'undefined' : undefined;
  }

  if (value === null) {
    return options.nulls === 'string' ? 'null' : null;
  }

  if (typeof value === 'bigint') {
    if (options.bigint === 'number') {
      return Number(value);
    }

    return value.toString();
  }

  if (isDate(value)) {
    return options.dateFormat === 'timestamp' ? value.getTime() : value.toISOString();
  }

  if (typeof value === 'boolean' && options.booleanFormat === 'number') {
    return value ? 1 : 0;
  }

  if (Array.isArray(value)) {
    assertNotCircular(value, path, inPath);
    inPath.add(value);

    const out = value
      .map((item, index) => normalize(item, options, joinPath(path, index, true), depth + 1, inPath))
      .filter((item) => item !== undefined);

    inPath.delete(value);
    return out;
  }

  if (isPlainObject(value)) {
    assertNotCircular(value, path, inPath);
    inPath.add(value);

    const out: Record<string, unknown> = {};

    Object.entries(value).forEach(([key, item]) => {
      const normalized = normalize(item, options, joinPath(path, key), depth + 1, inPath);
      if (normalized !== undefined) {
        out[key] = normalized;
      }
    });

    inPath.delete(value);
    return out;
  }

  return value;
};

export const toJsonPayload = (input: unknown, options?: SerializeOptions): string => {
  const merged = mergeOptions(options);
  return JSON.stringify(normalize(input, merged));
};
