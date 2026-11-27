# Safeflow Web

Vite + React + TypeScript 로 만든 웹 SPA. 구조는 **FSD(Feature-Sliced Design)** 를 따르고, 별도 백엔드(REST)와 연동합니다.

## 요구 사항

- Node.js 24 (`.nvmrc`)
- pnpm 12 (`corepack enable pnpm`)

## 시작하기

```bash
pnpm install
cp .env.example .env   # VITE_API_URL 을 백엔드 주소로
pnpm dev               # http://localhost:3000
```

## 스크립트

| 명령                 | 설명                                           |
| -------------------- | ---------------------------------------------- |
| `pnpm dev`           | 개발 서버                                      |
| `pnpm build`         | 프로덕션 빌드 (`dist/`)                        |
| `pnpm preview`       | 빌드 결과 미리보기                             |
| `pnpm check`         | typecheck + lint + test + format:check 한 번에 |
| `pnpm typecheck`     | `tsc --noEmit`                                 |
| `pnpm lint` / `:fix` | ESLint (FSD 의존 방향 규칙 포함)               |
| `pnpm test`          | Vitest + React Testing Library + MSW           |
| `pnpm test:coverage` | 커버리지                                       |
| `pnpm format`        | Prettier                                       |

## 구조

```
src/
├── app/        # 진입점 · providers · router · 전역 스타일
├── pages/      # 화면
├── widgets/    # 여러 기능을 조합한 큰 UI
├── features/   # 사용자 행동
├── entities/   # 도메인
└── shared/     # api · config · ui · lib · hooks
```

의존 방향은 `app → pages → widgets → features → entities → shared` 이며, ESLint 가 위반을 에러로 막습니다.
자세한 규칙은 [CLAUDE.md](./CLAUDE.md) 를 참고하세요.

## 브랜치

`feature/*` → `develop` → `main`. 작업은 `develop` 에서 브랜치를 따서 하고, 끝나면 `develop` 에 머지합니다.
배포할 때 `develop` 을 `main` 으로 올립니다.

## 품질 장치

- **pre-commit**: lint-staged 가 스테이징된 파일만 ESLint --fix + Prettier
- **CI** (`.github/workflows/ci.yml`): push / PR 마다 typecheck · lint · format · test · build
- **Claude Code 하네스** (`.claude/`): 편집 시 자동 lint, 종료 전 타입 검사 · 테스트, 민감 파일 보호,
  `fsd-slice` · `api-endpoint` 스킬, `fsd-reviewer` 에이전트
