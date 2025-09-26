// ✅ FIX: Simple date handling without timezone complications
export const getWeekDates = (date: Date): { startDate: string; endDate: string; dates: Date[] } => {
  const localDate = new Date(date);
  const day = localDate.getDay();
  const diff = localDate.getDate() - day + (day === 0 ? -6 : 1);
  
  const startDate = new Date(localDate);
  startDate.setDate(diff);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    dates.push(currentDate);
  }
  
  return {
    startDate: formatDateForAPI(startDate),
    endDate: formatDateForAPI(endDate),
    dates
  };
};

// Simple date formatting
export const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Simple date parsing
export const parseDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
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

export const isSameDate = (date1: Date, date2: Date): boolean => {
  return date1.toDateString() === date2.toDateString();
};

export const getDayOfWeek = (date: Date): number => {
  return date.getDay();
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