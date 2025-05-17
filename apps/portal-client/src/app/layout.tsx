import "./globals.css";
import { AuthProvider } from '@/context/AuthContext';
import { AddressProvider } from '@/context/AddressContext';
import FloatingMenu from '@/components/FloatingMenu/FloatingMenu';
import 'leaflet/dist/leaflet.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <AddressProvider>
            <FloatingMenu />
              {children}
          </AddressProvider>          
        </AuthProvider>
      </body>
    </html>
  );
}