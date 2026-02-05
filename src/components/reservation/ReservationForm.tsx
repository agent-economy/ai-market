'use client';

import { useState, useCallback } from 'react';

// ─── ICONS ───
const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const PhoneIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const ChatBubbleLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ─── TYPES ───
export interface ReservationFormData {
  name: string;
  phone: string;
  memo: string;
}

export interface ReservationFormProps {
  onSubmit: (data: ReservationFormData) => void | Promise<void>;
  initialData?: Partial<ReservationFormData>;
  selectedDate?: Date | null;
  selectedTime?: string | null;
  isLoading?: boolean;
  locale?: 'ko' | 'en';
  businessName?: string;
}

export interface ValidationErrors {
  name?: string;
  phone?: string;
}

// ─── HELPERS ───
function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format Korean phone number
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length <= 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
}

function formatDate(date: Date, locale: 'ko' | 'en'): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };
  return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', options);
}

function formatTime(time: string, locale: 'ko' | 'en'): string {
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

// ─── COMPONENT ───
export default function ReservationForm({
  onSubmit,
  initialData = {},
  selectedDate,
  selectedTime,
  isLoading = false,
  locale = 'ko',
  businessName,
}: ReservationFormProps) {
  const [formData, setFormData] = useState<ReservationFormData>({
    name: initialData.name || '',
    phone: initialData.phone || '',
    memo: initialData.memo || '',
  });
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation
  const validate = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = locale === 'ko' ? '이름을 입력해주세요' : 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = locale === 'ko' ? '이름은 2자 이상이어야 합니다' : 'Name must be at least 2 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = locale === 'ko' ? '연락처를 입력해주세요' : 'Phone is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = locale === 'ko' ? '올바른 연락처를 입력해주세요' : 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, locale]);

  // Handlers
  const handleChange = (field: keyof ReservationFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let value = e.target.value;
    
    // Format phone number
    if (field === 'phone') {
      value = formatPhoneNumber(value);
    }

    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user types
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: string) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, phone: true });
    
    if (!validate()) return;
    
    await onSubmit(formData);
  };

  const isComplete = selectedDate && selectedTime && formData.name && formData.phone && !Object.keys(errors).length;

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Card Container */}
      <div className="p-6 rounded-3xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 shadow-xl shadow-gray-200/30 dark:shadow-none">
        
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {locale === 'ko' ? '예약 정보 입력' : 'Reservation Details'}
          </h3>
          {businessName && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {businessName}
            </p>
          )}
        </div>

        {/* Selected Date & Time Summary */}
        {(selectedDate || selectedTime) && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedDate ? formatDate(selectedDate, locale) : (locale === 'ko' ? '날짜 미선택' : 'Date not selected')}
                </p>
                {selectedTime && (
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                    {formatTime(selectedTime, locale)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Name Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <UserIcon className="w-4 h-4" />
              {locale === 'ko' ? '예약자 이름' : 'Name'}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={handleChange('name')}
              onBlur={handleBlur('name')}
              placeholder={locale === 'ko' ? '홍길동' : 'John Doe'}
              className={`
                w-full px-4 py-3.5 rounded-2xl
                bg-white dark:bg-white/5
                border transition-all duration-200
                text-gray-900 dark:text-white
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2
                ${touched.name && errors.name
                  ? 'border-red-300 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/30'
                  : 'border-gray-200/50 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-indigo-200 dark:focus:ring-indigo-900/30'
                }
              `}
              disabled={isLoading}
            />
            {touched.name && errors.name && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.name}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <PhoneIcon className="w-4 h-4" />
              {locale === 'ko' ? '연락처' : 'Phone'}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={handleChange('phone')}
              onBlur={handleBlur('phone')}
              placeholder="010-1234-5678"
              maxLength={13}
              className={`
                w-full px-4 py-3.5 rounded-2xl
                bg-white dark:bg-white/5
                border transition-all duration-200
                text-gray-900 dark:text-white
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2
                ${touched.phone && errors.phone
                  ? 'border-red-300 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-900/30'
                  : 'border-gray-200/50 dark:border-white/10 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-indigo-200 dark:focus:ring-indigo-900/30'
                }
              `}
              disabled={isLoading}
            />
            {touched.phone && errors.phone && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.phone}
              </p>
            )}
          </div>

          {/* Memo Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <ChatBubbleLeftIcon className="w-4 h-4" />
              {locale === 'ko' ? '요청사항' : 'Notes'}
              <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">
                ({locale === 'ko' ? '선택' : 'Optional'})
              </span>
            </label>
            <textarea
              value={formData.memo}
              onChange={handleChange('memo')}
              placeholder={locale === 'ko' ? '요청사항이 있으시면 적어주세요' : 'Any special requests?'}
              rows={3}
              className="
                w-full px-4 py-3.5 rounded-2xl
                bg-white dark:bg-white/5
                border border-gray-200/50 dark:border-white/10
                text-gray-900 dark:text-white
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:border-indigo-500 dark:focus:border-indigo-500 
                focus:ring-indigo-200 dark:focus:ring-indigo-900/30
                resize-none transition-all duration-200
              "
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !selectedDate || !selectedTime}
            className={`
              w-full py-4 rounded-2xl font-bold text-lg
              transition-all duration-300
              flex items-center justify-center gap-2
              ${isComplete
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl shadow-indigo-300/30 dark:shadow-indigo-900/30 hover:scale-[1.02]'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }
              disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
            `}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{locale === 'ko' ? '예약 중...' : 'Booking...'}</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                <span>{locale === 'ko' ? '예약하기' : 'Book Now'}</span>
              </>
            )}
          </button>

          {/* Helper text */}
          {(!selectedDate || !selectedTime) && (
            <p className="text-center text-sm text-amber-600 dark:text-amber-400">
              {locale === 'ko' 
                ? '날짜와 시간을 먼저 선택해주세요'
                : 'Please select a date and time first'
              }
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
