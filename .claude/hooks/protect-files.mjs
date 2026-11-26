// PreToolUse(Edit|Write|MultiEdit): 건드리면 안 되는 파일 수정을 막는다.
import { block, readInput, toRelative } from './_utils.mjs';

const RULES = [
  {
    test: (f) => /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith('.env.example'),
    reason:
      '.env 파일은 비밀 값이 들어 있어 직접 수정하지 않습니다. .env.example 을 수정하고 사용자에게 알려주세요.',
  },
  {
    test: (f) => f === 'pnpm-lock.yaml',
    reason: 'pnpm-lock.yaml 은 직접 수정하지 않습니다. pnpm add / pnpm remove 를 쓰세요.',
  },
  {
    test: (f) => f.startsWith('node_modules/') || f.startsWith('.git/'),
    reason: 'node_modules / .git 내부는 수정하지 않습니다.',
  },
];

const input = await readInput();
const filePath = input.tool_input?.file_path;
if (!filePath) process.exit(0);

const relative = toRelative(filePath);
const hit = RULES.find((rule) => rule.test(relative));
if (hit) block(`[protect-files] ${relative}: ${hit.reason}`);
