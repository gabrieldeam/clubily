'use client';

import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {


  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Image
          src="/logo.svg"
          alt="Logo"
          width={150}
          height={40}
          priority
        />
      </header>      
    </div>
  );
}
