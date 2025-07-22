import styles from './Testimonial.module.css';

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  company: string;
}

export default function Testimonial({ quote, author, role, company }: TestimonialProps) {
  return (
    <div className={styles.card}>
      <div className={styles.quoteMark}>“</div>
      <p className={styles.quote}>{quote}</p>
      <div className={styles.author}>
        <strong>{author}</strong>
        <div>
          {role}{company && `, ${company}`}
        </div>
      </div>
    </div>
  );
}