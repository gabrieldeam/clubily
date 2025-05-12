// src/components/Dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { listCompanyClients } from '@/services/companyService';
import type { UserRead } from '@/types/user';

export default function Dashboard() {
  const [clients, setClients] = useState<UserRead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCompanyClients()
      .then(res => setClients(res.data))
      .catch(err => {
        console.error(err);
        setError('Não foi possível carregar clientes.');
      });
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {clients.map(c => (
          <li key={c.id}>
            {c.name} — {c.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
