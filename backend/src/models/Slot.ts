import { db } from '../config/database';

export interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  day_of_week: number;
  date: string;
  is_recurring: boolean;
  exception_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSlotData {
  start_time: string;
  end_time: string;
  day_of_week: number;
  date: string;
  is_recurring: boolean;
}

export interface UpdateSlotData {
  start_time?: string;
  end_time?: string;
  is_recurring?: boolean;
  exception_id?: string;
}

export class SlotModel {
  static async create(slotData: CreateSlotData): Promise<Slot> {
    const id = `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [slot] = await db('slots')
      .insert({
        id,
        ...slotData
      })
      .returning('*');
    
    return slot;
  }

  static async findById(id: string): Promise<Slot | null> {
    const slot = await db('slots').where({ id }).first();
    return slot || null;
  }

  static async findByDateRange(startDate: string, endDate: string): Promise<Slot[]> {
    return db('slots')
      .whereBetween('date', [startDate, endDate])
      .orderBy('date')
      .orderBy('start_time');
  }

  static async findByDate(date: string): Promise<Slot[]> {
    return db('slots')
      .where({ date })
      .orderBy('start_time');
  }

  static async update(id: string, updates: UpdateSlotData): Promise<Slot | null> {
    const [slot] = await db('slots')
      .where({ id })
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .returning('*');
    
    return slot || null;
  }

  static async delete(id: string): Promise<boolean> {
    const deletedCount = await db('slots').where({ id }).del();
    return deletedCount > 0;
  }

  static async countByDate(date: string): Promise<number> {
    const result = await db('slots')
      .where({ date })
      .andWhere(function() {
        this.whereNull('exception_id').orWhere('exception_id', '');
      })
      .count('* as count')
      .first();
    
    return parseInt(result?.count as string) || 0;
  }

  static async findRecurringSlots(dayOfWeek: number, startDate: string, endDate: string): Promise<Slot[]> {
    return db('slots')
      .where({
        day_of_week: dayOfWeek,
        is_recurring: true
      })
      .whereBetween('date', [startDate, endDate])
      .orderBy('date')
      .orderBy('start_time');
  }

  // ✅ NEW: Find all slots in a recurring series
  static async findRecurringSeries(originalSlot: Slot): Promise<Slot[]> {
    return db('slots')
      .where({
        start_time: originalSlot.start_time,
        end_time: originalSlot.end_time,
        day_of_week: originalSlot.day_of_week,
        is_recurring: true
      })
      .orderBy('date');
  }
}