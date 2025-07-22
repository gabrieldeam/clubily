import styles from './page.module.css';

export const metadata = { title: 'FAQ • Clubily' };

const faqs = [
  {
    q: 'Como funcionam os créditos?',
    a: 'Cada R$1 em créditos equivale a unidade que será consumida quando você distribui cashback, pontos ou carimbos.'
  },
  {
    q: 'Os créditos expiram?',
    a: 'Não. Eles ficam disponíveis em sua conta até serem usados.'
  },
  {
    q: 'Posso mudar de plano a qualquer momento?',
    a: 'Sim, você pode fazer upgrade ou downgrade sem multas.'
  },
  {
    q: 'Clubily é compatível com meu sistema de vendas?',
    a: 'Temos integração via API REST e plugins para as principais plataformas. Caso precise de algo personalizado, nosso time de integração pode ajudar.'
  }
];

export default function FAQ() {
  return (
    <section className={styles.wrapper}>
      <h1>Perguntas Frequentes</h1>
      <ul className={styles.list}>
        {faqs.map(({ q, a }) => (
          <li key={q} className={styles.item}>
            <details>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
