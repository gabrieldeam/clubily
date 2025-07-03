// src/app/programs/page.tsx
'use client';

import Header from '@/components/Header/Header';
import PointsRulesMain from '@/components/PointsRulesMain/PointsRulesMain';
import CashbackProgramsMain from '@/components/CashbackProgramsMain/CashbackProgramsMain';
import styles from './page.module.css';

export default function ProgramsPage() {
 

  return (
    <>
    <Header />
    
    <div className={styles.container}>   
        <CashbackProgramsMain />
         <PointsRulesMain />
    </div>
    </>    
  );
}
