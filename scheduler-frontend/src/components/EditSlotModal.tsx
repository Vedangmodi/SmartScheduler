import React, { useState } from 'react';
import type { Slot } from '../types';
import SlotForm from './SlotForm';

interface EditSlotModalProps {
  slot: Slot | null;
  onSave: (id: string, startTime: string, endTime: string, isRecurring: boolean) => void;
  onDelete: (id: string, deleteSeries: boolean) => void; // ✅ Updated signature
  onClose: () => void;
  viewMode: 'mobile' | 'desktop';
}

const EditSlotModal: React.FC<EditSlotModalProps> = ({ slot, onSave, onDelete, onClose, viewMode }) => {
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  
  console.log('EditSlotModal rendered with slot:', slot);
  if (!slot) return null;

  const handleSubmit = (startTime: string, endTime: string, isRecurring: boolean) => {
    onSave(slot.id, startTime, endTime, isRecurring);
    onClose();
  };

  const handleDelete = (deleteSeries: boolean = false) => {
    onDelete(slot.id, deleteSeries);
    onClose();
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${
      viewMode === 'mobile' ? 'items-end' : 'items-center'
    }`}>
      <div className={`bg-white rounded-2xl p-6 w-full max-w-md mx-auto ${
        viewMode === 'mobile' ? 'rounded-t-2xl' : 'rounded-2xl'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800">Edit Time Slot</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <SlotForm
          onSubmit={handleSubmit}
          onCancel={onClose}
          initialData={{
            startTime: slot.start_time,
            endTime: slot.end_time,
            isRecurring: slot.is_recurring
          }}
        />
        
        <div className="mt-6">
          {!showDeleteOptions ? (
            <button
              onClick={() => setShowDeleteOptions(true)}
              className="w-full bg-red-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-600 transition-colors"
            >
              Delete Slot
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => handleDelete(false)}
                className="w-full bg-red-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                {slot.is_recurring ? 'Delete Only This Instance' : 'Delete Slot'}
              </button>
              
              {slot.is_recurring && !slot.exception_id && (
                <button
                  onClick={() => handleDelete(true)}
                  className="w-full bg-orange-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-orange-600 transition-colors"
                >
                  Delete All Recurring Instances
                </button>
              )}
              
              <button
                onClick={() => setShowDeleteOptions(false)}
                className="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditSlotModal;