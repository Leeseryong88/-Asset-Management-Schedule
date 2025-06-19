import React from 'react';
import { ViewMode } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, ListBulletIcon, PlusIcon, FilterIcon, WrenchScrewdriverIcon } from './Icons'; // Added WrenchScrewdriverIcon
import { ALL_TEAMS_FILTER_VALUE } from '../constants';
import CategoryFilter from './CategoryFilter'; // CategoryFilter를 import합니다.

interface CalendarHeaderProps {
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
  currentView: ViewMode;
  setCurrentView: (viewMode: ViewMode) => void;
  onAddSchedule: () => void;
  isDateSelectionActive: boolean;
  uniqueTeams: string[];
  selectedTeamFilter: string;
  onTeamFilterChange: (team: string) => void;
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentMonth,
  setCurrentMonth,
  currentView,
  setCurrentView,
  onAddSchedule,
  isDateSelectionActive,
  uniqueTeams,
  selectedTeamFilter,
  onTeamFilterChange,
  selectedCategories,
  onCategoryToggle,
}) => {
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  return (
    <header className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-800 rounded-lg shadow-xl space-y-3 sm:space-y-0">
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-slate-700 transition-colors"
          aria-label="이전 달"
        >
          <ChevronLeftIcon className="w-6 h-6 text-sky-400" />
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-sky-400 whitespace-nowrap">
          {currentMonth.getFullYear()}년 {currentMonth.toLocaleString('ko-KR', { month: 'long' })}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-slate-700 transition-colors"
          aria-label="다음 달"
        >
          <ChevronRightIcon className="w-6 h-6 text-sky-400" />
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <CategoryFilter
          selectedCategories={selectedCategories}
          onCategoryToggle={onCategoryToggle}
        />

        <div className="border-l border-slate-700 h-10 mx-1"></div>

        {currentView === ViewMode.Calendar && (
          <div className="relative">
            <label htmlFor="team-filter" className="sr-only">팀 필터</label>
            <div className="flex items-center bg-slate-700 rounded-md">
                <FilterIcon className="w-4 h-4 text-slate-400 absolute left-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                <select
                    id="team-filter"
                    value={selectedTeamFilter}
                    onChange={(e) => onTeamFilterChange(e.target.value)}
                    disabled={isDateSelectionActive}
                    className="appearance-none bg-transparent text-white text-xs sm:text-sm py-2 pl-7 pr-8 rounded-md focus:ring-1 focus:ring-sky-500 focus:outline-none disabled:opacity-50"
                    aria-label="팀별 일정 필터"
                >
                    <option value={ALL_TEAMS_FILTER_VALUE} className="bg-slate-700">모든 팀</option>
                    {uniqueTeams.map(team => (
                    <option key={team} value={team} className="bg-slate-700">{team}</option>
                    ))}
                </select>
                <ChevronRightIcon className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 transform -translate-y-1/2 rotate-90 pointer-events-none" />
            </div>
          </div>
        )}
        <button
          onClick={() => setCurrentView(ViewMode.Calendar)}
          className={`p-2 rounded-md transition-colors ${
            currentView === ViewMode.Calendar ? 'bg-sky-500 text-white' : 'hover:bg-slate-700 text-slate-300'
          } disabled:opacity-50`}
          aria-label="달력 보기"
          disabled={isDateSelectionActive && currentView !== ViewMode.Calendar}
        >
          <CalendarDaysIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => setCurrentView(ViewMode.CardList)}
          className={`p-2 rounded-md transition-colors ${
            currentView === ViewMode.CardList ? 'bg-sky-500 text-white' : 'hover:bg-slate-700 text-slate-300'
          } disabled:opacity-50`}
          aria-label="목록 보기"
           disabled={isDateSelectionActive && currentView !== ViewMode.CardList}
        >
          <ListBulletIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onAddSchedule}
          className="flex items-center space-x-1 sm:space-x-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-md transition-transform duration-150 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
          aria-label="새 일정 추가"
          disabled={isDateSelectionActive}
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">일정 추가</span>
          <span className="sm:hidden">추가</span>
        </button>
      </div>
    </header>
  );
};

export default CalendarHeader;
