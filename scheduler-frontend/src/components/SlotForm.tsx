import React, { useState } from 'react';

interface SlotFormProps {
  onSubmit: (startTime: string, endTime: string, isRecurring: boolean) => void;
  onCancel: () => void;
  initialData?: {
    startTime: string;
    endTime: string;
    isRecurring: boolean;
  };
}

const SlotForm: React.FC<SlotFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [startTime, setStartTime] = useState(initialData?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '10:00');
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false);
  const [errors, setErrors] = useState<{ startTime?: string; endTime?: string }>({});

  const validate = () => {
    const newErrors: { startTime?: string; endTime?: string } = {};
    
    if (!startTime) {
      newErrors.startTime = 'Start time is required';
    }
    
    if (!endTime) {
      newErrors.endTime = 'End time is required';
    }
    
    if (startTime && endTime && startTime >= endTime) {
      newErrors.endTime = 'End time must be after start time';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(startTime, endTime, isRecurring);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {errors.startTime && <div className="text-red-500 text-xs mt-1">{errors.startTime}</div>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
        {errors.endTime && <div className="text-red-500 text-xs mt-1">{errors.endTime}</div>}
      </div>
      
      <div>
        <label className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
          />
          <div className="ml-3">
            <span className="text-sm text-gray-700 font-medium">Recurring weekly</span>
            <p className="text-xs text-gray-500 mt-1">
              {isRecurring ? 'This slot will repeat every week for 12 weeks' : 'This will be a one-time slot'}
            </p>
          </div>
        </label>
      </div>
      
      <div className="flex space-x-3 pt-2">
        <button
          type="submit"
          className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default SlotForm;