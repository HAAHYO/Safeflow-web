import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { useForm } from 'react-hook-form';

import { FdsStatusBadge, ShapReasons, transactionListQueryOptions } from '@/entities/transaction';
import { getErrorMessage } from '@/shared/api';
import { formatScore, formatWon } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { TextField } from '@/shared/ui/text-field';

import { type SimulateTransactionResponse } from '../api/simulate-transaction';
import {
  SIMULATE_FORM_DEFAULTS,
  type SimulateFormInput,
  type SimulateFormOutput,
  simulateFormSchema,
  toSimulateRequest,
} from '../model/simulate-form';
import { useSimulateTransaction } from '../model/use-simulate-transaction';
import styles from './simulate-transaction-form.module.css';

/** 고객 목록 API 가 없어서, 거래 내역에 나온 고객을 입력 자동완성 후보로 쓴다. */
function useKnownCustomers() {
  return useQuery({
    ...transactionListQueryOptions(),
    select: (transactions) => [
      ...new Map(transactions.map((tx) => [tx.customerId, tx.customerName])).entries(),
    ],
  });
}

function SimulationResult({ result }: { result: SimulateTransactionResponse }) {
  return (
    <section className={styles.result} aria-label="시뮬레이션 결과">
      <h3 className={styles.resultTitle}>
        거래 #{result.transactionId} <FdsStatusBadge status={result.fdsStatus} />
      </h3>
      <dl className={styles.facts}>
        <dt>사기 점수</dt>
        <dd>{formatScore(result.fraudScore)}</dd>
        <dt>거래 후 잔액</dt>
        <dd>{formatWon(result.balanceAfter)}</dd>
        <dt>이탈 점수</dt>
        <dd>{formatScore(result.churnScore)}</dd>
        <dt>탐지 근거</dt>
        <dd>
          <ShapReasons reasons={result.shapReasons} />
        </dd>
      </dl>
      {result.fdsStatus === 'BLOCKED' && (
        <p className={styles.note}>차단된 거래라 잔액이 차감되지 않았습니다.</p>
      )}
      {result.careActionCreated && <p className={styles.note}>고객 케어 조치가 생성되었습니다.</p>}
    </section>
  );
}

export function SimulateTransactionForm() {
  const customerListId = useId();
  const { data: customers = [] } = useKnownCustomers();
  const simulation = useSimulateTransaction();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SimulateFormInput, unknown, SimulateFormOutput>({
    resolver: zodResolver(simulateFormSchema),
    defaultValues: SIMULATE_FORM_DEFAULTS,
  });

  return (
    <div className={styles.layout}>
      <form
        className={styles.form}
        onSubmit={handleSubmit((values) => simulation.mutate(toSimulateRequest(values)))}
        noValidate
      >
        <div className={styles.row}>
          <TextField
            label="고객 ID"
            inputMode="numeric"
            list={customerListId}
            error={errors.customerId?.message}
            {...register('customerId')}
          />
          <TextField
            label="금액(원)"
            inputMode="numeric"
            error={errors.amount?.message}
            {...register('amount')}
          />
        </div>
        <datalist id={customerListId}>
          {customers.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </datalist>
        <TextField
          label="발생 시각 (비우면 현재 시각)"
          type="datetime-local"
          {...register('occurredAt')}
        />
        <div className={styles.checks}>
          <label className={styles.check}>
            <input type="checkbox" {...register('isOverseas')} /> 해외 거래
          </label>
          <label className={styles.check}>
            <input type="checkbox" {...register('deviceChanged')} /> 기기 변경
          </label>
        </div>
        {simulation.isError && (
          <p role="alert" className={styles.error}>
            {getErrorMessage(simulation.error)}
          </p>
        )}
        <Button type="submit" disabled={simulation.isPending}>
          {simulation.isPending ? '분석 중…' : '거래 발생시키기'}
        </Button>
      </form>
      {simulation.data ? (
        <SimulationResult result={simulation.data} />
      ) : (
        <div className={styles.placeholder}>
          거래를 발생시키면 FDS 분석 결과가 여기에 표시됩니다.
        </div>
      )}
    </div>
  );
}
