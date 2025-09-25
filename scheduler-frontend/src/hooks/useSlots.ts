import { useState, useCallback } from 'react';
import type { Slot, WeekData } from '../types';
import { api } from '../services/api';
import { getWeekDates, formatDateForAPI, getDayOfWeek } from '../utils/dateUtils';

export const useSlots = () => {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeek = useCallback(async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      setError(null);
      const weekData = await api.getWeekSlots(startDate, endDate);
      
      setWeeks(prev => {
        const existingIndex = prev.findIndex(
          w => w.startDate === weekData.startDate && w.endDate === weekData.endDate
        );
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = weekData;
          return updated;
        }
        
        return [...prev, weekData];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSlot = async (slotData: Omit<Slot, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      
      const slotDate = new Date(slotData.date);
      const correctedSlotData = {
        ...slotData,
        date: formatDateForAPI(slotDate),
        day_of_week: getDayOfWeek(slotDate)
      };

      const newSlot = await api.createSlot(correctedSlotData);
      
      // Refresh the current week to get the latest data
      const { startDate: weekStart, endDate: weekEnd } = getWeekDates(slotDate);
      await fetchWeek(weekStart, weekEnd);
      
      // If it's recurring, also refresh the next few weeks
      if (slotData.is_recurring) {
        for (let week = 1; week <= 4; week++) {
          const futureDate = new Date(slotDate);
          futureDate.setDate(slotDate.getDate() + (week * 7));
          const { startDate: futureWeekStart, endDate: futureWeekEnd } = getWeekDates(futureDate);
          await fetchWeek(futureWeekStart, futureWeekEnd);
        }
      }
      
      return newSlot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create slot';
      setError(errorMessage);
      throw err;
    }
  };

  const updateSlot = async (id: string, slotData: Partial<Slot>) => {
    try {
      setError(null);
      const updatedSlot = await api.updateSlot(id, slotData);
      
      // Refresh all weeks to ensure UI updates
      const currentWeeks = [...weeks];
      for (const week of currentWeeks) {
        await fetchWeek(week.startDate, week.endDate);
      }
      
      return updatedSlot;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update slot';
      setError(errorMessage);
      throw err;
    }
  };

  // ✅ FIX: Delete slot with option to delete series or single instance
  const deleteSlot = async (id: string, deleteSeries: boolean = false) => {
    try {
      setError(null);
      
      if (deleteSeries) {
        // Delete entire recurring series
        await api.deleteRecurringSlotSeries(id);
      } else {
        // Delete single slot (creates exception for recurring slots)
        await api.deleteSlot(id);
      }
      
      // Refresh ALL weeks to ensure UI updates properly
      const currentWeeks = [...weeks];
      setWeeks([]); // Clear weeks to force refresh
      
      for (const week of currentWeeks) {
        await fetchWeek(week.startDate, week.endDate);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete slot';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    weeks,
    loading,
    error,
    fetchWeek,
    createSlot,
    updateSlot,
    deleteSlot,
  };
};