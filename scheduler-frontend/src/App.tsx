import { useState, useCallback, useEffect, useRef } from 'react';
import EditSlotModal from './components/EditSlotModal';
import SlotForm from './components/SlotForm';
import { useSlots } from './hooks/useSlots';
import { getWeekDates, formatDate, isSameDate, formatDateForAPI, parseDateString } from './utils/dateUtils';
import type { Slot } from './types';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { weeks, loading, error, fetchWeek, createSlot, updateSlot, deleteSlot } = useSlots();
  const loadingRef = useRef(false);

  // Check screen size and set view mode
  useEffect(() => {
    const checkScreenSize = () => {
      setViewMode(window.innerWidth >= 768 ? 'desktop' : 'mobile');
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Load initial week
  useEffect(() => {
    const { startDate, endDate } = getWeekDates(currentDate);
    fetchWeek(startDate, endDate);
  }, [currentDate, fetchWeek]);

  // Handle infinite scroll for mobile - load more weeks
  const handleScroll = useCallback(() => {
    if (viewMode === 'desktop' || loadingRef.current || loading) return;
    
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.offsetHeight;
    
    if (scrollPosition >= documentHeight - 200) {
      loadingRef.current = true;
      
      // Load next 4 weeks (1 month ahead)
      const startDate = new Date(currentDate);
      for (let week = 1; week <= 4; week++) {
        const nextWeek = new Date(startDate);
        nextWeek.setDate(startDate.getDate() + (week * 7));
        const { startDate: weekStart, endDate: weekEnd } = getWeekDates(nextWeek);
        fetchWeek(weekStart, weekEnd);
      }
      
      // Reset loading ref after a short delay
      setTimeout(() => {
        loadingRef.current = false;
      }, 1000);
    }
  }, [currentDate, loading, viewMode, fetchWeek]);

  useEffect(() => {
    if (viewMode === 'mobile') {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, viewMode]);

  // Desktop navigation
  const handlePreviousWeek = () => {
    const prevWeek = new Date(currentDate);
    prevWeek.setDate(currentDate.getDate() - 7);
    setCurrentDate(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentDate);
    nextWeek.setDate(currentDate.getDate() + 7);
    setCurrentDate(nextWeek);
  };

const handleAddSlot = async (date: string, startTime: string, endTime: string, isRecurring: boolean) => {
  try {
    // ✅ FIX: Use correct date and day_of_week
    const slotDate = new Date(date);
    const dayOfWeek = slotDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if the date already has 2 slots
    const allSlotsForDate = weeks.flatMap(week => 
      week.slots.filter(slot => slot.date === date)
    );
    
    if (allSlotsForDate.length >= 2) {
      console.warn('Maximum of 2 slots per day reached');
      return;
    }
    
    await createSlot({
      start_time: startTime,
      end_time: endTime,
      day_of_week: dayOfWeek, // ✅ Use correct day of week
      date: date,
      is_recurring: isRecurring,
    });
    setSelectedDate(null);
    setHasUnsavedChanges(true);
  } catch (error) {
    console.error('Failed to create slot:', error);
  }
};

  const handleEditSlot = (slot: Slot) => {
    console.log('Edit slot clicked:', slot);
    setEditingSlot(slot);
  };

  const handleSaveSlot = async (id: string, startTime: string, endTime: string, isRecurring: boolean) => {
    try {
      console.log('Save slot clicked:', { id, startTime, endTime, isRecurring });
      await updateSlot(id, {
        start_time: startTime,
        end_time: endTime,
        is_recurring: isRecurring,
      });
      setEditingSlot(null);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to update slot:', error);
    }
  };

  const handleDeleteSlot = async (id: string, deleteSeries: boolean = false) => {
  try {
    console.log('Delete slot clicked:', id, 'deleteSeries:', deleteSeries);
    await deleteSlot(id, deleteSeries);
    setEditingSlot(null);
    setHasUnsavedChanges(true);
  } catch (error) {
    console.error('Failed to delete slot:', error);
  }
};

  const handleSaveChanges = () => {
    // In a real app, this would save to backend
    // For now, we'll just mark as saved
    setHasUnsavedChanges(false);
    // You could add a toast notification here
    console.log('Changes saved successfully!');
  };

  const currentWeek = getWeekDates(currentDate);
  const currentWeekData = weeks.find(
    w => w.startDate === currentWeek.startDate && w.endDate === currentWeek.endDate
  );

  const handleDateSelect = (date: Date) => {
    const dateString = formatDateForAPI(date);
    const daySlots = currentWeekData?.slots.filter(slot => slot.date === dateString) || [];
    
    if (daySlots.length >= 2) {
      return; // Silently prevent adding more slots
    }
    
    setSelectedDate(dateString);
    setShowDatePicker(true);
  };

  // Render desktop view
  const renderDesktopView = () => {
    return (
      <div className="flex-1 flex flex-col">
        {/* Desktop Header */}
        <div className="flex items-center justify-between p-6 bg-white border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">Weekly Schedule</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePreviousWeek}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-medium text-gray-800">
              {currentWeek.dates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <button 
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Save Changes
                </button>
              )}
              <button 
                onClick={() => {
                  setSelectedDate(formatDateForAPI(new Date()));
                  setShowDatePicker(true);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                + Add Slot
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Calendar */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-full bg-white">
            {/* Day Headers */}
            <div className="grid grid-cols-8 border-b border-gray-200">
              <div className="p-4 font-medium text-gray-500">Time</div>
              {currentWeek.dates.map((date, index) => {
                const isToday = isSameDate(date, new Date());
                return (
                  <div key={index} className="p-4 text-center">
                    <div className={`text-sm font-medium ${isToday ? 'text-purple-600' : 'text-gray-800'}`}>
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-purple-600' : 'text-gray-800'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Slots */}
            <div className="grid grid-cols-8">
              <div className="border-r border-gray-200">
                {/* Time labels */}
                {Array.from({ length: 24 }).map((_, hour) => {
                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                  const period = hour < 12 ? 'AM' : 'PM';
                  return (
                    <div key={hour} className="h-16 border-b border-gray-100 flex items-center justify-end pr-2 text-sm text-gray-500">
                      {hour % 2 === 0 && `${displayHour}:00 ${period}`}
                    </div>
                  );
                })}
              </div>
              
              {/* Day columns */}
              {currentWeek.dates.map((date, dayIndex) => {
                const dateString = formatDateForAPI(date);
                const daySlots = currentWeekData?.slots.filter(slot => slot.date === dateString) || [];
                
                return (
                  <div key={dayIndex} className="relative border-r border-gray-200 last:border-r-0">
                    {/* Time grid */}
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <div key={hour} className="h-16 border-b border-gray-100"></div>
                    ))}
                    
                    {/* Slots */}
                    {daySlots.map((slot) => {
                      const [startHour, startMinute] = slot.start_time.split(':').map(Number);
                      const [endHour, endMinute] = slot.end_time.split(':').map(Number);
                      const startPosition = (startHour + startMinute / 60) * 64; // 64px per hour
                      const height = ((endHour + endMinute / 60) - (startHour + startMinute / 60)) * 64;
                      
                      return (
                        <div
                          key={slot.id}
                          className={`absolute rounded-lg p-2 cursor-pointer transition-colors ${
                            slot.exception_id
                              ? 'bg-yellow-100 border border-yellow-300 hover:bg-yellow-200'
                              : slot.is_recurring 
                                ? 'bg-blue-100 border border-blue-300 hover:bg-blue-200' 
                                : 'bg-purple-100 border border-purple-300 hover:bg-purple-200'
                          }`}
                          style={{
                            top: `${startPosition}px`,
                            height: `${height}px`,
                            width: 'calc(100% - 8px)',
                            left: '4px',
                          }}
                          onClick={() => handleEditSlot(slot)}
                        >
                          <div className={`text-sm font-medium ${
                            slot.exception_id 
                              ? 'text-yellow-800' 
                              : slot.is_recurring 
                                ? 'text-blue-800' 
                                : 'text-purple-800'
                          }`}>
                            {slot.start_time} - {slot.end_time}
                          </div>
                          {slot.is_recurring && !slot.exception_id && (
                            <div className="text-xs text-blue-600 mt-1 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                              </svg>
                              Recurring
                            </div>
                          )}
                          {slot.exception_id && (
                            <div className="text-xs text-yellow-600 mt-1 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Exception
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render mobile view
  const renderMobileView = () => {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="w-8"></div> {/* Spacer */}
          <h1 className="text-lg font-semibold text-gray-800">Your Schedule</h1>
          <div className="flex items-center space-x-2">
            {hasUnsavedChanges && (
              <button 
                onClick={handleSaveChanges}
                className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Save
              </button>
            )}
            <div className="w-8"></div> {/* Spacer */}
          </div>
        </div>

        {/* Calendar Section */}
        <div className="p-4 bg-white border-b border-gray-200">
          {/* Month/Year Selector */}
          <div className="flex items-center justify-center mb-4">
            <button 
              onClick={() => {
                const prevMonth = new Date(currentDate);
                prevMonth.setMonth(currentDate.getMonth() - 1);
                setCurrentDate(prevMonth);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 mr-2"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-gray-800 font-medium">
              {currentWeek.dates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={() => {
                const nextMonth = new Date(currentDate);
                nextMonth.setMonth(currentDate.getMonth() + 1);
                setCurrentDate(nextMonth);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 ml-2"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="flex justify-between mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={index} className="flex-1 text-center text-sm text-gray-500 font-medium">
                {day}
              </div>
            ))}
          </div>
          
          {/* Dates */}
          <div className="flex justify-between">
            {currentWeek.dates.map((date, index) => {
              const isToday = isSameDate(date, new Date());
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const dateString = formatDateForAPI(date);
              const daySlots = currentWeekData?.slots.filter(slot => slot.date === dateString) || [];
              
              return (
                <div 
                  key={index} 
                  className="flex-1 text-center cursor-pointer"
                  onClick={() => handleDateSelect(date)}
                >
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium ${
                    isToday 
                      ? 'bg-purple-600 text-white' 
                      : isCurrentMonth 
                        ? 'text-gray-800' 
                        : 'text-gray-400'
                  } ${selectedDate === dateString ? 'ring-2 ring-purple-400' : ''}`}>
                    {date.getDate()}
                  </div>
                  {daySlots.length > 0 && (
                    <div className="mt-1 flex justify-center">
                      {daySlots.map((_, i) => (
                        <div 
                          key={i}
                          className="w-1 h-1 bg-purple-500 rounded-full mx-0.5"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule List - Infinite Scroll */}
        <div className="flex-1 overflow-y-auto">
          {weeks.map((week) => (
            <div key={`${week.startDate}-${week.endDate}`}>
              {/* Week Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2 z-10">
                <div className="text-sm font-semibold text-gray-600">
                  Week of {parseDateString(week.startDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })} - {parseDateString(week.endDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
              
              {/* Week Days */}
              {getWeekDates(parseDateString(week.startDate)).dates.map((date, dayIndex) => {
                const isToday = isSameDate(date, new Date());
                const dateString = formatDateForAPI(date);
                const daySlots = week.slots.filter(slot => slot.date === dateString) || [];
                
                return (
                  <div key={`${week.startDate}-${dayIndex}`} className="border-b border-gray-100 last:border-b-0">
                    <div className="p-4">
                      <div className={`text-sm font-medium ${isToday ? 'text-purple-600' : 'text-gray-800'} mb-2`}>
                        {date.toLocaleDateString('en-US', { weekday: 'long' })}, {formatDate(date)}
                        {isToday && <span className="text-gray-500 ml-1">(Today)</span>}
                      </div>
                      
                      {daySlots.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                          No time slots
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {daySlots.map((slot) => (
                            <div 
                              key={slot.id}
                              className={`flex items-center justify-between p-3 border rounded-lg ${
                                slot.is_recurring 
                                  ? 'bg-blue-50 border-blue-100' 
                                  : 'bg-purple-50 border-purple-100'
                              } ${slot.exception_id ? 'bg-yellow-50 border-yellow-200' : ''}`}
                              onClick={() => handleEditSlot(slot)}
                            >
                              <div className="text-sm text-gray-800">
                                {slot.start_time} - {slot.end_time}
                                {slot.is_recurring && !slot.exception_id && (
                                  <span className="text-blue-600 text-xs ml-2 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                    </svg>
                                    Recurring
                                  </span>
                                )}
                                {slot.exception_id && (
                                  <span className="text-yellow-600 text-xs ml-2 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Exception
                                  </span>
                                )}
                              </div>
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* Loading indicator for infinite scroll */}
          {loading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="flex bg-white border-t border-gray-200">
          <button className="flex-1 flex flex-col items-center py-3">
            <svg className="w-6 h-6 text-gray-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs text-gray-600">Home</span>
          </button>
          
          <div className="w-px bg-gray-200"></div>
          
          <button className="flex-1 flex flex-col items-center py-3">
            <svg className="w-6 h-6 text-purple-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-purple-600">Schedule</span>
          </button>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={() => {
            setSelectedDate(formatDateForAPI(new Date()));
            setShowDatePicker(true);
          }}
          className="fixed bottom-20 right-4 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors flex items-center justify-center z-40"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className={`${viewMode === 'mobile' ? 'max-w-md mx-auto' : ''} bg-white h-screen flex flex-col`}>
        {viewMode === 'desktop' ? renderDesktopView() : renderMobileView()}

        {/* Combined Add Slot Modal */}
        {showDatePicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Add Time Slot</h2>
                <button
                  onClick={() => {
                    setShowDatePicker(false);
                    setSelectedDate(null);
                  }}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Choose Date</label>
                  <input
                    type="date"
                    value={selectedDate || formatDateForAPI(new Date())}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={formatDateForAPI(new Date())}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {selectedDate && (() => {
                    const allSlotsForDate = weeks.flatMap(week => 
                      week.slots.filter(slot => slot.date === selectedDate)
                    );
                    const slotCount = allSlotsForDate.length;
                    return (
                      <div className={`text-xs mt-1 ${slotCount >= 2 ? 'text-red-500' : 'text-gray-500'}`}>
                        {slotCount}/2 slots used {slotCount >= 2 && '(Maximum reached)'}
                      </div>
                    );
                  })()}
                </div>
                
                {selectedDate && (() => {
                  const allSlotsForDate = weeks.flatMap(week => 
                    week.slots.filter(slot => slot.date === selectedDate)
                  );
                  if (allSlotsForDate.length >= 2) {
                    return (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                        <div className="text-sm text-red-700">
                          <strong>Maximum slots reached</strong>
                          <p className="text-xs mt-1">This date already has 2 slots. Delete a slot to add a new one.</p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <SlotForm
                      onSubmit={(startTime: string, endTime: string, isRecurring: boolean) => {
                        handleAddSlot(selectedDate, startTime, endTime, isRecurring);
                        setShowDatePicker(false);
                        setSelectedDate(null);
                      }}
                      onCancel={() => {
                        setShowDatePicker(false);
                        setSelectedDate(null);
                      }}
                    />
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        )}
      </div>

      <EditSlotModal
        slot={editingSlot}
        onSave={handleSaveSlot}
        onDelete={handleDeleteSlot}
        onClose={() => setEditingSlot(null)}
        viewMode={viewMode}
      />
    </div>
  );
}

export default App;