// app/admin/layout.tsx
'use client';

import Sidebar from '@/components/Sidebar/Sidebar';
import AdminHeader from '@/components/AdminHeader/AdminHeader';
import layoutStyles from './layout.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={layoutStyles.wrapper}>
      <Sidebar />
      <div className={layoutStyles.content}>
        <AdminHeader />
        <main className={layoutStyles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
