import styles from './PricingTable.module.css';

export default function PricingTable() {
  const plans = [
    {
      name: 'Starter',
      price: 'Grátis',
      desc: 'Até 100 créditos de teste',
      features: ['1 programa ativo', 'Suporte e‑mail']
    },
    {
      name: 'Growth',
      price: 'R$199/mês',
      desc: '+ créditos flexíveis',
      features: ['Programas ilimitados', 'Suporte chat', 'Dashboard avançado']
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      desc: 'Solução white‑label',
      features: ['Conta gerente', 'SLA 99,9%', 'Integrações dedicadas']
    }
  ];

  return (
    <div className={styles.grid}>
      {plans.map(({ name, price, desc, features }) => (
        <div key={name} className={styles.card}>
          <h3>{name}</h3>
          <p className={styles.price}>{price}</p>
          <p className={styles.desc}>{desc}</p>
          <ul>
            {features.map(f => <li key={f}>✅ {f}</li>)}
          </ul>
          <a href="https://portal.clubily.com.br/signup" className={styles.btn}>
            Começar
          </a>
        </div>
      ))}
    </div>
  );
}
