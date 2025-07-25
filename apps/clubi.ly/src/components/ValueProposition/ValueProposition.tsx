import styles from './ValueProposition.module.css';
import Image from 'next/image';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}
type CornerRadius = string;

interface ValuePropositionProps {
  tag?: string;
  title: string;
  description: string;
  features: Feature[];
  image: string;
  cta: {
    text: string;
    link: string;
  };
  bgColor: 'light' | 'gradient';
  sectionBorderRadius?: CornerRadius;
  reverse?: boolean;
}

export default function ValueProposition({
  tag,
  title,
  description,
  features,
  image,
  cta,
  bgColor,
  sectionBorderRadius = '0',    
  reverse = false
}: ValuePropositionProps) {
  return (
    <section className={`${styles.section} ${styles[bgColor]} ${reverse ? styles.reverse : ''}`} style={{ borderRadius: sectionBorderRadius }}>
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.tag}>{tag}</p>
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
            <Image 
            src={image}
            alt={title}
            layout="fill"
            style={{ objectFit: 'cover' }}
            quality={100}
          />
          </div>      
          
        </div>
      </div>
    </section>
  );
}