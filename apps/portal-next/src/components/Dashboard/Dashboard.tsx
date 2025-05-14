// src/components/Dashboard/Dashboard.tsx
import Header from '@/components/Header/Header';

export default function Dashboard() {
  return (
    <div>
      <Header onSearch={q => console.log('Pesquisar por:', q)}/>
      <main>
        {/* resto do dashboard */}
      </main>
    </div>
  );
}
