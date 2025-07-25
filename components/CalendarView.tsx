import React, { useRef, useState, useEffect } from 'react';
import { Schedule } from '../types';
import { getDaysInMonth, getDayOfWeek, formatDateISO, isSameDay, isDateInRange, createDateFromISO } from '../utils/dateUtils';
import { CALENDAR_BAR_HEIGHT, CALENDAR_BAR_VERTICAL_GAP, MAX_CALENDAR_LANES, DATE_NUMBER_HEIGHT_APPROX, getCategoryDisplay } from '../constants';
import { EyeIcon, PlusCircleIcon } from './Icons';

type DateSelectionPhase = 'idle' | 'selectingEndDate';

interface CalendarViewProps {
  schedules: Schedule[]; 
  currentMonth: Date;
  onScheduleClick: (schedule: Schedule) => void;
  onDateClick: (date: string) => void; 
  dateSelectionPhase: DateSelectionPhase;
  onShowDayPopover: (dateStr: string, triggerRect: DOMRect, hiddenSchedules: Schedule[]) => void; 
  onScheduleMouseEnter: (schedule: Schedule, event: React.MouseEvent) => void;
  onScheduleMouseLeave: () => void;
  onScheduleMouseMove: (event: React.MouseEvent) => void;
  onCalendarMouseMove: (event: React.MouseEvent) => void;
  allSchedules: Schedule[];
}

interface ScheduleLayout {
  schedule: Schedule;
  laneIndex: number;
  startCol: number; 
  endCol: number;   
  isStart: boolean; 
  isEnd: boolean;   
}

const WEEK_DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

const CalendarView: React.FC<CalendarViewProps> = ({ 
    schedules, 
    currentMonth, 
    onScheduleClick, 
    onDateClick, 
    dateSelectionPhase,
    onShowDayPopover,
    onScheduleMouseEnter,
    onScheduleMouseLeave,
    onScheduleMouseMove,
    onCalendarMouseMove,
    allSchedules
}) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const dayButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  // 뷰포트 높이 상태 관리
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  // 창 크기 변화 감지
  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getDayOfWeek(year, month, 1);

  const dayCellsData: (Date | null)[] = [];
  
  // 이전 달의 마지막 날짜들 추가 (비어있는 셀 채우기)
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    dayCellsData.push(new Date(prevYear, prevMonth, prevDay));
  }
  
  // 현재 달의 날짜들 추가
  for (let day = 1; day <= daysInMonth; day++) {
    dayCellsData.push(new Date(year, month, day));
  }
  
  // 다음 달의 첫 날짜들 추가 (남은 셀 채우기)
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  
  const totalCells = dayCellsData.length;
  let targetCells: number;
  
  if (totalCells <= 35) {
    targetCells = 35; // 5주로 표시
  } else {
    targetCells = 42; // 6주로 표시
  }
  
  const cellsToFill = Math.max(0, targetCells - totalCells);
  for (let i = 1; i <= cellsToFill; i++) {
    dayCellsData.push(new Date(nextYear, nextMonth, i));
  }


  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < dayCellsData.length; i += 7) {
    weeks.push(dayCellsData.slice(i, i + 7));
  }
  
  const today = new Date();

  const getScheduleLayoutsForWeek = (weekDays: (Date | null)[]): { layouts: ScheduleLayout[], moreCounts: number[], hiddenSchedulesByDay: Schedule[][] } => {
    const weekStart = weekDays[0] ? new Date(weekDays[0]) : new Date(weekDays.find(d => d !== null) || currentMonth);
    if(weekDays[0]) weekStart.setHours(0,0,0,0);
    
    const weekEnd = weekDays[6] ? new Date(weekDays[6]) : new Date(weekDays.reverse().find(d => d !== null) || currentMonth);
    if(weekDays[6]) weekEnd.setHours(23,59,59,999);

    const weekSchedules = schedules.filter(s => {
      const scheduleStart = createDateFromISO(s.startDate);
      const scheduleEnd = createDateFromISO(s.endDate);
      scheduleEnd.setHours(23,59,59,999); // Ensure end date covers the whole day
      return scheduleStart <= weekEnd && scheduleEnd >= weekStart;
    }).sort((a,b) => { 
        const startDateDiff = createDateFromISO(a.startDate).getTime() - createDateFromISO(b.startDate).getTime();
        if (startDateDiff !== 0) return startDateDiff;
        const aDuration = createDateFromISO(a.endDate).getTime() - createDateFromISO(a.startDate).getTime();
        const bDuration = createDateFromISO(b.endDate).getTime() - createDateFromISO(b.startDate).getTime();
        return bDuration - aDuration; 
    });


    const layouts: ScheduleLayout[] = [];
    const lanes: boolean[][] = Array(MAX_CALENDAR_LANES).fill(null).map(() => Array(7).fill(false));
    const moreCounts: number[] = Array(7).fill(0);
    const hiddenSchedulesByDay: Schedule[][] = Array(7).fill(null).map(() => []);

    weekSchedules.forEach(schedule => {
      const scheduleActualStart = createDateFromISO(schedule.startDate);
      const scheduleActualEnd = createDateFromISO(schedule.endDate);

      let startCol = -1, endCol = -1;

      for(let i=0; i < 7; i++) {
        if (!weekDays[i]) continue;
        const day = new Date(weekDays[i]!); // weekDays[i] is a Date object
        if (isDateInRange(day, scheduleActualStart, scheduleActualEnd)) {
          if (startCol === -1) startCol = i;
          endCol = i;
        }
      }
      
      if (startCol === -1) return; 

      let assignedLane = -1;
      for (let l = 0; l < MAX_CALENDAR_LANES; l++) {
        let canPlace = true;
        for (let c = startCol; c <= endCol; c++) {
          if (lanes[l][c]) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) {
          assignedLane = l;
          break;
        }
      }

      if (assignedLane !== -1) {
        for (let c = startCol; c <= endCol; c++) {
          lanes[assignedLane][c] = true;
        }
        const dayIsScheduleStart = weekDays[startCol] && isSameDay(new Date(weekDays[startCol]!), scheduleActualStart);
        const dayIsScheduleEnd = weekDays[endCol] && isSameDay(new Date(weekDays[endCol]!), scheduleActualEnd);

        layouts.push({
          schedule,
          laneIndex: assignedLane,
          startCol,
          endCol,
          isStart: dayIsScheduleStart || (weekDays[startCol] && isSameDay(new Date(weekDays[startCol]!), weekStart)) || startCol === 0 ,
          isEnd: dayIsScheduleEnd || (weekDays[endCol] && isSameDay(new Date(weekDays[endCol]!), weekEnd)) || endCol === 6,
        });
      } else {
        for (let c = startCol; c <= endCol; c++) {
          moreCounts[c]++;
          // 스케줄이 해당 날짜에서 시작하거나 해당 날짜에 포함되는 경우에만 추가
          // 중복 방지를 위해 스케줄 ID로 체크
          if (!hiddenSchedulesByDay[c].some(s => s.id === schedule.id)) {
            hiddenSchedulesByDay[c].push(schedule);
          }
        }
      }
    });
    return { layouts, moreCounts, hiddenSchedulesByDay };
  };


  return (
    <div 
      className={`bg-slate-800 rounded-lg shadow-2xl p-4 h-full flex flex-col ${dateSelectionPhase !== 'idle' ? 'cursor-crosshair' : ''}`}
      onMouseMove={onCalendarMouseMove}
    >
      <div className="grid grid-cols-7 text-center text-xs sm:text-sm font-semibold text-slate-400 mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>
      <div className={`grid gap-px border-l border-r border-b border-slate-700 rounded-b-lg overflow-hidden flex-1 ${weeks.length === 5 ? 'grid-rows-5' : 'grid-rows-6'}`}>
        {weeks.map((weekDays, weekIndex) => {
          const { layouts, moreCounts, hiddenSchedulesByDay } = getScheduleLayoutsForWeek(weekDays);
          const minRowHeight = DATE_NUMBER_HEIGHT_APPROX + (MAX_CALENDAR_LANES * (CALENDAR_BAR_HEIGHT + CALENDAR_BAR_VERTICAL_GAP)) + 10 + (moreCounts.some(c => c > 0) ? 20 : 0);
          
          // 동적 셀 높이 계산: 기본 높이에서 최대 1.5배까지
          // 전체 뷰포트에서 헤더(100px), 패딩(50px), 요일 헤더(50px), 여유(100px) 제외
          const reservedHeight = 300;
          const availableHeight = Math.max(300, viewportHeight - reservedHeight);
          const dynamicRowHeight = Math.max(
            minRowHeight, 
            Math.min(minRowHeight * 1.5, availableHeight / weeks.length)
          );

          return (
            <div 
              key={weekIndex} 
              className="grid grid-cols-7 relative border-t border-slate-700 first:border-t-0" 
              style={{ 
                minHeight: `${minRowHeight}px`,
                height: `${dynamicRowHeight}px`
              }}
            >
              {weekDays.map((date, dayIndex) => {
                const isCurrentMonthDay = date && date.getMonth() === month;
                const isToday = date && isSameDay(date, today);
                // `date` here is a Date object. formatDateISO will correctly use its local components.
                const dateStr = date ? formatDateISO(date) : ''; 
                
                const handleMoreClick = (event: React.MouseEvent<HTMLButtonElement>) => {
                    event.stopPropagation(); 
                    if (date) { // date is a Date object
                        const targetRect = event.currentTarget.getBoundingClientRect();
                        const hiddenSchedulesForDay = hiddenSchedulesByDay[dayIndex] || [];
                        onShowDayPopover(formatDateISO(date), targetRect, hiddenSchedulesForDay); // Pass the 'YYYY-MM-DD' string and hidden schedules
                    }
                };

                return (
                  <div
                    key={dayIndex}
                    className={`p-1.5 relative flex flex-col h-full border-r border-slate-700 last:border-r-0 
                                ${isCurrentMonthDay ? `bg-slate-800/80 ${dateSelectionPhase !== 'idle' ? 'cursor-copy' : 'hover:bg-slate-700/70'}` : 'bg-slate-800/50 text-slate-600'} 
                                transition-colors group`}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('.schedule-bar-item') || target.closest('.more-schedules-button')) {
                        return;
                      }
                      if(dateStr) onDateClick(dateStr) // dateStr is 'YYYY-MM-DD'
                    }}
                    role="button"
                    aria-label={date ? `${date.toLocaleDateString('ko-KR')} ${moreCounts[dayIndex] > 0 ? `, ${moreCounts[dayIndex]}개 일정 더보기` : '일정 추가 또는 날짜 선택'}` : '빈 날짜'}
                  >
                    <span className={`text-xs sm:text-sm font-medium mb-1 ${isToday ? 'text-red-400 font-bold' : isCurrentMonthDay ? 'text-slate-300' : 'text-slate-500'}`}>
                      {date?.getDate()}
                    </span>
                    <div className="flex-grow"></div>
                    {isCurrentMonthDay && moreCounts[dayIndex] > 0 && (
                       <button
                         ref={el => {
                            if (dayButtonRefs.current && date) {
                                const flatIndex = weekIndex * 7 + dayIndex;
                                dayButtonRefs.current[flatIndex] = el;
                            }
                         }}
                         onClick={handleMoreClick}
                         className="more-schedules-button mt-auto text-center text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-700/50 py-0.5 px-1 rounded w-full flex items-center justify-center"
                         title={`${moreCounts[dayIndex]}개 일정 더 보기 (필터 적용됨)`}
                       >
                         <PlusCircleIcon className="w-3 h-3 mr-1"/> +{moreCounts[dayIndex]} 더보기
                       </button>
                    )}
                  </div>
                );
              })}

              {layouts.map(layout => {
                // 현재 날짜와 비교하여 과거 스케줄인지 확인
                const scheduleEndDate = createDateFromISO(layout.schedule.endDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정
                const isPastSchedule = scheduleEndDate < today;
                
                return (
                  <div
                    key={layout.schedule.id + `_lane${layout.laneIndex}`}
                    className={`schedule-bar-item absolute p-0.5 text-xs rounded shadow truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center
                      ${layout.isStart ? 'rounded-l-md' : ''} 
                      ${layout.isEnd ? 'rounded-r-md' : ''}`}
                    style={{
                      backgroundColor: layout.schedule.color,
                      color: '#FFFFFF', 
                      opacity: isPastSchedule ? 0.4 : 1, // 과거 스케줄은 40% 투명도
                      top: `${DATE_NUMBER_HEIGHT_APPROX + layout.laneIndex * (CALENDAR_BAR_HEIGHT + CALENDAR_BAR_VERTICAL_GAP)}px`,
                      left: `${(layout.startCol / 7) * 100}%`,
                      width: `${((layout.endCol - layout.startCol + 1) / 7) * 100}%`,
                      height: `${CALENDAR_BAR_HEIGHT}px`,
                      paddingLeft: layout.isStart ? '6px' : '2px',
                      paddingRight: layout.isEnd ? '6px' : '2px',
                    }}
                  onClick={(e) => { e.stopPropagation(); onScheduleClick(layout.schedule); }}
                  onMouseEnter={(e) => onScheduleMouseEnter(layout.schedule, e)}
                  onMouseLeave={onScheduleMouseLeave}
                  onMouseMove={onScheduleMouseMove}
                  title="" 
                  role="button"
                  aria-label={`일정 ${layout.schedule.title} 보기`}
                >
                  <span className="mr-1 flex-shrink-0 text-xs">{getCategoryDisplay(layout.schedule.category)}</span>
                  <span className="truncate">{layout.schedule.title}</span>
                </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
