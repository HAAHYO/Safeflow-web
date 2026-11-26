// Stop: 작업을 마치기 전에 타입 검사와 변경 관련 테스트를 돌린다.
// 실패하면 종료를 막고 에러를 Claude 에게 돌려보낸다.
import { execFileSync } from 'node:child_process';

import { block, readInput, ROOT, runBin } from './_utils.mjs';

const input = await readInput();

// 이미 한 번 막혀서 다시 도는 중이면 무한 루프를 피하기 위해 통과시킨다.
if (input.stop_hook_active) process.exit(0);

let changed = '';
try {
  changed = execFileSync('git', ['status', '--porcelain'], { cwd: ROOT, encoding: 'utf8' });
} catch {
  process.exit(0);
}

// 코드 변경이 없으면(문서만 바꿨거나 대화만 했으면) 검사하지 않는다.
const touchedCode = changed.split('\n').some((line) => /\.(ts|tsx)$/.test(line.trim()));
if (!touchedCode) process.exit(0);

const failures = [];

for (const project of ['tsconfig.json', 'tsconfig.node.json']) {
  const result = runBin('tsc', ['--noEmit', '-p', project]);
  if (!result.ok) failures.push(`## tsc -p ${project}\n${result.output}`);
}

const tests = runBin('vitest', ['run', '--changed', '--passWithNoTests']);
if (!tests.ok) failures.push(`## vitest --changed\n${tests.output}`);

if (failures.length > 0) {
  block(`[verify-on-stop] 마치기 전에 아래 문제를 고쳐 주세요.\n\n${failures.join('\n\n')}`);
}
