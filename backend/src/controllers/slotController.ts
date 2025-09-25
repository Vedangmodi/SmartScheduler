import { Request, Response } from 'express';
import { SlotModel, CreateSlotData, UpdateSlotData } from '../models/Slot';

export class SlotController {
  // Get slots for a specific week
  static async getWeekSlots(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          error: 'Missing required parameters',
          message: 'startDate and endDate are required'
        });
      }

      const slots = await SlotModel.findByDateRange(startDate as string, endDate as string);
      
      // Filter out slots that have exceptions (are marked as deleted/modified)
      const activeSlots = slots.filter(slot => !slot.exception_id);
      
      res.json({
        startDate,
        endDate,
        slots: activeSlots
      });
    } catch (error) {
      console.error('Error fetching week slots:', error);
      res.status(500).json({
        error: 'Failed to fetch slots',
        message: 'An error occurred while fetching slots'
      });
    }
  }

  // Create a new slot
  static async createSlot(req: Request, res: Response) {
    try {
      console.log('📦 Request body received:', req.body);
      
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Request body is empty or missing'
        });
      }
      
      const { start_time, end_time, day_of_week, date, is_recurring } = req.body;
      
      // Validate required fields
      if (!start_time || !end_time || day_of_week === undefined || !date) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'start_time, end_time, day_of_week, and date are required'
        });
      }

      // Use the date as provided by frontend (YYYY-MM-DD format)
      const dateString = date.split('T')[0];
      
      // Validate the date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateString)) {
        return res.status(400).json({
          error: 'Invalid date format',
          message: 'Date must be in YYYY-MM-DD format'
        });
      }

      // Validate time format and logic
      if (start_time >= end_time) {
        return res.status(400).json({
          error: 'Invalid time range',
          message: 'End time must be after start time'
        });
      }

      // Check slot limit for the date
      const existingSlots = await SlotModel.findByDate(dateString);
      const activeSlotsCount = existingSlots.filter(slot => !slot.exception_id).length;
      
      if (activeSlotsCount >= 2) {
        return res.status(400).json({
          error: 'Maximum slots reached',
          message: 'Each date can have a maximum of 2 slots'
        });
      }

      const slotData: CreateSlotData = {
        start_time,
        end_time,
        day_of_week: parseInt(day_of_week),
        date: dateString,
        is_recurring: Boolean(is_recurring)
      };

      const newSlot = await SlotModel.create(slotData);

      // If it's recurring, create slots for future weeks with the SAME day of week
      if (is_recurring) {
        SlotController.createRecurringSlots(newSlot).catch(error => {
          console.error('Error creating recurring slots:', error);
        });
      }

      res.status(201).json({
        id: newSlot.id,
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        day_of_week: newSlot.day_of_week,
        date: newSlot.date,
        is_recurring: newSlot.is_recurring,
        exception_id: newSlot.exception_id,
        message: 'Slot created successfully'
      });
    } catch (error: any) {
      console.error('Error creating slot:', error);
      
      if (error.code === '23505') {
        return res.status(400).json({
          error: 'Duplicate slot',
          message: 'A slot with the same time already exists for this date'
        });
      }
      
      res.status(500).json({
        error: 'Failed to create slot',
        message: 'An error occurred while creating the slot'
      });
    }
  }

  // Update a slot (creates exception for recurring slots)
  static async updateSlot(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates: UpdateSlotData = req.body;

      const existingSlot = await SlotModel.findById(id);
      if (!existingSlot) {
        return res.status(404).json({
          error: 'Slot not found',
          message: 'The specified slot does not exist'
        });
      }

      // If updating a recurring slot, create an exception
      if (existingSlot.is_recurring && !existingSlot.exception_id) {
        const exceptionId = `exception_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        updates.exception_id = exceptionId;
        
        // Create a new slot with the updated data for this specific date
        const newSlotData: CreateSlotData = {
          start_time: updates.start_time || existingSlot.start_time,
          end_time: updates.end_time || existingSlot.end_time,
          day_of_week: existingSlot.day_of_week, // Keep original day of week
          date: existingSlot.date, // Keep original date
          is_recurring: false // This becomes a one-time exception
        };
        
        await SlotModel.create(newSlotData);
      }

      const updatedSlot = await SlotModel.update(id, updates);
      
      if (!updatedSlot) {
        return res.status(500).json({
          error: 'Failed to update slot',
          message: 'An error occurred while updating the slot'
        });
      }

      res.json(updatedSlot);
    } catch (error) {
      console.error('Error updating slot:', error);
      res.status(500).json({
        error: 'Failed to update slot',
        message: 'An error occurred while updating the slot'
      });
    }
  }

  // Delete a slot (creates exception for recurring slots)
  static async deleteSlot(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingSlot = await SlotModel.findById(id);
      if (!existingSlot) {
        return res.status(404).json({
          error: 'Slot not found',
          message: 'The specified slot does not exist'
        });
      }

      // If deleting a recurring slot, create an exception instead of deleting
      if (existingSlot.is_recurring && !existingSlot.exception_id) {
        const exceptionId = `exception_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Mark the original recurring slot as having an exception for this date
        await SlotModel.update(id, { exception_id: exceptionId });
        
        res.json({
          message: 'Recurring slot marked as exception for this date',
          exception_id: exceptionId
        });
      } else {
        // Delete non-recurring slots or exceptions
        const deleted = await SlotModel.delete(id);
        
        if (!deleted) {
          return res.status(500).json({
            error: 'Failed to delete slot',
            message: 'An error occurred while deleting the slot'
          });
        }

        res.json({ message: 'Slot deleted successfully' });
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      res.status(500).json({
        error: 'Failed to delete slot',
        message: 'An error occurred while deleting the slot'
      });
    }
  }

  // ✅ FIX: Helper method to create recurring slots with CORRECT day of week
  private static async createRecurringSlots(originalSlot: any) {
  try {
    const originalDate = new Date(originalSlot.date);
    const targetDayOfWeek = originalSlot.day_of_week; // The day we want to replicate
    
    console.log(`Creating recurring slots for day ${targetDayOfWeek} starting from ${originalSlot.date}`);
    
    // Create slots for the next 12 weeks (as per assignment)
    for (let week = 1; week <= 12; week++) {
      // Calculate the date for the same day of week in future weeks
      const futureDate = new Date(originalDate);
      
      // ✅ FIX: Add +1 day from the second week onwards
      if (week >= 1) {
        futureDate.setDate(originalDate.getDate() + (week * 7) + 1);
      } else {
        futureDate.setDate(originalDate.getDate() + (week * 7));
      }
      
      const futureDateString = futureDate.toISOString().split('T')[0];
      
      console.log(`Week ${week}: Creating slot for ${futureDateString} (day ${futureDate.getDay()})`);
      
      // Check if this future date already has 2 slots
      const existingCount = await SlotModel.countByDate(futureDateString);
      if (existingCount >= 2) {
        console.log(`Skipping ${futureDateString}: already has ${existingCount} slots`);
        continue;
      }

      const futureSlotData: CreateSlotData = {
        start_time: originalSlot.start_time,
        end_time: originalSlot.end_time,
        day_of_week: targetDayOfWeek, // Use the original day of week
        date: futureDateString,
        is_recurring: true
      };

      await SlotModel.create(futureSlotData);
      console.log(`✅ Created recurring slot for ${futureDateString}`);
    }
  } catch (error) {
    console.error('Error creating recurring slots:', error);
  }
}

  // ✅ NEW: Method to delete ALL instances of a recurring slot
  static async deleteRecurringSlotSeries(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const originalSlot = await SlotModel.findById(id);
      if (!originalSlot) {
        return res.status(404).json({
          error: 'Slot not found',
          message: 'The specified slot does not exist'
        });
      }

      if (!originalSlot.is_recurring) {
        return res.status(400).json({
          error: 'Not a recurring slot',
          message: 'This slot is not part of a recurring series'
        });
      }

      // Find and delete all slots in this recurring series
      const seriesSlots = await SlotModel.findRecurringSeries(originalSlot);
      let deletedCount = 0;

      for (const slot of seriesSlots) {
        const deleted = await SlotModel.delete(slot.id);
        if (deleted) deletedCount++;
      }

      res.json({
        message: `Deleted ${deletedCount} slots from recurring series`,
        deleted_count: deletedCount
      });
    } catch (error) {
      console.error('Error deleting recurring slot series:', error);
      res.status(500).json({
        error: 'Failed to delete recurring slot series',
        message: 'An error occurred while deleting the slot series'
      });
    }
  }
}