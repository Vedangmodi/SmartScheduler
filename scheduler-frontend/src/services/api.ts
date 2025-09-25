import type { Slot, WeekData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export const api = {
  // Fetch slots for a specific week
  getWeekSlots: async (startDate: string, endDate: string): Promise<WeekData> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/slots?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch slots`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error fetching slots:', error);
      throw error;
    }
  },

  // Create a new slot
  createSlot: async (slotData: Omit<Slot, 'id' | 'created_at' | 'updated_at'>): Promise<Slot> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slotData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create slot`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error creating slot:', error);
      throw error;
    }
  },

  // Update a slot
  updateSlot: async (id: string, slotData: Partial<Slot>): Promise<Slot> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/slots/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slotData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update slot`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error updating slot:', error);
      throw error;
    }
  },

  // ✅ FIX: Delete a slot (regular endpoint for both recurring and non-recurring)
  deleteSlot: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/slots/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete slot`);
      }
    } catch (error) {
      console.error('API Error deleting slot:', error);
      throw error;
    }
  },

  // ✅ NEW: Delete entire recurring slot series (only for recurring slots)
  deleteRecurringSlotSeries: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/slots/${id}/series`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete recurring slot series`);
      }
    } catch (error) {
      console.error('API Error deleting recurring slot series:', error);
      throw error;
    }
  },
};