import { defaultOptions } from './defaults';
import type { ArrayFormat, KeyNotation, SerializeOptions } from './types';

export const isBlobLike = (value: unknown): value is Blob => {
  return typeof Blob !== 'undefined' && value instanceof Blob;
};

export const isFileLike = (value: unknown): value is File => {
  return typeof File !== 'undefined' && value instanceof File;
};

export const isDate = (value: unknown): value is Date => value instanceof Date;

export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Object.prototype.toString.call(value) === '[object Object]';
};

const isObjectLike = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};

export const mergeOptions = (options?: SerializeOptions): Required<SerializeOptions> => ({
  ...defaultOptions,
  ...options
});

export const buildKey = (
  parent: string,
  segment: string | number,
  notation: KeyNotation,
  isArraySegment = false,
  arrayFormat: ArrayFormat = 'indices'
): string => {
  if (!parent) {
    return String(segment);
  }

  if (notation === 'dot' && !isArraySegment) {
    return `${parent}.${String(segment)}`;
  }

  if (isArraySegment && arrayFormat === 'repeat') {
    return parent;
  }

  if (isArraySegment && arrayFormat === 'brackets') {
    return `${parent}[]`;
  }

  return `${parent}[${String(segment)}]`;
};

export const joinPath = (parentPath: string, segment: string | number, isArraySegment = false): string => {
  if (!parentPath) {
    return isArraySegment ? `[${String(segment)}]` : String(segment);
  }

  if (isArraySegment) {
    return `${parentPath}[${String(segment)}]`;
  }

  return `${parentPath}.${String(segment)}`;
};

export const assertDepth = (depth: number, maxDepth: number, path: string): void => {
  if (depth > maxDepth) {
    throw new RangeError(
      `Maximum serialization depth of ${maxDepth} exceeded at "${path || 'root'}".`
    );
  }
};

export const assertNotCircular = (value: unknown, path: string, inPath: WeakSet<object>): void => {
  if (!isObjectLike(value)) {
    return;
  }

  if (inPath.has(value)) {
    throw new TypeError(`Circular reference detected at "${path || 'root'}".`);
  }
};

const walkHasBinary = (
  value: unknown,
  path: string,
  depth: number,
  maxDepth: number,
  inPath: WeakSet<object>,
  memo: WeakMap<object, boolean>
): boolean => {
  assertDepth(depth, maxDepth, path);

  if (isFileLike(value) || isBlobLike(value)) {
    return true;
  }

  if (!isObjectLike(value)) {
    return false;
  }

  const cached = memo.get(value);
  if (cached !== undefined) {
    return cached;
  }

  assertNotCircular(value, path, inPath);
  inPath.add(value);

  let found = false;

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (walkHasBinary(value[index], joinPath(path, index, true), depth + 1, maxDepth, inPath, memo)) {
        found = true;
        break;
      }
    }
  } else {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (walkHasBinary(item, joinPath(path, key), depth + 1, maxDepth, inPath, memo)) {
        found = true;
        break;
      }
    }
  }

  inPath.delete(value);
  memo.set(value, found);
  return found;
};

export const hasBinary = (
  value: unknown,
  options: Pick<Required<SerializeOptions>, 'maxDepth'>
): boolean => {
  return walkHasBinary(value, 'root', 0, options.maxDepth, new WeakSet<object>(), new WeakMap());
};

export const normalizeScalar = (
  value: unknown,
  options: Required<SerializeOptions>
): string | Blob | File | null | undefined => {
  if (value === null) {
    return options.nulls === 'string' ? 'null' : null;
  }

  if (value === undefined) {
    return options.undefineds === 'string' ? 'undefined' : undefined;
  }

  if (isFileLike(value) || isBlobLike(value)) {
    return value;
  }

  if (isDate(value)) {
    return options.dateFormat === 'timestamp' ? String(value.getTime()) : value.toISOString();
  }

  if (typeof value === 'boolean') {
    return options.booleanFormat === 'number' ? (value ? '1' : '0') : String(value);
  }

  if (typeof value === 'bigint') {
    if (options.bigint === 'number') {
      return String(Number(value));
    }

    return value.toString();
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return String(value);
  }

  return undefined;
};
