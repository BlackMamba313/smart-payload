export type Mode = 'auto' | 'json' | 'form-data' | 'search-params';

export type PayloadType = Exclude<Mode, 'auto'>;

export type KeyNotation = 'bracket' | 'dot';

export type ArrayFormat = 'indices' | 'brackets' | 'repeat';

export interface SerializeOptions {
  mode?: Mode;
  keyNotation?: KeyNotation;
  arrayFormat?: ArrayFormat;
  dateFormat?: 'iso' | 'timestamp';
  booleanFormat?: 'string' | 'number';
  nulls?: 'omit' | 'string';
  undefineds?: 'omit' | 'string';
  bigint?: 'string' | 'number';
  maxDepth?: number;
}

export interface SerializeResult {
  body: string | FormData | URLSearchParams;
  payloadType: PayloadType;
  contentType: string | null;
}
