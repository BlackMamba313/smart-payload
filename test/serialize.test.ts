import { describe, expect, it, vi } from 'vitest';
import { attachAxiosSerializer, serializeAxiosConfig } from '../src/adapters/axios';
import { createSerializedFetch } from '../src/adapters/fetch';
import { detectPayloadType, serialize, toFormData, toJsonPayload, toSearchParams } from '../src';

describe('core serialization', () => {
  it('uses json in auto mode when no binary data', () => {
    const result = serialize({ user: { name: 'Aleksej' }, active: true });

    expect(result.payloadType).toBe('json');
    expect(result.contentType).toBe('application/json');
    expect(result.body).toBe('{"user":{"name":"Aleksej"},"active":true}');
  });

  it('uses form-data in auto mode when binary data exists', () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    const result = serialize({ file, nested: { title: 'Doc' } });

    expect(result.payloadType).toBe('form-data');
    expect(result.contentType).toBeNull();
    expect(result.body).toBeInstanceOf(FormData);
  });

  it('supports form-data brackets strategy', () => {
    const fd = toFormData(
      { tags: ['a', 'b'] },
      new FormData(),
      { arrayFormat: 'brackets', mode: 'form-data' }
    );

    expect(fd.getAll('tags[]')).toEqual(['a', 'b']);
  });

  it('supports dot notation in URLSearchParams', () => {
    const params = toSearchParams(
      { user: { name: 'Aleksej', age: 30 } },
      { mode: 'search-params', keyNotation: 'dot' }
    );

    expect(params.get('user.name')).toBe('Aleksej');
    expect(params.get('user.age')).toBe('30');
  });

  it('serializes date, boolean, bigint, null and undefined options for JSON', () => {
    const payload = toJsonPayload(
      {
        date: new Date('2025-01-01T00:00:00.000Z'),
        active: true,
        amount: 10n,
        empty: null,
        maybe: undefined
      },
      {
        dateFormat: 'timestamp',
        booleanFormat: 'number',
        bigint: 'string',
        nulls: 'string',
        undefineds: 'string'
      }
    );

    expect(payload).toBe('{"date":1735689600000,"active":1,"amount":"10","empty":"null","maybe":"undefined"}');
  });

  it('throws when URLSearchParams payload contains binary values', () => {
    expect(() => {
      toSearchParams(
        {
          file: new File(['x'], 'a.txt')
        },
        { mode: 'search-params' }
      );
    }).toThrow(/cannot be serialized to URLSearchParams/i);
  });

  it('detectPayloadType respects explicit mode', () => {
    const type = detectPayloadType({ file: new File(['x'], 'x.txt') }, { mode: 'json' });
    expect(type).toBe('json');
  });

  it('throws explicit error for circular references', () => {
    const payload: Record<string, unknown> = { name: 'cycle' };
    payload.self = payload;

    expect(() => serialize(payload, { mode: 'json' })).toThrow(/Circular reference detected/i);
  });

  it('allows reused references that are not circular', () => {
    const shared = { label: 'ok' };
    const result = serialize({ a: shared, b: shared }, { mode: 'json' });

    expect(result.payloadType).toBe('json');
    expect(result.body).toBe('{"a":{"label":"ok"},"b":{"label":"ok"}}');
  });

  it('enforces maxDepth limit', () => {
    expect(() => {
      toJsonPayload({ a: { b: { c: 1 } } }, { maxDepth: 1 });
    }).toThrow(/Maximum serialization depth/i);
  });
});

describe('fetch adapter', () => {
  it('injects serialized body and content-type', async () => {
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];

    const mockFetch: typeof fetch = async (input, init) => {
      calls.push({ input, init });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };

    const sf = createSerializedFetch(mockFetch, { mode: 'json' });

    await sf('https://example.com/test', {
      method: 'POST',
      data: { foo: 'bar' }
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].init?.body).toBe('{"foo":"bar"}');
    expect((calls[0].init?.headers as Headers).get('Content-Type')).toBe('application/json');
  });
});

describe('axios adapter', () => {
  it('serializeAxiosConfig serializes json body and sets content-type', () => {
    const config = serializeAxiosConfig({ method: 'post', data: { foo: 'bar' } }, { mode: 'json' });

    expect(config.data).toBe('{"foo":"bar"}');
    expect((config.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('serializeAxiosConfig does not override existing content-type', () => {
    const config = serializeAxiosConfig(
      {
        method: 'post',
        data: { foo: 'bar' },
        headers: { 'Content-Type': 'application/custom' }
      },
      { mode: 'json' }
    );

    expect((config.headers as Record<string, string>)['Content-Type']).toBe('application/custom');
  });

  it('attachAxiosSerializer registers and ejects interceptor', async () => {
    let interceptor: ((config: any) => any) | undefined;
    const eject = vi.fn();

    const instance: any = {
      interceptors: {
        request: {
          use(fn: (config: any) => any) {
            interceptor = fn;
            return 42;
          },
          eject
        }
      }
    };

    const detach = attachAxiosSerializer(instance, { mode: 'json' });
    const nextConfig = await interceptor?.({ method: 'post', data: { ok: true } });

    expect(nextConfig.data).toBe('{"ok":true}');
    expect((nextConfig.headers as Record<string, string>)['Content-Type']).toBe('application/json');

    detach();
    expect(eject).toHaveBeenCalledWith(42);
  });
});
