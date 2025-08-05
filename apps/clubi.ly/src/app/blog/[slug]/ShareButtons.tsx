'use client';
import styles from './page.module.css';
import Image from 'next/image';

import { Facebook, Twitter, Linkedin, Copy } from 'lucide-react';

export default function ShareButtons() {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const encoded = encodeURIComponent(url);

  const share = (platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp') => {
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encoded}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encoded}`;
        break;
    }
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copiado!');
    } catch {
      alert('Falha ao copiar link');
    }
  };

  return (
    <div className={styles.shareButtons}>
      <button onClick={() => share('facebook')} aria-label="Facebook">
        <Facebook />
      </button>
      <button onClick={() => share('twitter')} aria-label="Twitter">
        <Twitter />
      </button>
      <button onClick={() => share('linkedin')} aria-label="LinkedIn">
        <Linkedin />
      </button>
      <button onClick={() => share('whatsapp')} aria-label="WhatsApp">
        <Image
          src="/whatsapp.svg"
          alt="WhatsApp"
          width={20}
          height={20}
          priority
        />
      </button>
      <button onClick={copyLink} aria-label="Copiar link">
        <Copy />
      </button>
    </div>
  );
}
