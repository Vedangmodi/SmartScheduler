export interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  date: string;
  is_recurring: boolean;
  exception_id?: string;
}

export interface WeekData {
  startDate: string;
  endDate: string;
  slots: Slot[];
}