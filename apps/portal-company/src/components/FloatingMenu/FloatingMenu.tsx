'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from './FloatingMenu.module.css';

interface NavLink {
  name: string;
  href: string;
  icon: string;   // caminho relativo em public/
}

const links: NavLink[] = [
  { name: 'Dashboard', href: '/',        icon: '/icons/dashboard.svg' },
  { name: 'Clientes',  href: '/client',  icon: '/icons/client.svg'    },
  { name: 'Programas', href: '/program', icon: '/icons/program.svg'   },
  { name: 'Carteira',  href: '/wallet',  icon: '/icons/wallet.svg'    },
];

export default function FloatingMenu() {
  const pathname = usePathname();

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
