// src/components/CalendarRange/CalendarRange.tsx
'use client';

import React, { useState } from 'react';
import styles from './CalendarRange.module.css';

interface CalendarRangeProps {
  selectedStartDate: Date | null;
  selectedEndDate: Date | null;
  /** 
   * @param start data de início (sempre preenchida)
   * @param end   data de fim ou null se ainda não selecionado
   */
  onRangeChange: (start: Date, end: Date | null) => void;
}

export default function CalendarRange({
  selectedStartDate,
  selectedEndDate,
  onRangeChange
}: CalendarRangeProps) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // constrói grid de datas
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  const prevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (date: Date) => {
    // 1) Se não há início, ou já existe intervalo completo, reinicia start
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      onRangeChange(date, null);
    }
    // 2) Se há só start, define end ou reinicia se escolheu data menor
    else if (selectedStartDate && !selectedEndDate) {
      if (date >= selectedStartDate) {
        onRangeChange(selectedStartDate, date);
      } else {
        onRangeChange(date, null);
      }
    }
  };

  const isInRange = (day: Date) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return day > selectedStartDate && day < selectedEndDate;
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.header}>
        <button onClick={prevMonth} className={styles.navButton}>⟵</button>
        <div className={styles.monthYear}>
          {currentDate.toLocaleString('default', { month: 'long' })} {year}
        </div>
        <button onClick={nextMonth} className={styles.navButton}>⟶</button>
      </div>

      <div className={styles.weekDays}>
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d,i) => (
          <div key={i} className={styles.weekDay}>{d}</div>
        ))}
      </div>

      <div className={styles.daysGrid}>
        {days.map((day, idx) => {
          if (!day) return <div key={idx} className={styles.day}/>;
          const isStart = selectedStartDate?.toDateString() === day.toDateString();
          const isEnd   = selectedEndDate  ?.toDateString() === day.toDateString();
          const inRange = isInRange(day);

          return (
            <div
              key={idx}
              className={[
                styles.day,
                isStart ? styles.startDay : '',
                isEnd   ? styles.endDay   : '',
                inRange ? styles.inRangeDay : ''
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
