import { z } from 'zod';

import { type SimulateTransactionRequest } from '../api/simulate-transaction';

/** JS number 로 정확히 다룰 수 있는 범위 안에서, 원 단위 정수만 받는다. */
const MAX_AMOUNT = 999_999_999_999;

export const simulateFormSchema = z.object({
  customerId: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, '고객 ID 를 입력해 주세요.')
    .transform(Number),
  amount: z
    .string()
    .trim()
    .transform((value) => value.replaceAll(',', ''))
    .pipe(
      z
        .string()
        .regex(/^[1-9]\d*$/, '1원 이상의 정수 금액을 입력해 주세요.')
        .transform(Number)
        .pipe(z.number().max(MAX_AMOUNT, '금액이 너무 큽니다.')),
    ),
  isOverseas: z.boolean(),
  deviceChanged: z.boolean(),
  /** <input type="datetime-local"> 값(YYYY-MM-DDTHH:mm). 비우면 서버 현재 시각. */
  occurredAt: z.string(),
});

export type SimulateFormInput = z.input<typeof simulateFormSchema>;
export type SimulateFormOutput = z.output<typeof simulateFormSchema>;

export const SIMULATE_FORM_DEFAULTS: SimulateFormInput = {
  customerId: '',
  amount: '',
  isOverseas: false,
  deviceChanged: false,
  occurredAt: '',
};

/** 폼 값을 요청으로 바꾼다. 입력 시각은 KST 로 보고 +09:00 오프셋을 붙인다. */
export function toSimulateRequest(values: SimulateFormOutput): SimulateTransactionRequest {
  const { occurredAt, ...rest } = values;
  return occurredAt ? { ...rest, occurredAt: `${occurredAt}:00+09:00` } : rest;
}
