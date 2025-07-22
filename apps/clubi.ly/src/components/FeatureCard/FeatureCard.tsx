import { ReactNode } from 'react';
import styles from './FeatureCard.module.css';

interface Props {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}
export default function FeatureCard({ icon, title, children }: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.icon}>{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
