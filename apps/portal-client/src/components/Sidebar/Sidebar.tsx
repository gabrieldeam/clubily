// Sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Store,
  Tag,
  User,
  LifeBuoy,
  CreditCard,
  Award,
  Gift,
  UserCheck,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  SquareChartGantt,
  ShoppingCart,
  GalleryThumbnails,
  Flag
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { label: 'Empresas', href: '/admin/companies', icon: Store },
  { label: 'Categorias', href: '/admin/categories', icon: Tag },
  { label: 'Usuários', href: '/admin/users', icon: User },
  { label: 'Créditos', href: '/admin/payments', icon: CreditCard },
  { label: 'Suportes', href: '/admin/suportes', icon: LifeBuoy },
  { label: 'Cashback', href: '/admin/cashback-programs', icon: CreditCard },
  { label: 'Pontos', href: '/admin/points', icon: Award },
  { label: 'Planos de Pontos', href: '/admin/point-plans', icon: SquareChartGantt },
  { label: 'Cartão Fidelidade', href: '/admin/programas/cartao-fidelidade', icon: Gift },
  { label: 'Representantes', href: '/admin/referrals', icon: UserCheck },
  { label: 'Comissões', href: '/admin/commissions', icon: DollarSign },
  { label: 'Loja de Recompensas', href: '/admin/rewards', icon: ShoppingCart },
  { label: 'Slides', href: '/admin/slides', icon: GalleryThumbnails },
  { label: 'Marcos de Pontuação', href: '/admin/milestones', icon: Flag },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => setCollapsed(prev => !prev);

  return (
    <>
      {/* Hamburger for mobile */}
      <button
        className={styles.hamburger}
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu size={24} color="#fff" />
      </button>

      {/* Overlay */}
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${
          collapsed ? styles.collapsed : ''
        }`}
      >
        <div className={styles.header}>
          {!collapsed &&           
          <Link href="/admin">
            <Image src="/logo.svg" alt="Logo" width={85} height={22} />
          </Link>}
          <div className={styles.controls}>
            {/* Collapse toggle (desktop only) */}
            <button
              className={styles.collapseBtn}
              onClick={toggleCollapse}
              aria-label={collapsed ? 'Expandir menu' : 'Colapsar menu'}
            >
              {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            {/* Close on mobile */}
            <button
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Fechar menu"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={styles.navItem}
              onClick={() => setIsOpen(false)}
              title={collapsed ? label : undefined}
            >
              <Icon size={20} />
              {!collapsed && <span>{label}</span>}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}