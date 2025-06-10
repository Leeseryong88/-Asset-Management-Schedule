
import { Schedule } from "../types";

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

export const getDayOfWeek = (year: number, month: number, day: number): number => {
  return new Date(year, month, day).getDay(); // 0 (Sun) - 6 (Sat)
};

// Helper function to parse 'YYYY-MM-DD' string as a local Date object
export const createDateFromISO = (dateString: string): Date => {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    // Return an invalid date or throw error if format is incorrect,
    // For now, let's assume valid input or rely on downstream checks.
    // console.warn("Invalid date string for createDateFromISO:", dateString);
    // Fallback to let new Date handle it, which might be UTC.
    // Or better, be strict:
    const [year, month, day] = dateString.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      console.error("Invalid date string components:", dateString);
      return new Date(NaN); // Return an invalid date
    }
    return new Date(year, month - 1, day); // month is 0-indexed
  }
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

export const formatDateISO = (date: Date): string => {
  // Ensures the date is formatted based on its local components
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentDateISO = (): string => {
  return formatDateISO(new Date());
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isDateInRange = (date: Date, startDateInput: Date | string, endDateInput: Date | string): boolean => {
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()); // Normalize to remove time

  const startDate = typeof startDateInput === 'string' ? createDateFromISO(startDateInput) : new Date(startDateInput.getFullYear(), startDateInput.getMonth(), startDateInput.getDate());
  const endDate = typeof endDateInput === 'string' ? createDateFromISO(endDateInput) : new Date(endDateInput.getFullYear(), endDateInput.getMonth(), endDateInput.getDate());
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error("Invalid start or end date in isDateInRange");
    return false;
  }
  return checkDate >= startDate && checkDate <= endDate;
};

export const formatDateToDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const date = createDateFromISO(dateString); // Use helper for consistency
  if (isNaN(date.getTime())) return "유효하지 않은 날짜";
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateRange = (startDateString: string, endDateString: string): string => {
  const start = formatDateToDisplay(startDateString);
  const end = formatDateToDisplay(endDateString);
  if (start === end) {
    return start;
  }
  return `${start} - ${end}`;
};

export const getSchedulesForDate = (schedules: Schedule[], targetDate: Date): Schedule[] => {
  // targetDate is already a local Date object from CalendarView or App
  const targetDateNormalized = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  return schedules.filter(schedule => {
    // schedule.startDate and schedule.endDate are 'YYYY-MM-DD' strings
    const scheduleStartDate = createDateFromISO(schedule.startDate);
    const scheduleEndDate = createDateFromISO(schedule.endDate);
    
    if (isNaN(scheduleStartDate.getTime()) || isNaN(scheduleEndDate.getTime())) {
      console.warn("Skipping schedule with invalid date:", schedule);
      return false;
    }
    return targetDateNormalized >= scheduleStartDate && targetDateNormalized <= scheduleEndDate;
  }).sort((a,b) => createDateFromISO(a.startDate).getTime() - createDateFromISO(b.startDate).getTime());
};
