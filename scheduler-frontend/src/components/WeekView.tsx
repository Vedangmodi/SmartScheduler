import React from 'react';
import type { Slot } from '../types';
import { formatTime, getDayName, formatDate, formatDateForAPI } from '../utils/dateUtils';
import SlotForm from './SlotForm';

interface DayColumnProps {
  date: Date;
  slots: Slot[];
  onAddSlot: (date: string, startTime: string, endTime: string, isRecurring: boolean) => void;
  onEditSlot: (slot: Slot) => void;
  onDeleteSlot: (id: string) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({ date, slots, onAddSlot, onEditSlot, onDeleteSlot }) => {
  const [showForm, setShowForm] = React.useState(false);
  
  const handleSubmit = (startTime: string, endTime: string, isRecurring: boolean) => {
    if (slots.length >= 2) {
      return; // Silently prevent adding more slots
    }
    onAddSlot(formatDateForAPI(date), startTime, endTime, isRecurring);
    setShowForm(false);
  };
  
  return (
    <div className="flex-1 border-r border-gray-200 last:border-r-0 min-h-[600px]">
      <div className="text-center p-2 bg-gray-50 border-b border-gray-200">
        <div className="font-semibold">{getDayName(date)}</div>
        <div className="text-sm text-gray-600">{formatDate(date)}</div>
      </div>
      
      <div className="p-2">
        {slots.length === 0 ? (
          <div className="text-center text-gray-500 py-4">No slots</div>
        ) : (
          slots.map(slot => (
            <div 
              key={slot.id} 
              className="bg-blue-100 border border-blue-300 rounded p-2 mb-2 cursor-pointer hover:bg-blue-200"
              onClick={() => onEditSlot(slot)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSlot(slot.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
              {slot.is_recurring && (
                <div className="text-xs text-blue-600 mt-1">Recurring</div>
              )}
            </div>
          ))
        )}
        
        <button
          onClick={() => {
            if (slots.length >= 2) {
              return; // Silently prevent adding more slots
            }
            setShowForm(true);
          }}
          className="w-full py-2 text-center text-blue-500 hover:bg-blue-50 rounded border border-dashed border-blue-300 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={slots.length >= 2}
        >
          + Add Slot {slots.length >= 2 && '(Max reached)'}
        </button>
        
        {showForm && (
          <div className="mt-2">
            <SlotForm
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface WeekViewProps {
  week: {
    startDate: string;
    endDate: string;
    dates: Date[];
    slots: Slot[];
  };
  onAddSlot: (date: string, startTime: string, endTime: string, isRecurring: boolean) => void;
  onEditSlot: (slot: Slot) => void;
  onDeleteSlot: (id: string) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ week, onAddSlot, onEditSlot, onDeleteSlot }) => {
  // Group slots by date
  const slotsByDate = week.slots.reduce((acc, slot) => {
    const slotDate = slot.date; // already YYYY-MM-DD from API
    if (!acc[slotDate]) {
      acc[slotDate] = [];
    }
    acc[slotDate].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex">
        {week.dates.map(date => (
          <DayColumn
            key={date.toISOString()}
            date={date}
            slots={slotsByDate[formatDateForAPI(date)] || []}
            onAddSlot={onAddSlot}
            onEditSlot={onEditSlot}
            onDeleteSlot={onDeleteSlot}
          />
        ))}
      </div>
    </div>
  );
};

export default WeekView;