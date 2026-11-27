import styles from './filter-chips.module.css';

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

type FilterChipsProps<T extends string> = {
  /** 스크린리더용 그룹 이름 (예: "FDS 상태 필터") */
  label: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** 하나만 고르는 필터. 선택 상태는 aria-pressed 로 알린다. */
export function FilterChips<T extends string>({
  label,
  options,
  value,
  onChange,
}: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className={styles.group}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.chip}
          aria-pressed={option.value === value}
          aria-label={option.count === undefined ? undefined : `${option.label} ${option.count}건`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && <span className={styles.count}>{option.count}</span>}
        </button>
      ))}
    </div>
  );
}
