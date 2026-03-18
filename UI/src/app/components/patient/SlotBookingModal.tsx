import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/app/context/AppContext';
import { api } from '@/app/services/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SlotBookingModalProps {
  patientId: string;
  prescriptionId: string;
  pickupId: string;
  isReschedule: boolean;
  expiryDate: string | null;
  onClose: () => void;
}

const MORNING_SLOTS = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30'];
const AFTERNOON_SLOTS = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];

export function SlotBookingModal({
  patientId,
  prescriptionId,
  pickupId,
  isReschedule,
  expiryDate,
  onClose
}: SlotBookingModalProps) {
  const { bookPickupSlot, reschedulePickup } = useApp();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSlotTimes, setAvailableSlotTimes] = useState<string[]>([]);
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  // Fetch available slots from API whenever selected date changes
  useEffect(() => {
    if (!selectedDate) return;
    setIsFetchingSlots(true);
    setAvailableSlotTimes([]);
    setSelectedTime(null);
    api.appointment.getAvailableSlots(selectedDate)
      .then((slots: any[]) => {
        // API may return objects with a time/slotTime field, or plain strings
        const times = (slots || []).map((s: any) =>
          typeof s === 'string' ? s : (s.slotTime || s.time || s.availableTime || '')
        ).filter(Boolean);
        setAvailableSlotTimes(times);
      })
      .catch(() => {
        // On failure show all slots as available so the user is not completely blocked
        setAvailableSlotTimes([...MORNING_SLOTS, ...AFTERNOON_SLOTS]);
      })
      .finally(() => setIsFetchingSlots(false));
  }, [selectedDate]);

  // Generate next 14 days starting from tomorrow
  const next14Days = useMemo(() => {
    const days = [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const maxDate = expiryDate ? new Date(expiryDate) : null;
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(tomorrow);
      date.setDate(date.getDate() + i);
      
      if (maxDate && date > maxDate) break;
      
      days.push({
        dateStr: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        dayNum: date.getDate().toString(),
        monthName: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
      });
    }
    
    return days;
  }, [expiryDate]);

  // A slot is unavailable if the API did NOT include it in the available list
  const isSlotAvailable = (time: string): boolean => {
    if (availableSlotTimes.length === 0) return false; // still loading or no data
    return availableSlotTimes.includes(time);
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setIsSubmitting(true);
    try {
      if (isReschedule) {
        await reschedulePickup(patientId, prescriptionId, pickupId, selectedDate, selectedTime);
      } else {
        await bookPickupSlot(patientId, prescriptionId, pickupId, selectedDate, selectedTime);
      }
      onClose();
    } catch {
      // error shown via toast from context
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const TimeSlotButton = ({ time, dateStr }: { time: string; dateStr: string }) => {
    const available = isSlotAvailable(time);
    const isSelected = selectedTime === time && selectedDate === dateStr;
    
    return (
      <button
        type="button"
        onClick={() => {
          if (available) setSelectedTime(time);
        }}
        disabled={!available}
        className={`
          px-2 py-2.5 rounded-lg border text-xs transition-all
          ${!available
            ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through font-light'
            : isSelected
              ? 'border-blue-600 bg-blue-600 text-white shadow-sm font-normal'
              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 cursor-pointer font-normal'
          }
        `}
      >
        {formatTime(time)}
      </button>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="!max-w-2xl w-full border-gray-100 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-gray-800 font-normal">
            {isReschedule ? 'Reschedule Pickup' : 'Book Pickup Slot'}
          </DialogTitle>
          <DialogDescription className="text-gray-500 font-light">
            Select a date and time for your medicine pickup
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2 max-h-[65vh] overflow-y-auto pr-1">
          {/* Date Selection */}
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-light uppercase tracking-wide">Select Date</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {next14Days.map(({ dateStr, dayName, dayNum, monthName }) => (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setSelectedTime(null);
                  }}
                  className={`flex-shrink-0 snap-start w-14 py-3 rounded-xl border text-center transition-all ${
                    selectedDate === dateStr
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  <p className="text-[10px] font-light">{dayName}</p>
                  <p className="text-lg font-normal leading-tight">{dayNum}</p>
                  <p className="text-[10px] font-light">{monthName}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 font-light uppercase tracking-wide">
                  Select Time — {formatDate(selectedDate)}
                </p>
                <div className="flex items-center gap-3 text-[10px] font-light text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-white border border-gray-200 inline-block"/>
                    Available
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-gray-100 inline-block"/>
                    Taken
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block"/>
                    Selected
                  </span>
                </div>
              </div>

              {isFetchingSlots ? (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-light">Checking availability...</span>
                </div>
              ) : availableSlotTimes.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-400 font-light">
                  No slots available for this date. Please choose another day.
                </div>
              ) : (<>

              {/* Morning Slots */}
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest">Morning</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {MORNING_SLOTS.map(slot => (
                    <TimeSlotButton key={slot} time={slot} dateStr={selectedDate} />
                  ))}
                </div>
              </div>

              {/* Lunch Break */}
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-gray-100"/>
                <span className="text-[10px] text-gray-400 font-light uppercase tracking-widest">Lunch 1:00 – 2:00 PM</span>
                <div className="flex-1 h-px bg-gray-100"/>
              </div>

              {/* Afternoon Slots */}
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest">Afternoon</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {AFTERNOON_SLOTS.map(slot => (
                    <TimeSlotButton key={slot} time={slot} dateStr={selectedDate} />
                  ))}
                </div>
              </div>
            </>)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
          <div className="text-sm text-gray-600 font-light min-h-[20px]">
            {selectedDate && selectedTime ? (
              <span>
                📅 <strong className="font-normal">{formatDate(selectedDate)}</strong> at{' '}
                <strong className="font-normal">{formatTime(selectedTime)}</strong>
              </span>
            ) : (
              <span className="text-gray-400">No slot selected</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="border-gray-100 font-normal">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedTime || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 shadow-sm font-normal transition-all duration-300"
            >
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Booking...</> : 'Confirm Slot'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}