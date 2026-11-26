// PostToolUse(Edit|Write|MultiEdit): 수정한 파일에 ESLint --fix + Prettier 를 돌린다.
// 자동 수정으로 해결되지 않는 ESLint 에러(FSD 의존 방향 위반 등)는 Claude 에게 돌려보낸다.
import { block, readInput, runBin, toRelative } from './_utils.mjs';

const LINT_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const FORMAT_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|css|html|ya?ml)$/;

const input = await readInput();
const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

const relative = toRelative(filePath);
if (relative.startsWith('..') || relative.startsWith('node_modules/')) process.exit(0);

if (LINT_EXT.test(relative)) {
  const result = runBin('eslint', ['--fix', '--no-warn-ignored', relative]);
  if (!result.ok) {
    block(
      `[lint-on-edit] ${relative} 에 ESLint 에러가 남아 있습니다. 고쳐 주세요.\n${result.output}`,
    );
  }
}

if (FORMAT_EXT.test(relative)) {
  runBin('prettier', ['--write', '--log-level', 'warn', '--ignore-unknown', relative]);
}
