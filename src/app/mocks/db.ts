/**
 * 목 모드용 인메모리 DB. SafeFlow-Server 의 시드 데이터와 규칙을 단순화해 흉내 낸다.
 * 새로고침하면 처음 상태로 돌아간다.
 */

export type Role = 'FDS_ADMIN' | 'CRM_MARKETER';
type Grade = 'VIP' | 'GOLD' | 'GENERAL';
type FdsStatus = 'NORMAL' | 'WARNING' | 'BLOCKED';

export type MockCustomer = {
  id: number;
  name: string;
  accountNumber: string;
  balance: number;
  grade: Grade;
  avgTxAmount: number;
  churnScore: number;
  isFalsePositiveVictim: boolean;
  churnReasons: { feature: string; contribution: number }[];
};

export type MockTransaction = {
  id: number;
  customerId: number;
  amount: number;
  txHour: number;
  occurredAt: string;
  isOverseas: boolean;
  deviceChanged: boolean;
  fraudScore: number;
  fdsStatus: FdsStatus;
  isActualFraud: boolean | null;
  shapReasons: { feature: string; shap: number }[];
};

export type MockCareAction = {
  id: number;
  transactionId: number;
  customerId: number;
  recommendedProduct: string;
  actionMessage: string;
  status: 'PENDING' | 'SENT';
  sentBy: string | null;
  version: number;
};

export type MockSendHistory = {
  id: number;
  careActionId: number;
  sentBy: string;
  sentAt: string;
  recommendedProduct: string;
  actionMessage: string;
  careActionVersion: number;
};

export const EMPLOYEES: Record<string, { role: Role; department: string }> = {
  fds_admin: { role: 'FDS_ADMIN', department: '이상거래탐지팀' },
  crm_marketer: { role: 'CRM_MARKETER', department: '고객관리팀' },
};

// ── 백엔드 규칙(단순화) ─────────────────────────────────────────────

const round4 = (value: number) => Math.round(value * 10_000) / 10_000;

/** RuleBasedFdsScoringEngine 과 같은 가중치. */
export function scoreTransaction(input: {
  amount: number;
  avgTxAmount: number;
  txHour: number;
  isOverseas: boolean;
  deviceChanged: boolean;
}) {
  const ratio = input.avgTxAmount > 0 ? input.amount / input.avgTxAmount : 5;
  const contributions = [
    { feature: 'amount_ratio', shap: (0.4 * Math.min(Math.max(ratio - 1, 0), 4)) / 4 },
    { feature: 'tx_hour', shap: input.txHour <= 5 ? 0.2 : 0 },
    { feature: 'is_overseas', shap: input.isOverseas ? 0.25 : 0 },
    { feature: 'device_changed', shap: input.deviceChanged ? 0.3 : 0 },
  ].map((reason) => ({ ...reason, shap: round4(reason.shap) }));

  const fraudScore = round4(
    Math.min(
      contributions.reduce((sum, r) => sum + r.shap, 0),
      1,
    ),
  );
  const fdsStatus: FdsStatus =
    fraudScore >= 0.8 ? 'BLOCKED' : fraudScore >= 0.5 ? 'WARNING' : 'NORMAL';
  const shapReasons = contributions
    .filter((r) => r.shap > 0)
    .sort((a, b) => b.shap - a.shap)
    .slice(0, 3);
  return { fraudScore, fdsStatus, shapReasons };
}

/** CareRecommendation 과 같은 문구. */
export function recommendationFor(status: FdsStatus) {
  if (status === 'WARNING') {
    return {
      product: '안심차단 서비스',
      message:
        '평소와 다른 거래가 감지되어 확인 중입니다. 안심차단 서비스로 더 안전하게 이용하실 수 있습니다.',
    };
  }
  if (status === 'BLOCKED') {
    return {
      product: '안심차단 서비스 + 우대금리 파킹통장',
      message:
        '고객님의 자산 보호를 위해 거래가 일시 차단되었습니다. 불편을 드려 죄송하며 우대금리 파킹통장을 안내해 드립니다.',
    };
  }
  return null;
}

export function falsePositiveRecommendation(grade: Grade) {
  return grade === 'VIP'
    ? {
        product: '수수료 면제 + VIP 전담 상담',
        message:
          '정상 거래가 잘못 차단되어 큰 불편을 드렸습니다. 수수료 면제와 VIP 전담 상담으로 보답하겠습니다.',
      }
    : {
        product: '우대금리 파킹통장 + 수수료 면제 쿠폰',
        message:
          '정상 거래가 잘못 차단되어 불편을 드렸습니다. 우대금리 파킹통장과 수수료 면제 쿠폰을 드립니다.',
      };
}

/** 이탈 점수를 올리고 가장 큰 요인을 앞에 둔다(로지스틱 모델 대신 단순 가산). */
export function raiseChurn(customer: MockCustomer, feature: string, amount: number) {
  customer.churnScore = round4(Math.min(customer.churnScore + amount, 0.99));
  const existing = customer.churnReasons.find((r) => r.feature === feature);
  if (existing) existing.contribution = round4(existing.contribution + amount);
  else customer.churnReasons.push({ feature, contribution: round4(amount) });
  customer.churnReasons.sort((a, b) => b.contribution - a.contribution);
  customer.churnReasons = customer.churnReasons.slice(0, 3);
}

export function maskName(name: string) {
  if (name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${'*'.repeat(name.length - 2)}${name[name.length - 1]}`;
}

export function maskAccount(account: string) {
  const [bank = '', , last = ''] = account.split('-');
  return `${bank}-***-***${last.slice(-3)}`;
}

/** 현재 시각(KST)을 LocalDateTime 문자열로. */
export function nowLocalDateTime() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 19);
}

// ── 시드 ────────────────────────────────────────────────────────────

type Db = {
  customers: MockCustomer[];
  transactions: MockTransaction[];
  careActions: MockCareAction[];
  sendHistories: MockSendHistory[];
  nextId: { transaction: number; careAction: number; history: number };
};

function seedCustomers(): MockCustomer[] {
  const c = (
    id: number,
    name: string,
    accountNumber: string,
    balance: number,
    grade: Grade,
    avgTxAmount: number,
    churnScore: number,
    isFalsePositiveVictim = false,
    churnReasons: MockCustomer['churnReasons'] = [],
  ): MockCustomer => ({
    id,
    name,
    accountNumber,
    balance,
    grade,
    avgTxAmount,
    churnScore,
    isFalsePositiveVictim,
    churnReasons,
  });

  return [
    c(1, '김민준', '110-234-567801', 152_300_000, 'VIP', 3_200_000, 0.1842),
    c(2, '이서연', '110-345-678902', 98_750_000, 'VIP', 2_450_000, 0.7821, true, [
      { feature: 'recent_false_positive_count', contribution: 0.2134 },
      { feature: 'card_usage_change_rate', contribution: 0.1517 },
      { feature: 'false_positive_victim', contribution: 0.0921 },
    ]),
    c(3, '박지훈', '110-456-789003', 45_200_000, 'GOLD', 850_000, 0.3215, false, [
      { feature: 'card_usage_change_rate', contribution: 0.0612 },
    ]),
    c(4, '최수아', '110-567-890104', 31_800_000, 'GOLD', 620_000, 0.8346, true, [
      { feature: 'card_usage_change_rate', contribution: 0.2408 },
      { feature: 'recent_false_positive_count', contribution: 0.1987 },
      { feature: 'login_freq_change_rate', contribution: 0.1203 },
    ]),
    c(5, '정도윤', '110-678-901205', 27_450_000, 'GOLD', 540_000, 0.1203),
    c(6, '강하은', '110-789-012306', 5_320_000, 'GENERAL', 120_000, 0.4127, false, [
      { feature: 'card_usage_change_rate', contribution: 0.0988 },
      { feature: 'recent_warning_count', contribution: 0.0412 },
    ]),
    c(7, '조예준', '110-890-123407', 2_180_000, 'GENERAL', 85_000, 0.6412, false, [
      { feature: 'card_usage_change_rate', contribution: 0.1876 },
      { feature: 'login_freq_change_rate', contribution: 0.1124 },
      { feature: 'app_login_freq', contribution: 0.0731 },
    ]),
    c(8, '윤지우', '110-901-234508', 8_940_000, 'GENERAL', 210_000, 0.8812, true, [
      { feature: 'card_usage_change_rate', contribution: 0.2611 },
      { feature: 'recent_false_positive_count', contribution: 0.2209 },
      { feature: 'app_login_freq', contribution: 0.1102 },
    ]),
    c(9, '장시우', '110-012-345609', 1_250_000, 'GENERAL', 45_000, 0.2208),
    c(10, '임채원', '110-123-456710', 210_400_000, 'VIP', 5_100_000, 0.0921),
  ];
}

/** [고객 ID, 금액, 발생 시각, 해외, 기기 변경, 판정] */
const SEED_TRANSACTIONS: [number, number, string, boolean, boolean, boolean | null][] = [
  [1, 2_800_000, '2026-11-20T14:12:00', false, false, false],
  [3, 640_000, '2026-11-21T10:05:00', false, false, false],
  [2, 9_800_000, '2026-11-21T02:41:00', true, true, false],
  [6, 380_000, '2026-11-22T21:30:00', false, true, null],
  [4, 2_400_000, '2026-11-22T03:15:00', true, true, false],
  [10, 4_200_000, '2026-11-23T11:48:00', false, false, false],
  [8, 1_150_000, '2026-11-24T01:20:00', true, true, false],
  [5, 2_100_000, '2026-11-24T16:02:00', true, false, null],
  [9, 210_000, '2026-11-25T04:33:00', false, true, true],
  [1, 15_000_000, '2026-11-26T03:12:00', true, true, null],
  [7, 300_000, '2026-11-26T13:40:00', false, false, false],
  [3, 3_900_000, '2026-11-27T02:05:00', true, true, null],
];

function seed(): Db {
  const customers = seedCustomers();
  const transactions: MockTransaction[] = [];
  const careActions: MockCareAction[] = [];
  const sendHistories: MockSendHistory[] = [];

  SEED_TRANSACTIONS.forEach(
    ([customerId, amount, occurredAt, isOverseas, deviceChanged, judged], i) => {
      const customer = customers.find((item) => item.id === customerId);
      if (!customer) return;
      const txHour = Number(occurredAt.slice(11, 13));
      const result = scoreTransaction({
        amount,
        avgTxAmount: customer.avgTxAmount,
        txHour,
        isOverseas,
        deviceChanged,
      });
      const id = i + 1;
      // 판정은 차단 거래에만 의미가 있다.
      const isActualFraud = result.fdsStatus === 'BLOCKED' ? judged : null;
      transactions.push({
        id,
        customerId,
        amount,
        txHour,
        occurredAt,
        isOverseas,
        deviceChanged,
        ...result,
        isActualFraud,
      });

      const recommendation =
        isActualFraud === false
          ? falsePositiveRecommendation(customer.grade)
          : recommendationFor(result.fdsStatus);
      if (!recommendation) return;
      careActions.push({
        id: careActions.length + 1,
        transactionId: id,
        customerId,
        recommendedProduct: recommendation.product,
        actionMessage: recommendation.message,
        status: 'PENDING',
        sentBy: null,
        version: isActualFraud === false ? 1 : 0,
      });
    },
  );

  // 오래된 케어 조치 일부는 이미 발송된 상태로 둔다.
  for (const action of careActions.slice(0, 2)) {
    action.status = 'SENT';
    action.sentBy = 'crm_marketer';
    sendHistories.push({
      id: sendHistories.length + 1,
      careActionId: action.id,
      sentBy: 'crm_marketer',
      sentAt: '2026-11-25T09:30:00',
      recommendedProduct: action.recommendedProduct,
      actionMessage: action.actionMessage,
      careActionVersion: action.version,
    });
    action.version += 1;
  }

  return {
    customers,
    transactions,
    careActions,
    sendHistories,
    nextId: {
      transaction: transactions.length + 1,
      careAction: careActions.length + 1,
      history: sendHistories.length + 1,
    },
  };
}

export let db: Db = seed();

/** 테스트용: 처음 상태로 되돌린다. */
export function resetMockDb() {
  db = seed();
}
