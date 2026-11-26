---
name: fsd-slice
description: FSD 슬라이스(pages / widgets / features / entities)를 새로 만든다. 새 화면, 새 기능, 새 도메인 엔티티를 추가할 때 사용한다. 예) "주문 상세 페이지 만들어줘", "로그인 기능 추가", "user 엔티티 만들어"
---

# FSD 슬라이스 만들기

## 1. 계층 고르기

| 만들려는 것                                | 계층       | 예시                         |
| ------------------------------------------ | ---------- | ---------------------------- |
| 라우트 하나에 대응하는 화면                | `pages`    | `pages/order-detail`         |
| 여러 feature · entity 를 조합한 큰 UI 블록 | `widgets`  | `widgets/header`             |
| 사용자의 행동 하나 (동사)                  | `features` | `features/login`             |
| 비즈니스 도메인 객체 (명사)                | `entities` | `entities/user`              |
| 도메인과 무관한 것                         | `shared`   | 슬라이스가 아니라 세그먼트로 |

애매하면 **낮은 계층부터** 생각한다. 재사용될 여지가 없으면 굳이 쪼개지 말고 page 안에 둔다.

## 2. 폴더 만들기

슬라이스 이름은 kebab-case. 필요한 세그먼트만 만든다 (빈 폴더 금지).

```
src/<layer>/<slice>/
├── ui/       # 컴포넌트 (<name>.tsx, 테스트는 <name>.test.tsx 로 옆에)
├── model/    # zod 스키마 · 타입 · zustand 스토어 · 훅
├── api/      # 이 슬라이스 전용 백엔드 요청 (api-endpoint 스킬 참고)
├── lib/      # 슬라이스 전용 헬퍼
└── index.ts  # public API — 바깥에 공개할 것만 named export
```

## 3. 규칙 (ESLint 가 강제한다)

- 슬라이스 **바깥**은 `@/` 별칭 + public API 로만: `import { UserCard } from '@/entities/user'`
- 슬라이스 **안**은 상대 경로: `import { userSchema } from '../model/user'`
- 하위 계층만 import 가능: `app → pages → widgets → features → entities → shared`
- 같은 계층의 다른 슬라이스 import 금지. 필요하면 상위 계층에서 조합한다.
- 컴포넌트는 named export + 함수 선언 (`export function UserCard() {}`). default export 쓰지 않는다.

## 4. page 라면 라우트 연결

`src/app/router/app-router.tsx` 의 `children` 에 추가한다.

```tsx
{ path: 'orders/:orderId', element: <OrderDetailPage /> },
```

## 5. 마무리

- 컴포넌트에 최소 하나의 렌더링 테스트를 둔다 (`renderWithProviders` from `@/shared/lib/test`).
- `pnpm check` 통과 확인.
