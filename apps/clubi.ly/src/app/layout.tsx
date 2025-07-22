import '@/app/globals.css';
import type { Metadata, Viewport } from 'next';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';

export const metadata: Metadata = {
  title: 'Clubily • Programas de Fidelidade simplificados',
  description: 'Cashback, pontos e cartões digitais em uma única plataforma.',
  icons: {
    icon: '/icon.svg',       
    shortcut: '/icon.svg',   
    apple: '/icon.svg',      
  },
}

export const viewport: Viewport = {
  themeColor: '#FFA600',
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
