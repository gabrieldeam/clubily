// app/admin/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './page.module.css';
import {
  Store,
  Tag,
  User,
  LifeBuoy,
  CreditCard,
  Award,
  Gift,
  UserCheck,
  DollarSign,
  SquareChartGantt,
  ShoppingCart,
  GalleryThumbnails,
  Flag,
  Rss,
  BadgePercent
} from 'lucide-react';

const navItems = [
  { label: 'Empresas', href: '/admin/companies', icon: Store },
  { label: 'Categorias', href: '/admin/categories', icon: Tag },
  { label: 'Usuários', href: '/admin/users', icon: User },
  { label: 'Créditos', href: '/admin/payments', icon: CreditCard },
  { label: 'Suporte', href: '/admin/support', icon: LifeBuoy },
  { label: 'Cashback', href: '/admin/cashback-programs', icon: CreditCard },
  { label: 'Pontos', href: '/admin/points', icon: Award },
  { label: 'Planos de Pontos', href: '/admin/point-plans', icon: SquareChartGantt },
  { label: 'Cartão Fidelidade', href: '/admin/loyalty-templates', icon: Gift },
  { label: 'Cartão Fidelidade Completos', href: '/admin/loyalty-completed', icon: Gift },
  { label: 'Cupons', href: '/admin/coupons', icon: BadgePercent },
  { label: 'Representantes', href: '/admin/referrals', icon: UserCheck },
  { label: 'Comissões', href: '/admin/commissions', icon: DollarSign },
  { label: 'Loja de Recompensas', href: '/admin/rewards', icon: ShoppingCart },
  { label: 'Slides', href: '/admin/slides', icon: GalleryThumbnails },
  { label: 'Marcos de Pontuação', href: '/admin/milestones', icon: Flag },
  { label: 'Blog', href: '/admin/blog', icon: Rss },
];

export default function AdminWelcomePage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.replace('/');
    }
  }, [loading, isAdmin, router]);

  if (loading) return <p className={styles.loading}>Carregando...</p>;
  if (!isAdmin) return null;

  return (
    <div className={styles.container}>
      <h1>Painel de Administração</h1>
      <p>
        Bem‐vindo, <strong>{user?.name}</strong>! Aqui você pode gerenciar o sistema.
      </p>
      <main className={styles.main}>
        {navItems.map(({ label, href, icon: Icon }) => (
          <div
            key={href}
            className={styles.gridItem}
            onClick={() => router.push(href)}
          >
            <Icon size={40} className={styles.icon} />
            <span>{label}</span>
          </div>
        ))}
      </main>
    </div>
  );
}
