// components/FloatingMenu/FloatingMenu.tsx
'use client';

import Link           from 'next/link';
import Image          from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth }    from '@/context/AuthContext';
import styles         from './FloatingMenu.module.css';

interface NavLink {
  name: string;
  href: string;
  icon: string;
}

const baseLinks: NavLink[] = [
  { name: 'Home',        href: '/',         icon: '/icons/dashboard.svg' },
  { name: 'Loja', href: '/store',  icon: '/icons/store.svg'      },
  { name: 'Minha conta', href: '/profile',  icon: '/user.svg'      },
  { name: 'Carteira', href: '/wallet',  icon: '/icons/wallet.svg'      },
];

const adminLink: NavLink = {
  name: 'Admin',
  href: '/admin',
  icon: '/icons/admin.svg',
};

export default function FloatingMenu() {
  const pathname          = usePathname();
  const { user, loading, isAdmin } = useAuth();

  if (loading || !user) return null;

  const links: NavLink[] = isAdmin
    ? [...baseLinks, adminLink]
    : baseLinks;

  return (
    <nav className={styles.menu}>
      {links.map(({ name, href, icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`${styles.link} ${isActive ? styles.active : ''}`}
          >
            <Image
              src={icon}
              alt={`${name} icon`}
              width={20}
              height={20}
              className={styles.icon}
            />
            <span className={styles.label}>{name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
