import { hasBinary, mergeOptions } from './helpers';
import { toFormData } from './to-form-data';
import { toJsonPayload } from './to-json';
import { toSearchParams } from './to-search-params';
import type { PayloadType, SerializeOptions, SerializeResult } from './types';

export const detectPayloadType = (data: unknown, options?: SerializeOptions): PayloadType => {
  const merged = mergeOptions(options);

  if (merged.mode !== 'auto') {
    return merged.mode;
  }

  return hasBinary(data, merged) ? 'form-data' : 'json';
};

export const serialize = (data: unknown, options?: SerializeOptions): SerializeResult => {
  const payloadType = detectPayloadType(data, options);
  const merged = mergeOptions(options);

  if (payloadType === 'form-data') {
    return {
      body: toFormData(data, new FormData(), merged),
      payloadType,
      contentType: null
    };
  }

  if (payloadType === 'search-params') {
    return {
      body: toSearchParams(data, merged),
      payloadType,
      contentType: 'application/x-www-form-urlencoded;charset=UTF-8'
    };
  }

  return {
    body: toJsonPayload(data, merged),
    payloadType,
    contentType: 'application/json'
  };
};
