import type { SerializeOptions } from './types';

export const defaultOptions: Required<SerializeOptions> = {
  mode: 'auto',
  keyNotation: 'bracket',
  arrayFormat: 'indices',
  dateFormat: 'iso',
  booleanFormat: 'string',
  nulls: 'omit',
  undefineds: 'omit',
  bigint: 'string',
  maxDepth: 40
};
