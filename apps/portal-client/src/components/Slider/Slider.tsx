'use client';

import React, {
  ReactElement,
  useState,
  useEffect,
  Children,
  isValidElement,
  cloneElement,
} from 'react';
import styles from './Slider.module.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SliderProps {
  children: ReactElement<any>[];
  interval?: number; // ms
}

export default function Slider({
  children,
  interval = 5000,
}: SliderProps) {
  const [current, setCurrent] = useState(0);
  const count = Children.count(children);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % count);
    }, interval);
    return () => clearInterval(timer);
  }, [count, interval]);

  const goPrev = () => setCurrent((prev) => (prev - 1 + count) % count);
  const goNext = () => setCurrent((prev) => (prev + 1) % count);

  return (
    <div className={styles.wrapper}>
      <button className={styles.nav} onClick={goPrev}>
        <ChevronLeft />
      </button>
      <div
        className={styles.viewport}
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {Children.map(children, (child, idx) =>
          isValidElement(child)
            ? cloneElement(child as ReactElement<any>, {
                className: `${styles.slide} ${idx === current ? styles.active : ''}`,
              })
            : child
        )}
      </div>
      <button className={styles.nav} onClick={goNext}>
        <ChevronRight />
      </button>
    </div>
  );
}