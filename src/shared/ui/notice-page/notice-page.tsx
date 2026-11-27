import { Link } from 'react-router';

import styles from './notice-page.module.css';

type NoticePageProps = {
  code: string;
  title: string;
  description: string;
};

/** 404 · 403 같은 안내 화면. */
export function NoticePage({ code, title, description }: NoticePageProps) {
  return (
    <section className={styles.page}>
      <div>
        <p className={styles.code}>{code}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        <Link to="/" className={styles.link}>
          홈으로
        </Link>
      </div>
    </section>
  );
}
