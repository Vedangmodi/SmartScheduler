import { Router } from 'express';
import { SlotController } from '../controllers/slotController';

const router = Router();

// GET /api/slots?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get('/', SlotController.getWeekSlots);

// POST /api/slots
router.post('/', SlotController.createSlot);

// PUT /api/slots/:id
router.put('/:id', SlotController.updateSlot);

// DELETE /api/slots/:id (creates exception for recurring slots)
router.delete('/:id', SlotController.deleteSlot);

// ✅ NEW: DELETE /api/slots/:id/series (delete entire recurring series)
router.delete('/:id/series', SlotController.deleteRecurringSlotSeries);

export default router;