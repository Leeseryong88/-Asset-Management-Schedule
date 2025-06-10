
import React, { useEffect, useRef } from 'react';
import { Schedule } from '../types';
import { XMarkIcon } from './Icons';
import { formatDateToDisplay } from '../utils/dateUtils';

export interface DayPopoverData {
  dateStr: string;
  schedules: Schedule[];
  position: { top: number; left: number; width: number; };
  triggerRect: DOMRect; // Keep triggerRect for potential future repositioning logic
}

interface DaySchedulePopoverProps {
  popoverData: DayPopoverData;
  onClose: () => void;
  onScheduleSelect: (schedule: Schedule) => void;
  onScheduleMouseEnter: (schedule: Schedule, event: React.MouseEvent) => void;
  onScheduleMouseLeave: () => void;
  onScheduleMouseMove: (event: React.MouseEvent) => void;
}

const DaySchedulePopover: React.FC<DaySchedulePopoverProps> = ({ 
  popoverData, 
  onClose, 
  onScheduleSelect,
  onScheduleMouseEnter,
  onScheduleMouseLeave,
  onScheduleMouseMove 
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { dateStr, schedules, position } = popoverData;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!schedules.length) {
    // This case should ideally be handled before calling to show popover,
    // but as a safeguard:
    onClose(); 
    return null;
  }

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 bg-slate-700 border border-slate-600 rounded-lg shadow-xl flex flex-col"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        maxHeight: '300px', // Max height for the popover
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-popover-title"
    >
      <div className="flex justify-between items-center p-3 border-b border-slate-600">
        <h3 id="day-popover-title" className="text-sm font-semibold text-sky-300">
          {formatDateToDisplay(dateStr)} 일정
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="팝업 닫기"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      <ul className="overflow-y-auto p-2 space-y-1">
        {schedules.map(schedule => (
          <li key={schedule.id}>
            <button
              onClick={() => {
                onScheduleSelect(schedule);
              }}
              onMouseEnter={(e) => onScheduleMouseEnter(schedule, e)}
              onMouseLeave={onScheduleMouseLeave}
              onMouseMove={onScheduleMouseMove}
              className="w-full flex items-center p-2 rounded-md hover:bg-slate-600 transition-colors text-left"
              title={schedule.title}
            >
              <span
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: schedule.color }}
              ></span>
              <span className="text-xs text-slate-100 truncate flex-grow">{schedule.title}</span>
            </button>
          </li>
        ))}
      </ul>
       {schedules.length === 0 && (
         <p className="p-3 text-xs text-slate-400 text-center">이 날짜에는 일정이 없습니다.</p>
       )}
    </div>
  );
};

export default DaySchedulePopover;
