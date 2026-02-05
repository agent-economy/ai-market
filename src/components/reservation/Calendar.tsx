'use client';

import { useState, useMemo } from 'react';

// ─── ICONS ───
const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

// ─── TYPES ───
export interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  availableDates?: Date[];
  unavailableDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
  locale?: 'ko' | 'en';
}

// ─── CONSTANTS ───
const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ─── HELPERS ───
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isDateInArray(date: Date, array: Date[]): boolean {
  return array.some(d => isSameDay(d, date));
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// ─── COMPONENT ───
export default function Calendar({
  selectedDate,
  onSelectDate,
  availableDates,
  unavailableDates = [],
  minDate,
  maxDate,
  locale = 'ko',
}: CalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const weekdays = locale === 'ko' ? WEEKDAYS_KO : WEEKDAYS_EN;
  const months = locale === 'ko' ? MONTHS_KO : MONTHS_EN;

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (Date | null)[] = [];

    // Empty cells for days before the first of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentYear, currentMonth, day));
    }

    return days;
  }, [currentMonth, currentYear]);

  // Navigation handlers
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Check if a date is available
  const isDateAvailable = (date: Date): boolean => {
    // Check min/max bounds
    if (minDate && date < new Date(minDate.setHours(0, 0, 0, 0))) return false;
    if (maxDate && date > new Date(maxDate.setHours(23, 59, 59, 999))) return false;

    // Check if in unavailable list
    if (isDateInArray(date, unavailableDates)) return false;

    // If availableDates is provided, date must be in that list
    if (availableDates && availableDates.length > 0) {
      return isDateInArray(date, availableDates);
    }

    // By default, past dates are unavailable
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (date < todayStart) return false;

    return true;
  };

  const isToday = (date: Date): boolean => isSameDay(date, today);
  const isSelected = (date: Date): boolean => selectedDate ? isSameDay(date, selectedDate) : false;

  // Can navigate to previous month?
  const canGoPrevious = useMemo(() => {
    if (!minDate) return true;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    return new Date(prevYear, prevMonth + 1, 0) >= minDate;
  }, [currentMonth, currentYear, minDate]);

  // Can navigate to next month?
  const canGoNext = useMemo(() => {
    if (!maxDate) return true;
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    return new Date(nextYear, nextMonth, 1) <= maxDate;
  }, [currentMonth, currentYear, maxDate]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card Container */}
      <div className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-xl shadow-gray-200/30 dark:shadow-none">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            disabled={!canGoPrevious}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {locale === 'ko' 
              ? `${currentYear}년 ${months[currentMonth]}`
              : `${months[currentMonth]} ${currentYear}`
            }
          </h2>
          
          <button
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Next month"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map((day, idx) => (
            <div
              key={day}
              className={`text-center text-xs font-semibold py-2 ${
                idx === 0 
                  ? 'text-red-500 dark:text-red-400' 
                  : idx === 6 
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const available = isDateAvailable(date);
            const selected = isSelected(date);
            const todayDate = isToday(date);
            const dayOfWeek = date.getDay();
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;

            return (
              <button
                key={date.toISOString()}
                onClick={() => available && onSelectDate(date)}
                disabled={!available}
                className={`
                  aspect-square flex items-center justify-center rounded-xl text-sm font-medium
                  transition-all duration-200 relative
                  ${selected
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-300/30 dark:shadow-indigo-900/30 scale-105'
                    : available
                    ? `hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:scale-105 cursor-pointer ${
                        isSunday 
                          ? 'text-red-500 dark:text-red-400' 
                          : isSaturday 
                          ? 'text-blue-500 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-200'
                      }`
                    : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }
                `}
              >
                {date.getDate()}
                {todayDate && !selected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-white/10 flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
            <span>{locale === 'ko' ? '선택됨' : 'Selected'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span>{locale === 'ko' ? '예약 불가' : 'Unavailable'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-indigo-500" />
            <span>{locale === 'ko' ? '오늘' : 'Today'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
