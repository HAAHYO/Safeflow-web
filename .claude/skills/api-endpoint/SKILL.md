---
name: api-endpoint
description: 백엔드 API 엔드포인트를 연동한다 (zod 응답 스키마, 요청 함수, TanStack Query 훅, MSW 테스트까지). 새 API 를 붙이거나 기존 API 를 수정할 때 사용한다. 예) "GET /users/me 연동해줘", "주문 생성 API 붙여줘"
---

# 백엔드 엔드포인트 연동

시작 전에 사용자에게 확인할 것: **메서드 · 경로 · 요청 바디 · 응답 JSON 예시**. 모르면 추측하지 말고 물어본다.

## 어디에 두나

- 조회(GET) — 도메인 데이터 → `entities/<entity>/api`
- 변경(POST/PUT/PATCH/DELETE) — 사용자 행동 → `features/<feature>/api`
- 응답 스키마 · 타입 → 해당 슬라이스의 `model/`

## 1. 스키마 (model)

```ts
// entities/user/model/user.ts
import { z } from 'zod';

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
});

export type User = z.infer<typeof userSchema>;
```

## 2. 요청 함수 + query options (api)

응답은 **반드시 zod 로 parse** 한다. 백엔드 스펙이 바뀌면 여기서 바로 드러난다.

```ts
// entities/user/api/user-api.ts
import { queryOptions } from '@tanstack/react-query';

import { apiClient } from '@/shared/api';

import { userSchema } from '../model/user';

export const userKeys = {
  all: ['user'] as const,
  me: () => [...userKeys.all, 'me'] as const,
};

export async function fetchMe() {
  const { data } = await apiClient.get('/users/me');
  return userSchema.parse(data);
}

export const meQueryOptions = () => queryOptions({ queryKey: userKeys.me(), queryFn: fetchMe });
```

- 컴포넌트에서는 `useQuery(meQueryOptions())`. 래퍼 훅이 꼭 필요할 때만 `model/` 에 `useMe` 를 만든다.
- 변경 요청은 `features/*/api` 에 요청 함수, `features/*/model` 에 `useMutation` 훅을 두고
  `onSuccess` 에서 `queryClient.invalidateQueries({ queryKey: userKeys.all })` 로 무효화한다.
- query key 는 반드시 key factory(`userKeys`)로만 만든다. 문자열 배열을 직접 쓰지 않는다.

## 3. public API

```ts
// entities/user/index.ts
export { fetchMe, meQueryOptions, userKeys } from './api/user-api';
export { type User, userSchema } from './model/user';
```

## 4. 테스트 (MSW)

실제 백엔드에 요청하지 않는다. 처리되지 않은 요청은 테스트를 실패시키도록 설정되어 있다.

```ts
// entities/user/api/user-api.test.ts
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/shared/lib/test';

import { fetchMe } from './user-api';

const API = 'http://localhost:8080';

describe('fetchMe', () => {
  it('응답을 스키마로 파싱한다', async () => {
    server.use(
      http.get(`${API}/users/me`, () =>
        HttpResponse.json({ id: 1, name: '홍길동', email: 'a@b.com' }),
      ),
    );
    await expect(fetchMe()).resolves.toEqual({ id: 1, name: '홍길동', email: 'a@b.com' });
  });

  it('스키마에 맞지 않으면 실패한다', async () => {
    server.use(http.get(`${API}/users/me`, () => HttpResponse.json({ id: '1' })));
    await expect(fetchMe()).rejects.toThrow();
  });
});
```

## 5. 마무리

`pnpm check` 통과 확인.
