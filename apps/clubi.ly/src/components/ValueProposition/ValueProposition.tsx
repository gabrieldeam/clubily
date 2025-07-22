import styles from './ValueProposition.module.css';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ValuePropositionProps {
  title: string;
  description: string;
  features: Feature[];
  image: string;
  cta: {
    text: string;
    link: string;
  };
  bgColor: 'light' | 'gradient';
  reverse?: boolean;
}

export default function ValueProposition({
  title,
  description,
  features,
  image,
  cta,
  bgColor,
  reverse = false
}: ValuePropositionProps) {
  return (
    <section className={`${styles.section} ${styles[bgColor]} ${reverse ? styles.reverse : ''}`}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h2>{title}</h2>
          <p className={styles.description}>{description}</p>
          
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <a href={cta.link} className={styles.ctaButton}>
            {cta.text}
          </a>
        </div>
        
        <div className={styles.imageContainer}>
          {/* Placeholder para imagem */}
          <div className={styles.imagePlaceholder}>
            <div className={styles.imageCaption}>Imagem ilustrativa da plataforma</div>
          </div>
        
        </div>
      </div>
    </section>
  );
}