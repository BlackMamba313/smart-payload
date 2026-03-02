import { serialize } from '../core/serialize';
import type { SerializeOptions } from '../core/types';

export interface SerializedFetchInit extends RequestInit {
  data?: unknown;
  serializer?: SerializeOptions;
}

const normalizeHeaders = (headers?: HeadersInit): Headers => {
  if (headers instanceof Headers) {
    return headers;
  }

  return new Headers(headers ?? {});
};

export const createSerializedFetch = (
  impl: typeof fetch = fetch,
  baseOptions?: SerializeOptions
) => {
  return async (input: RequestInfo | URL, init: SerializedFetchInit = {}): Promise<Response> => {
    const { data, serializer, headers, body, ...rest } = init;

    if (data === undefined) {
      return impl(input, { ...rest, headers, body });
    }

    const result = serialize(data, { ...baseOptions, ...serializer });
    const mergedHeaders = normalizeHeaders(headers);

    if (result.contentType && !mergedHeaders.has('Content-Type')) {
      mergedHeaders.set('Content-Type', result.contentType);
    }

    return impl(input, {
      ...rest,
      headers: mergedHeaders,
      body: result.body
    });
  };
};

export const serializedFetch = createSerializedFetch(fetch);
