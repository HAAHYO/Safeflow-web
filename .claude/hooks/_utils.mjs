import { execFileSync } from 'node:child_process';
import path from 'node:path';

/** Git Bash 형식(/c/Users/...) 경로를 Windows 경로(C:/Users/...)로 바꾼다. */
function normalize(p) {
  return process.platform === 'win32' ? p.replace(/^\/([a-zA-Z])\//, '$1:/') : p;
}

export const ROOT = path.resolve(normalize(process.env.CLAUDE_PROJECT_DIR ?? process.cwd()));

const BINS = {
  eslint: 'node_modules/eslint/bin/eslint.js',
  prettier: 'node_modules/prettier/bin/prettier.cjs',
  tsc: 'node_modules/typescript/bin/tsc',
  vitest: 'node_modules/vitest/vitest.mjs',
};

/** stdin 으로 들어오는 hook 입력(JSON)을 읽는다. */
export async function readInput() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

/**
 * node_modules 의 CLI 를 셸 없이 직접 실행한다.
 * Windows 에서 셸(ComSpec) 설정에 영향받지 않도록 node 로 바로 띄운다.
 */
export function runBin(name, args) {
  try {
    const stdout = execFileSync(process.execPath, [path.join(ROOT, BINS[name]), ...args], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, output: stdout };
  } catch (error) {
    return { ok: false, output: `${error.stdout ?? ''}${error.stderr ?? ''}`.trim() };
  }
}

/** 프로젝트 루트 기준 상대 경로(슬래시 구분)로 바꾼다. */
export function toRelative(filePath) {
  return path
    .relative(ROOT, path.resolve(ROOT, normalize(filePath)))
    .split(path.sep)
    .join('/');
}

/** exit 2 + stderr 는 Claude 에게 피드백으로 전달된다. */
export function block(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}
