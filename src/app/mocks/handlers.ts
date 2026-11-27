import { type AnyHandler, delay, http, HttpResponse } from 'msw';

import { env } from '@/shared/config';

import {
  db,
  EMPLOYEES,
  falsePositiveRecommendation,
  maskAccount,
  maskName,
  type MockCareAction,
  type MockCustomer,
  type MockTransaction,
  nowLocalDateTime,
  raiseChurn,
  recommendationFor,
  type Role,
  scoreTransaction,
} from './db';

const api = (path: string) => `${env.VITE_API_URL}${path}`;

/** 목 모드에서만 응답을 살짝 늦춰 로딩 상태가 보이게 한다(테스트는 지연 없음). */
const latency = () => (import.meta.env.MODE === 'mock' ? delay(300) : Promise.resolve());

// ── 공통 ────────────────────────────────────────────────────────────

/** 백엔드 ProblemDetail 과 같은 모양의 에러. */
function problem(status: number, code: string, detail: string) {
  return HttpResponse.json({ status, code, detail }, { status });
}

const encode = (value: object) =>
  btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function issueToken(username: string, role: Role) {
  const exp = Math.floor(Date.now() / 1000) + 30 * 60;
  return `${encode({ alg: 'none' })}.${encode({ username, role, exp })}.mock`;
}

type Principal = { username: string; role: Role };

/** Authorization 헤더를 읽어 직원을 꺼낸다. 없거나 권한이 없으면 에러 응답. */
function authorize(request: Request, roles?: Role[]): Principal | Response {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
  const payload = token?.split('.')[1];
  try {
    const json = payload
      ? (JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as Principal & {
          exp: number;
        })
      : null;
    if (!json || json.exp * 1000 < Date.now()) {
      return problem(401, 'UNAUTHORIZED', '인증이 필요합니다.');
    }
    if (roles && !roles.includes(json.role)) {
      return problem(403, 'ACCESS_DENIED', '접근 권한이 없습니다.');
    }
    return { username: json.username, role: json.role };
  } catch {
    return problem(401, 'UNAUTHORIZED', '인증이 필요합니다.');
  }
}

const findCustomer = (id: number) => db.customers.find((c) => c.id === id);

function toTransactionResponse(tx: MockTransaction, role: Role) {
  const customer = findCustomer(tx.customerId) as MockCustomer;
  const masked = role !== 'FDS_ADMIN';
  return {
    ...tx,
    customerName: masked ? maskName(customer.name) : customer.name,
    accountNumber: masked ? maskAccount(customer.accountNumber) : customer.accountNumber,
    churnScore: customer.churnScore,
  };
}

function toCareActionResponse(action: MockCareAction, role: Role) {
  const customer = findCustomer(action.customerId) as MockCustomer;
  const masked = role !== 'FDS_ADMIN';
  return {
    ...action,
    customerName: masked ? maskName(customer.name) : customer.name,
    accountNumber: masked ? maskAccount(customer.accountNumber) : customer.accountNumber,
    customerGrade: customer.grade,
    churnScore: customer.churnScore,
    isFalsePositiveVictim: customer.isFalsePositiveVictim,
  };
}

const newestFirst = <T extends { id: number }>(items: T[]) =>
  [...items].sort((a, b) => b.id - a.id);

// ── 핸들러 ──────────────────────────────────────────────────────────

/** 목 모드 API 핸들러. SafeFlow-Server 의 엔드포인트와 같은 경로 · 응답 모양을 쓴다. */
export const handlers: AnyHandler[] = [
  http.post(api('/api/auth/login'), async ({ request }) => {
    await latency();
    const { username, password } = (await request.json()) as {
      username?: string;
      password?: string;
    };
    const employee = username ? EMPLOYEES[username] : undefined;
    if (!employee || !password) {
      return problem(401, 'INVALID_CREDENTIALS', '아이디 또는 비밀번호가 올바르지 않습니다.');
    }
    return HttpResponse.json({
      accessToken: issueToken(username as string, employee.role),
      role: employee.role,
      department: employee.department,
    });
  }),

  http.get(api('/api/transactions'), async ({ request }) => {
    await latency();
    const principal = authorize(request);
    if (principal instanceof Response) return principal;
    return HttpResponse.json({
      items: newestFirst(db.transactions).map((tx) => toTransactionResponse(tx, principal.role)),
    });
  }),

  http.post(api('/api/transactions/simulate'), async ({ request }) => {
    await latency();
    const principal = authorize(request);
    if (principal instanceof Response) return principal;

    const body = (await request.json()) as {
      customerId: number;
      amount: number;
      isOverseas?: boolean;
      deviceChanged?: boolean;
      occurredAt?: string;
    };
    if (!(body.amount > 0)) return problem(400, 'INVALID_INPUT', 'amount: 0보다 커야 합니다');
    const customer = findCustomer(body.customerId);
    if (!customer) return problem(404, 'CUSTOMER_NOT_FOUND', '고객을 찾을 수 없습니다.');

    // occurredAt 은 +09:00 오프셋으로 온다. 없으면 현재 KST.
    const occurredAt = body.occurredAt ? body.occurredAt.slice(0, 19) : nowLocalDateTime();
    const txHour = Number(occurredAt.slice(11, 13));
    const isOverseas = body.isOverseas ?? false;
    const deviceChanged = body.deviceChanged ?? false;
    const result = scoreTransaction({
      amount: body.amount,
      avgTxAmount: customer.avgTxAmount,
      txHour,
      isOverseas,
      deviceChanged,
    });

    if (result.fdsStatus !== 'BLOCKED') {
      if (customer.balance < body.amount) {
        return problem(409, 'INSUFFICIENT_BALANCE', '잔액이 부족합니다.');
      }
      customer.balance -= body.amount;
    }
    if (result.fdsStatus === 'BLOCKED') raiseChurn(customer, 'recent_blocked_count', 0.08);
    if (result.fdsStatus === 'WARNING') raiseChurn(customer, 'recent_warning_count', 0.03);

    const transaction: MockTransaction = {
      id: db.nextId.transaction++,
      customerId: customer.id,
      amount: body.amount,
      txHour,
      occurredAt,
      isOverseas,
      deviceChanged,
      ...result,
      isActualFraud: null,
    };
    db.transactions.push(transaction);

    const recommendation = recommendationFor(result.fdsStatus);
    if (recommendation) {
      db.careActions.push({
        id: db.nextId.careAction++,
        transactionId: transaction.id,
        customerId: customer.id,
        recommendedProduct: recommendation.product,
        actionMessage: recommendation.message,
        status: 'PENDING',
        sentBy: null,
        version: 0,
      });
    }

    return HttpResponse.json(
      {
        transactionId: transaction.id,
        customerId: customer.id,
        amount: transaction.amount,
        txHour,
        occurredAt,
        fraudScore: result.fraudScore,
        fdsStatus: result.fdsStatus,
        shapReasons: result.shapReasons,
        balanceAfter: customer.balance,
        churnScore: customer.churnScore,
        careActionCreated: recommendation !== null,
      },
      { status: 201 },
    );
  }),

  http.patch(api('/api/transactions/:txId/resolve-false-positive'), async ({ request, params }) => {
    await latency();
    const principal = authorize(request, ['FDS_ADMIN']);
    if (principal instanceof Response) return principal;

    const tx = db.transactions.find((item) => item.id === Number(params.txId));
    if (!tx) return problem(404, 'TRANSACTION_NOT_FOUND', '거래를 찾을 수 없습니다.');
    if (tx.fdsStatus !== 'BLOCKED') {
      return problem(409, 'TRANSACTION_NOT_BLOCKED', '차단된 거래만 오탐으로 판정할 수 있습니다.');
    }
    if (tx.isActualFraud !== null) {
      return problem(409, 'TRANSACTION_ALREADY_JUDGED', '이미 판정이 끝난 거래입니다.');
    }

    tx.isActualFraud = false;
    const customer = findCustomer(tx.customerId) as MockCustomer;
    customer.isFalsePositiveVictim = true;
    raiseChurn(customer, 'recent_false_positive_count', 0.2);

    // 이 거래의 대기 케어 조치를 오탐 피해 보상안으로 다시 짠다(version 이 올라간다).
    const recommendation = falsePositiveRecommendation(customer.grade);
    for (const action of db.careActions) {
      if (action.transactionId === tx.id && action.status === 'PENDING') {
        action.recommendedProduct = recommendation.product;
        action.actionMessage = recommendation.message;
        action.version += 1;
      }
    }
    return HttpResponse.json(toTransactionResponse(tx, principal.role));
  }),

  http.get(api('/api/crm/high-risk-customers'), async ({ request }) => {
    await latency();
    const principal = authorize(request, ['CRM_MARKETER']);
    if (principal instanceof Response) return principal;

    const items = db.customers
      .filter((c) => c.isFalsePositiveVictim || c.churnScore >= 0.6)
      .sort((a, b) => b.churnScore - a.churnScore)
      .map((customer) => ({
        customerId: customer.id,
        name: customer.name,
        accountNumber: customer.accountNumber,
        grade: customer.grade,
        churnScore: customer.churnScore,
        isFalsePositiveVictim: customer.isFalsePositiveVictim,
        riskReasons: [
          ...(customer.isFalsePositiveVictim ? ['FALSE_POSITIVE_VICTIM'] : []),
          ...(customer.churnScore >= 0.6 ? ['HIGH_CHURN_SCORE'] : []),
        ],
        churnReasons: customer.churnReasons,
        pendingCareActions: db.careActions
          .filter((a) => a.customerId === customer.id && a.status === 'PENDING')
          .map((action) => {
            const tx = db.transactions.find(
              (t) => t.id === action.transactionId,
            ) as MockTransaction;
            return {
              id: action.id,
              version: action.version,
              transactionId: tx.id,
              fdsStatus: tx.fdsStatus,
              isFalsePositive: tx.isActualFraud === false,
              recommendedProduct: action.recommendedProduct,
              actionMessage: action.actionMessage,
            };
          }),
      }));
    return HttpResponse.json({ items });
  }),

  http.get(api('/api/care-actions'), async ({ request }) => {
    await latency();
    const principal = authorize(request, ['FDS_ADMIN', 'CRM_MARKETER']);
    if (principal instanceof Response) return principal;
    return HttpResponse.json({
      items: newestFirst(db.careActions).map((a) => toCareActionResponse(a, principal.role)),
    });
  }),

  http.get(api('/api/care-actions/:id/send-history'), async ({ request, params }) => {
    await latency();
    const principal = authorize(request, ['FDS_ADMIN', 'CRM_MARKETER']);
    if (principal instanceof Response) return principal;
    const id = Number(params.id);
    if (!db.careActions.some((a) => a.id === id)) {
      return problem(404, 'CARE_ACTION_NOT_FOUND', '케어 조치를 찾을 수 없습니다.');
    }
    return HttpResponse.json({
      items: newestFirst(db.sendHistories.filter((h) => h.careActionId === id)).map(
        ({ careActionId: _careActionId, ...history }) => history,
      ),
    });
  }),

  http.patch(api('/api/care-actions/:id/send'), async ({ request, params }) => {
    await latency();
    const principal = authorize(request, ['CRM_MARKETER']);
    if (principal instanceof Response) return principal;

    const action = db.careActions.find((a) => a.id === Number(params.id));
    if (!action) return problem(404, 'CARE_ACTION_NOT_FOUND', '케어 조치를 찾을 수 없습니다.');
    const { version } = (await request.json()) as { version: number };
    if (action.status === 'SENT') {
      return problem(409, 'CARE_ACTION_ALREADY_SENT', '이미 발송한 케어 조치입니다.');
    }
    if (action.version !== version) {
      return problem(
        409,
        'CARE_ACTION_STALE',
        '케어 조치 내용이 변경되었습니다. 다시 확인한 뒤 발송해 주세요.',
      );
    }

    db.sendHistories.push({
      id: db.nextId.history++,
      careActionId: action.id,
      sentBy: principal.username,
      sentAt: nowLocalDateTime(),
      recommendedProduct: action.recommendedProduct,
      actionMessage: action.actionMessage,
      careActionVersion: version,
    });
    action.status = 'SENT';
    action.sentBy = principal.username;
    action.version += 1;
    return HttpResponse.json(toCareActionResponse(action, principal.role));
  }),
];
