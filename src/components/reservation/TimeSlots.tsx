'use client';

import { useMemo } from 'react';

// ─── ICONS ───
const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ─── TYPES ───
export interface TimeSlot {
  time: string; // "09:00", "09:30", etc.
  available: boolean;
  label?: string; // Optional custom label
}

export interface TimeSlotsProps {
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  slots?: TimeSlot[];
  startHour?: number; // Default: 9 (09:00)
  endHour?: number; // Default: 18 (18:00)
  interval?: 30 | 60; // Minutes, default: 30
  unavailableTimes?: string[];
  locale?: 'ko' | 'en';
}

// ─── HELPERS ───
function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function formatTimeLabel(time: string, locale: 'ko' | 'en'): string {
  const [hour, minute] = time.split(':').map(Number);
  
  if (locale === 'ko') {
    const period = hour < 12 ? '오전' : '오후';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${period} ${displayHour}:${minute.toString().padStart(2, '0')}`;
  } else {
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }
}

function generateDefaultSlots(
  startHour: number,
  endHour: number,
  interval: number,
  unavailableTimes: string[]
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const time = formatTime(hour, minute);
      slots.push({
        time,
        available: !unavailableTimes.includes(time),
      });
    }
  }
  
  // Add closing time slot if interval allows
  if (interval === 30) {
    const closingTime = formatTime(endHour, 0);
    if (!slots.find(s => s.time === closingTime)) {
      slots.push({
        time: closingTime,
        available: !unavailableTimes.includes(closingTime),
      });
    }
  }
  
  return slots;
}

// ─── COMPONENT ───
export default function TimeSlots({
  selectedTime,
  onSelectTime,
  slots,
  startHour = 9,
  endHour = 18,
  interval = 30,
  unavailableTimes = [],
  locale = 'ko',
}: TimeSlotsProps) {
  
  // Generate slots if not provided
  const timeSlots = useMemo(() => {
    if (slots && slots.length > 0) return slots;
    return generateDefaultSlots(startHour, endHour, interval, unavailableTimes);
  }, [slots, startHour, endHour, interval, unavailableTimes]);

  // Group slots by period (morning, afternoon, evening)
  const groupedSlots = useMemo(() => {
    const morning: TimeSlot[] = [];
    const afternoon: TimeSlot[] = [];
    const evening: TimeSlot[] = [];

    timeSlots.forEach(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      if (hour < 12) {
        morning.push(slot);
      } else if (hour < 18) {
        afternoon.push(slot);
      } else {
        evening.push(slot);
      }
    });

    return { morning, afternoon, evening };
  }, [timeSlots]);

  const availableCount = timeSlots.filter(s => s.available).length;

  const renderSlotButton = (slot: TimeSlot) => {
    const isSelected = selectedTime === slot.time;
    
    return (
      <button
        key={slot.time}
        onClick={() => slot.available && onSelectTime(slot.time)}
        disabled={!slot.available}
        className={`
          relative px-4 py-3 rounded-xl text-sm font-medium
          transition-all duration-200
          ${isSelected
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-300/30 dark:shadow-indigo-900/30 scale-105 ring-2 ring-indigo-300 dark:ring-indigo-600'
            : slot.available
            ? 'bg-white/60 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-500 hover:scale-105'
            : 'bg-gray-100 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through'
          }
        `}
      >
        {slot.label || formatTimeLabel(slot.time, locale)}
        {isSelected && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </span>
        )}
      </button>
    );
  };

  const renderPeriodSection = (
    title: string,
    icon: React.ReactNode,
    slots: TimeSlot[]
  ) => {
    if (slots.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
          {icon}
          <span>{title}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            ({slots.filter(s => s.available).length}/{slots.length})
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slots.map(renderSlotButton)}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Card Container */}
      <div className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-xl shadow-gray-200/30 dark:shadow-none">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <ClockIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">
                {locale === 'ko' ? '시간 선택' : 'Select Time'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {locale === 'ko' 
                  ? `${availableCount}개 시간대 예약 가능`
                  : `${availableCount} time slots available`
                }
              </p>
            </div>
          </div>
          
          {selectedTime && (
            <div className="px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
              {formatTimeLabel(selectedTime, locale)}
            </div>
          )}
        </div>

        {/* Time Slot Groups */}
        <div className="space-y-6">
          {renderPeriodSection(
            locale === 'ko' ? '오전' : 'Morning',
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0-5a1 1 0 011 1v2a1 1 0 11-2 0V3a1 1 0 011-1zm0 18a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z"/>
            </svg>,
            groupedSlots.morning
          )}
          
          {renderPeriodSection(
            locale === 'ko' ? '오후' : 'Afternoon',
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z"/>
            </svg>,
            groupedSlots.afternoon
          )}
          
          {renderPeriodSection(
            locale === 'ko' ? '저녁' : 'Evening',
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
            </svg>,
            groupedSlots.evening
          )}
        </div>

        {/* No slots message */}
        {availableCount === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">
              {locale === 'ko' 
                ? '예약 가능한 시간이 없습니다' 
                : 'No available time slots'
              }
            </p>
            <p className="text-sm mt-1">
              {locale === 'ko' 
                ? '다른 날짜를 선택해주세요' 
                : 'Please select another date'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
