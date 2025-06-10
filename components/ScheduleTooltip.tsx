
import React from 'react';
import { ActiveTooltipData } from '../types';
import { formatDateRange } from '../utils/dateUtils';
import { CalendarIcon, UserIcon, DocumentTextIcon, UsersIcon } from './Icons'; // Changed TagIcon to UsersIcon

interface ScheduleTooltipProps {
  tooltipData: ActiveTooltipData;
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '없음';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const ScheduleTooltip: React.FC<ScheduleTooltipProps> = ({ tooltipData }) => {
  const { schedule, x, y } = tooltipData;

  // Offset the tooltip slightly from the cursor
  const tooltipX = x + 15;
  const tooltipY = y + 15;

  return (
    <div
      className="fixed z-[55] bg-slate-800 border border-slate-600 rounded-md shadow-xl p-3 text-sm text-white pointer-events-none max-w-xs"
      style={{
        left: `${tooltipX}px`,
        top: `${tooltipY}px`,
        // Add transform to potentially move tooltip if it goes off-screen (basic example)
        // This part would need more complex logic for robust off-screen handling
        // transform: `translateX(calc(-50% + ${x}px)) translateY(${y + 15}px)` 
      }}
      role="tooltip"
    >
      <h4 className="font-semibold text-base text-sky-300 mb-2 break-words">{schedule.title}</h4>
      <div className="space-y-1.5">
        <p className="flex items-start">
          <CalendarIcon className="w-4 h-4 mr-2 mt-0.5 text-slate-400 flex-shrink-0" />
          <span className="text-slate-200">{formatDateRange(schedule.startDate, schedule.endDate)}</span>
        </p>
        {schedule.assignee && (
          <p className="flex items-start">
            <UserIcon className="w-4 h-4 mr-2 mt-0.5 text-slate-400 flex-shrink-0" />
            <span className="text-slate-200 break-words">담당자: {schedule.assignee}</span>
          </p>
        )}
        {schedule.content && (
            <p className="flex items-start">
                <DocumentTextIcon className="w-4 h-4 mr-2 mt-0.5 text-slate-400 flex-shrink-0" />
                <span className="text-slate-200 break-words">내용: {truncateText(schedule.content, 100)}</span>
            </p>
        )}
        {schedule.team && ( // Changed from remarks to team
             <p className="flex items-start">
                <UsersIcon className="w-4 h-4 mr-2 mt-0.5 text-slate-400 flex-shrink-0" /> 
                <span className="text-slate-200 break-words">팀: {truncateText(schedule.team, 100)}</span>
            </p>
        )}
      </div>
    </div>
  );
};

export default ScheduleTooltip;
