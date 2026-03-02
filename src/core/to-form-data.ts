import {
  assertDepth,
  assertNotCircular,
  buildKey,
  isPlainObject,
  joinPath,
  mergeOptions,
  normalizeScalar
} from './helpers';
import type { SerializeOptions } from './types';

const appendValue = (
  target: FormData,
  key: string,
  value: unknown,
  options: Required<SerializeOptions>
): void => {
  const normalized = normalizeScalar(value, options);

  if (normalized === undefined || normalized === null) {
    return;
  }

  target.append(key, normalized);
};

const walk = (
  input: unknown,
  target: FormData,
  options: Required<SerializeOptions>,
  parentKey = '',
  path = 'root',
  depth = 0,
  inPath = new WeakSet<object>()
): void => {
  assertDepth(depth, options.maxDepth, path);

  if (Array.isArray(input)) {
    assertNotCircular(input, path, inPath);
    inPath.add(input);

    input.forEach((item, index) => {
      const key = buildKey(parentKey, index, options.keyNotation, true, options.arrayFormat);
      const childPath = joinPath(path, index, true);

      if (Array.isArray(item) || isPlainObject(item)) {
        walk(item, target, options, key, childPath, depth + 1, inPath);
        return;
      }

      appendValue(target, key, item, options);
    });

    inPath.delete(input);
    return;
  }

  if (isPlainObject(input)) {
    assertNotCircular(input, path, inPath);
    inPath.add(input);

    Object.entries(input).forEach(([key, value]) => {
      const childKey = buildKey(parentKey, key, options.keyNotation);
      const childPath = joinPath(path, key);

      if (Array.isArray(value) || isPlainObject(value)) {
        walk(value, target, options, childKey, childPath, depth + 1, inPath);
        return;
      }

      appendValue(target, childKey, value, options);
    });

    inPath.delete(input);
    return;
  }

  if (parentKey) {
    appendValue(target, parentKey, input, options);
  }
};

export const toFormData = (
  input: unknown,
  formData = new FormData(),
  options?: SerializeOptions
): FormData => {
  const merged = mergeOptions(options);
  walk(input, formData, merged);
  return formData;
};
