# Safeflow Web

<!-- TODO: 서비스가 무엇을 하는지, 주요 사용자와 핵심 기능을 2~3줄로 적어 주세요. -->

개인 프로젝트. **웹 전용 SPA**이고 별도 백엔드(REST)와 연동한다. 앱(React Native/Expo)은 만들지 않는다.

## 기술 스택

- **Vite 8 + React 19 + TypeScript 6** (strict, `noUncheckedIndexedAccess`)
- **라우팅**: React Router 8 (`createBrowserRouter`, `src/app/router/app-router.tsx`)
- **서버 상태**: TanStack Query 5 + axios (`@/shared/api` 의 `apiClient`)
- **클라이언트 상태**: zustand 5 — 서버 데이터는 절대 zustand 에 복사하지 않는다
- **폼 / 검증**: react-hook-form + zod 4 (`@hookform/resolvers/zod`)
- **테스트**: Vitest 5 + React Testing Library + MSW 3 (jsdom)
- **품질**: ESLint 10 (flat config) · Prettier · Husky + lint-staged · GitHub Actions CI
- 패키지 매니저는 **pnpm** 만 쓴다. npm / yarn 금지.

## 명령

```bash
pnpm dev            # 개발 서버 (http://localhost:3000)
pnpm dev:mock       # 백엔드 없이 목 데이터로 개발 서버 (아이디 fds_admin / crm_marketer, 비밀번호 아무 값)
pnpm check          # typecheck + lint + test + format:check — 작업을 마치기 전에 반드시 통과
pnpm test           # vitest run
pnpm test:watch
pnpm lint:fix
pnpm build
```

## 아키텍처: FSD (Feature-Sliced Design)

```
src/
├── app/        # 진입점(main.tsx) · providers · router · 전역 스타일
├── pages/      # 라우트 하나 = 슬라이스 하나
├── widgets/    # 여러 feature/entity 를 조합한 큰 UI
├── features/   # 사용자 행동 (login, create-order …)
├── entities/   # 도메인 (user, order …)
└── shared/     # 도메인 무관: api · config · ui · lib · hooks
```

**의존 방향**: `app → pages → widgets → features → entities → shared` (위에서 아래로만)

ESLint(`eslint.config.mjs` 의 `fsdLayerConfig`)가 다음을 **에러로** 막는다.

1. 하위 계층이 상위 계층을 import
2. 같은 계층의 다른 슬라이스를 import (`@/features/a` 안에서 `@/features/b`)
3. 슬라이스 내부로 직접 import (`@/entities/user/model/x` ✗ → `@/entities/user` ✓)

슬라이스 구조: `ui/ · model/ · api/ · lib/ · index.ts`(public API). 필요한 세그먼트만 만든다.
슬라이스 안에서는 상대 경로, 밖에서는 `@/` 별칭을 쓴다.

새 슬라이스를 만들 때는 `fsd-slice` 스킬, 백엔드 API 를 붙일 때는 `api-endpoint` 스킬을 따른다.

## 컨벤션

- 파일명 kebab-case (`user-card.tsx`), 컴포넌트는 PascalCase **named export + 함수 선언**. default export 금지.
- 백엔드 API 를 붙이거나 바꾸면 목 모드 핸들러(`src/app/mocks`)도 같이 맞춘다.
- 테스트는 대상 파일 옆에 `*.test.ts(x)`. 렌더링은 `renderWithProviders` (`@/shared/lib/test`).
- 백엔드 응답은 항상 zod 로 parse. query key 는 슬라이스의 key factory 로만 만든다.
- 타입 import 는 `import { type X }` (ESLint 가 자동 수정).
- 환경 변수는 `VITE_` 접두사만 번들에 들어간다. **비밀 값을 넣지 말 것.** 새 변수는
  `.env.example` 과 `src/shared/config/env.ts` 의 zod 스키마에 함께 추가한다.
- 주석·커밋 메시지·UI 문구는 한국어.

## 하네스 (자동으로 돌아가는 것)

`.claude/settings.json` 에 정의된 hook — 우회하지 말고 메시지대로 고친다.

| 시점             | 스크립트                           | 하는 일                                                  |
| ---------------- | ---------------------------------- | -------------------------------------------------------- |
| 파일 수정 **전** | `.claude/hooks/protect-files.mjs`  | `.env*`, `pnpm-lock.yaml`, `node_modules` 수정 차단      |
| 파일 수정 **후** | `.claude/hooks/lint-on-edit.mjs`   | ESLint --fix + Prettier. 남은 에러(FSD 위반 등)는 피드백 |
| 응답 **종료 전** | `.claude/hooks/verify-on-stop.mjs` | `.ts(x)` 변경이 있으면 tsc + 변경 관련 vitest            |

- `fsd-reviewer` 에이전트 리뷰는 **사용자가 요청할 때만** 돌린다(토큰 절약). 기본 검증은 `pnpm check` 와 PR 의 CI 다.
- 의존성 추가(`pnpm add`)는 사용자 확인을 받는다.

## 브랜치 전략

```
feature/* ──▶ develop ──▶ main
```

- `main`: 배포 브랜치. **`develop` 에서만** 머지해 올린다. 직접 커밋하지 않는다.
- `develop`: 개발 통합 브랜치. 기능 개발이 끝난 브랜치는 여기로 머지한다.
- 작업 브랜치는 항상 `develop` 에서 딴다. 이름: `feature/<기능>` · `fix/<버그>` · `refactor/<대상>` · `chore/<작업>` (kebab-case)
- 작업 브랜치 → `develop` 은 PR(또는 `--no-ff` 머지). 기능 개발이 끝나면 `develop` → `main` 으로 올린다.

## 커밋 · PR

- 커밋은 사용자가 요청할 때만. 메시지는 `feat: …` / `fix: …` / `refactor: …` / `style: …` / `chore: …` / `test: …` / `docs: …`.
- **한 번에 커밋할 작업은 3개의 커밋으로 쪼갠다.** 리뷰 · 되돌리기가 쉽도록 논리 단위로 나눈다.
  예) ① 설정 · 의존성 / 타입 · 스키마 → ② 구현 → ③ 테스트 · 문서. 커밋마다 `pnpm check` 가 통과하는 순서를 우선한다.
- PR 본문은 `.github/pull_request_template.md` 양식을 채운다.
