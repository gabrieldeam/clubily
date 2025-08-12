// src/components/CalendarRange/CalendarRange.tsx
'use client';

import React, { useEffect, useState } from 'react';
import styles from './CalendarRange.module.css';

interface CalendarRangeProps {
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
  /**
   * Dispara:
   * - no 1º clique: (start, null) para indicar início;
   * - no 2º clique: (start, end) para fechar o intervalo.
   */
  onRangeChange: (start: Date, end: Date | null) => void;
}

export default function CalendarRange({
  selectedStartDate,
  selectedEndDate,
  onRangeChange,
}: CalendarRangeProps) {
  const today = new Date();

  // Estado interno do "rascunho" do intervalo
  const [draftStart, setDraftStart] = useState<Date | null>(null);
  const [draftEnd, setDraftEnd] = useState<Date | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Chaves simples para deps (evita expressões complexas)
  const startKey = selectedStartDate ? selectedStartDate.getTime() : null;
  const endKey = selectedEndDate ? selectedEndDate.getTime() : null;

  // Sincroniza com as props apenas quando NÃO estamos no meio de uma seleção
  useEffect(() => {
    if (isSelecting) return;

    const start = startKey != null ? new Date(startKey) : null;
    const end = endKey != null ? new Date(endKey) : null;

    setDraftStart(start);
    setDraftEnd(end);
  }, [isSelecting, startKey, endKey]);

  // Mês exibido
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Dom ... 6=Sáb

  // Grid de dias (preenche espaços vazios do início do mês)
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Helpers
  const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const sameDay = (a: Date | null, b: Date | null) =>
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isBetween = (d: Date, a: Date, b: Date) => {
    const nd = normalize(d).getTime();
    const na = normalize(a).getTime();
    const nb = normalize(b).getTime();
    return nd > Math.min(na, nb) && nd < Math.max(na, nb);
  };

  const handleDayClick = (date: Date) => {
    const d = normalize(date);

    // 1) Sem início OU já havia intervalo completo → recomeça seleção
    if (!draftStart || (draftStart && draftEnd)) {
      setIsSelecting(true);
      setDraftStart(d);
      setDraftEnd(null);
      onRangeChange(d, null);
      return;
    }

    // 2) Há início e ainda não há fim
    if (draftStart && !draftEnd) {
      if (d >= normalize(draftStart)) {
        // fecha o intervalo
        setDraftEnd(d);
        setIsSelecting(false);
        onRangeChange(draftStart, d);
      } else {
        // clicou antes do início → reinicia início
        setIsSelecting(true);
        setDraftStart(d);
        setDraftEnd(null);
        onRangeChange(d, null);
      }
    }
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <button onClick={prevMonth} className={styles.navButton} aria-label="Mês anterior">
          ⟵
        </button>
        <div className={styles.monthYear}>
          {currentDate.toLocaleString('pt-BR', { month: 'long' })} {year}
        </div>
        <button onClick={nextMonth} className={styles.navButton} aria-label="Próximo mês">
          ⟶
        </button>
      </div>

      <div className={styles.weekDays}>
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d, i) => (
          <div key={i} className={styles.weekDay}>
            {d}
          </div>
        ))}
      </div>

      <div className={styles.daysGrid}>
        {days.map((day, idx) => {
          if (!day) return <div key={idx} className={styles.day} />;

          const isStart = sameDay(draftStart, day);
          const isEnd = sameDay(draftEnd, day);
          const inRange = draftStart && draftEnd ? isBetween(day, draftStart, draftEnd) : false;

          return (
            <div
              key={idx}
              className={[
                styles.day,
                isStart ? styles.startDay : '',
                isEnd ? styles.endDay : '',
                inRange ? styles.inRangeDay : '',
              ].join(' ')}
              onClick={() => handleDayClick(day)}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
