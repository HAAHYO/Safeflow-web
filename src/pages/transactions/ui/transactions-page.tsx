import { useState } from 'react';

import { SimulateTransactionForm } from '@/features/simulate-transaction';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Icon } from '@/shared/ui/icon';
import { PageHeader } from '@/shared/ui/page-header';
import { TransactionStats, TransactionTable } from '@/widgets/transaction-table';

const SIMULATOR_ID = 'transaction-simulator';

export function TransactionsPage() {
  const [isSimulatorOpen, setSimulatorOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="거래 내역"
        description="실시간 FDS 분석 결과와 탐지 근거를 확인합니다."
        actions={
          <Button
            variant={isSimulatorOpen ? 'secondary' : 'primary'}
            onClick={() => setSimulatorOpen((open) => !open)}
            aria-expanded={isSimulatorOpen}
            aria-controls={SIMULATOR_ID}
          >
            <Icon name="play" size={16} />
            {isSimulatorOpen ? '시뮬레이션 닫기' : '거래 시뮬레이션'}
          </Button>
        }
      />
      {/* 닫아도 언마운트하지 않고 숨긴다: aria-controls 대상이 늘 있고, 입력하던 값도 남는다. */}
      <div id={SIMULATOR_ID} hidden={!isSimulatorOpen}>
        <Card
          title="거래 시뮬레이션"
          description="가상의 거래를 발생시켜 FDS 가 어떻게 판단하는지 확인합니다."
        >
          <SimulateTransactionForm />
        </Card>
      </div>
      <TransactionStats />
      <TransactionTable />
    </>
  );
}
