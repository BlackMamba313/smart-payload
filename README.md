# smart-payload

**Keywords:** `formdata` `serializer` `payload` `fetch` `axios` `typescript` `json` `urlsearchparams` `file-upload` `frontend` `request-body` `api-client`

Framework-agnostic payload serializer for frontend apps.

`smart-payload` converts plain JavaScript objects into the right HTTP request body format:
- `JSON` string
- `FormData`
- `URLSearchParams`

It removes manual serialization boilerplate and gives consistent behavior across projects.

## What It Does

`smart-payload` returns ready-to-send request data:
- `body`: serialized payload
- `payloadType`: `json` | `form-data` | `search-params`
- `contentType`: proper content type (or `null` for `FormData`)

Auto mode:
- Contains `File`/`Blob` -> `FormData`
- Otherwise -> `JSON`

## Install

```bash
npm i smart-payload
```

## Quick Start

```ts
import { serialize } from 'smart-payload';

const payload = {
  user: { name: 'Aleksej', age: 27 },
  tags: ['frontend', 'typescript'],
  avatar: new File(['hello'], 'avatar.txt', { type: 'text/plain' })
};

const result = serialize(payload, { mode: 'auto' });

await fetch('/api/profile', {
  method: 'POST',
  body: result.body,
  headers: result.contentType ? { 'Content-Type': result.contentType } : undefined
});
```

## Notation Guide

`keyNotation: 'bracket'` is usually best for PHP/Laravel/Rails-style backends.

```ts
serialize({ user: { name: 'Aleksej' } }, { mode: 'search-params', keyNotation: 'bracket' });
// user[name]=Aleksej
```

`keyNotation: 'dot'` is often better for Node/Nest custom parsers and analytics filters.

```ts
serialize({ user: { name: 'Aleksej' } }, { mode: 'search-params', keyNotation: 'dot' });
// user.name=Aleksej
```

## Array Formats

```ts
serialize({ tags: ['a', 'b'] }, { mode: 'search-params', arrayFormat: 'indices' });
// tags[0]=a&tags[1]=b

serialize({ tags: ['a', 'b'] }, { mode: 'search-params', arrayFormat: 'brackets' });
// tags[]=a&tags[]=b

serialize({ tags: ['a', 'b'] }, { mode: 'search-params', arrayFormat: 'repeat' });
// tags=a&tags=b
```

## All Options Example

```ts
import { serialize } from 'smart-payload';

const result = serialize(
  {
    enabled: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    amount: 10n,
    empty: null,
    missing: undefined
  },
  {
    mode: 'json',
    keyNotation: 'bracket',
    arrayFormat: 'indices',
    dateFormat: 'timestamp',
    booleanFormat: 'number',
    nulls: 'string',
    undefineds: 'string',
    bigint: 'string',
    maxDepth: 40
  }
);
```

## Edge Cases

- Circular references are rejected with a clear error.
- Very deep payloads are limited by `maxDepth` (default `40`).
- Binary values (`File`/`Blob`) are rejected in `search-params` mode.

```ts
const obj: any = { name: 'x' };
obj.self = obj;
serialize(obj, { mode: 'json' });
// throws: Circular reference detected
```

## fetch Adapter

```ts
import { createSerializedFetch } from 'smart-payload/fetch';

const sf = createSerializedFetch(fetch, { mode: 'auto' });

await sf('/api/upload', {
  method: 'POST',
  data: {
    title: 'My file',
    file: new File(['hello'], 'hello.txt')
  }
});
```

## axios Adapter

```ts
import axios from 'axios';
import { attachAxiosSerializer } from 'smart-payload/axios';

const api = axios.create({ baseURL: '/api' });
const detach = attachAxiosSerializer(api, { mode: 'auto' });

await api.post('/users', { name: 'Aleksej' });

// detach when needed
// detach();
```

## API

- `serialize(data, options)`
- `detectPayloadType(data, options)`
- `toFormData(data, formData?, options?)`
- `toSearchParams(data, options?)`
- `toJsonPayload(data, options?)`
- `createSerializedFetch(fetchImpl?, options?)`
- `serializedFetch`
- `serializeAxiosConfig(config, options?)`
- `attachAxiosSerializer(instance, options?)`

## Options

```ts
type SerializeOptions = {
  mode?: 'auto' | 'json' | 'form-data' | 'search-params';
  keyNotation?: 'bracket' | 'dot';
  arrayFormat?: 'indices' | 'brackets' | 'repeat';
  dateFormat?: 'iso' | 'timestamp';
  booleanFormat?: 'string' | 'number';
  nulls?: 'omit' | 'string';
  undefineds?: 'omit' | 'string';
  bigint?: 'string' | 'number';
  maxDepth?: number;
};
```

## Option Examples

### mode

```ts
serialize({ page: 1 }, { mode: 'json' });
serialize({ file: new File(['x'], 'a.txt') }, { mode: 'form-data' });
serialize({ q: 'books' }, { mode: 'search-params' });
serialize({ file: new File(['x'], 'a.txt') }, { mode: 'auto' }); // auto -> form-data
```

### keyNotation

```ts
serialize({ user: { name: 'Aleksej' } }, { mode: 'search-params', keyNotation: 'bracket' });
// user[name]=Aleksej

serialize({ user: { name: 'Aleksej' } }, { mode: 'search-params', keyNotation: 'dot' });
// user.name=Aleksej
```

### arrayFormat

```ts
serialize({ tags: ['a', 'b'] }, { mode: 'search-params', arrayFormat: 'indices' });
// tags[0]=a&tags[1]=b

serialize({ tags: ['a', 'b'] }, { mode: 'search-params', arrayFormat: 'brackets' });
// tags[]=a&tags[]=b

serialize({ tags: ['a', 'b'] }, { mode: 'search-params', arrayFormat: 'repeat' });
// tags=a&tags=b
```

### dateFormat

```ts
serialize({ createdAt: new Date('2025-01-01T00:00:00.000Z') }, { mode: 'json', dateFormat: 'iso' });
// {"createdAt":"2025-01-01T00:00:00.000Z"}

serialize({ createdAt: new Date('2025-01-01T00:00:00.000Z') }, { mode: 'json', dateFormat: 'timestamp' });
// {"createdAt":1735689600000}
```

### booleanFormat

```ts
serialize({ active: true }, { mode: 'json', booleanFormat: 'string' });
// {"active":true}

serialize({ active: true }, { mode: 'search-params', booleanFormat: 'number' });
// active=1
```

### nulls

```ts
serialize({ optional: null }, { mode: 'json', nulls: 'omit' });
// {}

serialize({ optional: null }, { mode: 'json', nulls: 'string' });
// {"optional":"null"}
```

### undefineds

```ts
serialize({ maybe: undefined, a: 1 }, { mode: 'json', undefineds: 'omit' });
// {"a":1}

serialize({ maybe: undefined, a: 1 }, { mode: 'json', undefineds: 'string' });
// {"maybe":"undefined","a":1}
```

### bigint

```ts
serialize({ amount: 10n }, { mode: 'json', bigint: 'string' });
// {"amount":"10"}

serialize({ amount: 10n }, { mode: 'json', bigint: 'number' });
// {"amount":10}
```

### maxDepth

```ts
serialize({ a: { b: { c: 1 } } }, { mode: 'json', maxDepth: 1 });
// throws RangeError: Maximum serialization depth exceeded
```

## Migration Guide

### From manual `FormData.append(...)`

Before:

```ts
const fd = new FormData();
fd.append('user[name]', data.user.name);
fd.append('file', data.file);
```

After:

```ts
const result = serialize(data, { mode: 'auto' });
await fetch('/api', { method: 'POST', body: result.body });
```

### From `object-to-formdata`

- Replace direct converter calls with `serialize(data, { mode: 'form-data' })`
- If you also send non-file requests, switch to `mode: 'auto'`
- Keep backend key behavior with `keyNotation` + `arrayFormat`

## Development

```bash
npm run typecheck
npm run test
npm run build
```

## Publish

```bash
npm publish
```

## License

MIT
