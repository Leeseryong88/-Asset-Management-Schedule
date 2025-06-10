
import React from 'react';
import { Schedule } from '../types';
import { formatDateRange } from '../utils/dateUtils';
import { CalendarIcon, UserIcon, DocumentTextIcon, TagIcon, PencilIcon, TrashIcon, EyeIcon, UsersIcon } from './Icons'; // Added UsersIcon

interface ScheduleCardProps {
  schedule: Schedule;
  onViewClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, onViewClick, onEditClick, onDeleteClick }) => {
  return (
    <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-sky-400 truncate" title={schedule.title}>{schedule.title}</h3>
          <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: schedule.color }}></div>
        </div>
        
        <div className="space-y-2 text-sm text-slate-300 mb-4">
          <p className="flex items-center"><CalendarIcon className="w-4 h-4 mr-2 text-slate-500" /> {formatDateRange(schedule.startDate, schedule.endDate)}</p>
          {schedule.assignee && <p className="flex items-center"><UserIcon className="w-4 h-4 mr-2 text-slate-500" /> 담당자: {schedule.assignee}</p>}
          {schedule.content && <p className="flex items-center truncate" title={schedule.content}><DocumentTextIcon className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" /> 내용: {schedule.content}</p>}
          {schedule.team && <p className="flex items-center truncate" title={schedule.team}><UsersIcon className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" /> 팀: {schedule.team}</p>}
          {schedule.files.length > 0 && (
            <p className="flex items-center">
              <i className="fas fa-paperclip w-4 h-4 mr-2 text-slate-500"></i> 첨부파일: {schedule.files.length}개
            </p>
          )}
        </div>
      </div>
      <div className="bg-slate-750 px-5 py-3 flex justify-end space-x-2">
        <button
          onClick={onViewClick}
          className="px-3 py-1.5 text-xs font-semibold text-sky-300 hover:text-sky-100 hover:bg-sky-600/50 rounded-md transition-colors flex items-center"
          title="상세 보기"
        >
          <EyeIcon className="w-4 h-4 mr-1" /> 상세
        </button>
        <button
          onClick={onEditClick}
          className="px-3 py-1.5 text-xs font-semibold text-yellow-300 hover:text-yellow-100 hover:bg-yellow-600/50 rounded-md transition-colors flex items-center"
          title="수정"
        >
          <PencilIcon className="w-4 h-4 mr-1" /> 수정
        </button>
        <button
          onClick={onDeleteClick}
          className="px-3 py-1.5 text-xs font-semibold text-red-400 hover:text-red-200 hover:bg-red-600/50 rounded-md transition-colors flex items-center"
          title="삭제"
        >
          <TrashIcon className="w-4 h-4 mr-1" /> 삭제
        </button>
      </div>
    </div>
  );
};

export default ScheduleCard;
