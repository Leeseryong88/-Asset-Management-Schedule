
import React, { useState } from 'react';
import { Schedule } from '../types';
import ScheduleCard from './ScheduleCard';
import { MagnifyingGlassIcon } from './Icons';

interface CardListViewProps {
  schedules: Schedule[];
  onScheduleClick: (schedule: Schedule) => void;
  onEditClick: (schedule: Schedule) => void;
  onDeleteClick: (scheduleId: string) => void;
}

const CardListView: React.FC<CardListViewProps> = ({ schedules, onScheduleClick, onEditClick, onDeleteClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSchedules = schedules.filter(schedule =>
    schedule.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.assignee.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.category.toLowerCase().includes(searchTerm.toLowerCase()) // 카테고리 검색 추가
  ).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="space-y-6">
      <div className="relative">
        <input
          type="text"
          placeholder="일정 검색 (제목, 내용, 담당자, 팀, 종류)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pl-10 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 border-transparent shadow-lg"
        />
        <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
      </div>
      {filteredSchedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchedules.map(schedule => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onViewClick={() => onScheduleClick(schedule)}
              onEditClick={() => onEditClick(schedule)}
              onDeleteClick={() => onDeleteClick(schedule.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400">
          <p className="text-xl">검색 결과가 없습니다.</p>
          {schedules.length > 0 && <p>다른 검색어를 입력해보세요.</p>}
          {schedules.length === 0 && <p>"일정 추가" 버튼을 눌러 새 일정을 만들어보세요.</p>}
        </div>
      )}
    </div>
  );
};

export default CardListView;
