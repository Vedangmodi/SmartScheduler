// ✅ FIX: Proper UTC date handling to avoid timezone issues
export const getWeekDates = (date: Date): { startDate: string; endDate: string; dates: Date[] } => {
  // Use UTC to avoid timezone shifts
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utcDate.getUTCDay();
  const diff = utcDate.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  
  const startDate = new Date(utcDate);
  startDate.setUTCDate(diff);
  
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setUTCDate(startDate.getUTCDate() + i);
    dates.push(currentDate);
  }
  
  return {
    startDate: formatDateForAPI(startDate),
    endDate: formatDateForAPI(endDate),
    dates
  };
};

// ✅ FIX: Format date for API (YYYY-MM-DD)
export const formatDateForAPI = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ✅ FIX: Parse date string without timezone issues
export const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${period}`;
};

export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

// ✅ FIX: Check if same date using UTC
export const isSameDate = (date1: Date, date2: Date): boolean => {
  return date1.getUTCFullYear() === date2.getUTCFullYear() &&
         date1.getUTCMonth() === date2.getUTCMonth() &&
         date1.getUTCDate() === date2.getUTCDate();
};

// ✅ FIX: Get correct UTC day of week
export const getDayOfWeek = (date: Date): number => {
  return date.getUTCDay();
};

export const getTimePosition = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours + minutes / 60) * 64;
};

export const getDurationHeight = (startTime: string, endTime: string): number => {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotal = startHours + startMinutes / 60;
  const endTotal = endHours + endMinutes / 60;
  
  return (endTotal - startTotal) * 64;
};