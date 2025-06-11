// components/FloatingMenu/FloatingMenu.tsx
'use client';

import Link        from 'next/link';
import Image       from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';   // ➊
import styles      from './FloatingMenu.module.css';

interface NavLink {
  name: string;
  href: string;
  icon: string;
}

const links: NavLink[] = [
  { name: 'Dashboard', href: '/',        icon: '/icons/dashboard.svg' },
  { name: 'Clientes',  href: '/clients',  icon: '/icons/client.svg'    },
  { name: 'Programas', href: '/programs', icon: '/icons/program.svg'   },
  { name: 'Carteira',  href: '/wallet',  icon: '/icons/wallet.svg'    },
];

export default function FloatingMenu() {
  const pathname          = usePathname();
  const { user, loading } = useAuth();           // ➋

  // Enquanto carrega ou se não houver usuário → não mostra nada
  if (loading || !user) return null;             // ➌

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
