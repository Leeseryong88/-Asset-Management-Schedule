import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Schedule, ViewMode, ModalMode, ActiveTooltipData, DateSelectionTooltipData } from './types';
import AuthComponent from './components/AuthComponent';
import AdminPanel from './components/AdminPanel';
import FirstLoginSetup from './components/FirstLoginSetup';
import CalendarHeader from './components/CalendarHeader';
import CalendarView from './components/CalendarView';
import CardListView from './components/CardListView';
import ScheduleModal from './components/ScheduleModal';
import DaySchedulePopover, { DayPopoverData } from './components/DaySchedulePopover';
import ScheduleTooltip from './components/ScheduleTooltip';
import { useFirestoreSchedules } from './hooks/useFirestoreSchedules';
import { useUserProfile } from './hooks/useUserProfile';
import { getCurrentDateISO, getSchedulesForDate, createDateFromISO, formatDateToDisplay } from './utils/dateUtils';
import { ALL_TEAMS_FILTER_VALUE, CATEGORY_OPTIONS } from './constants';
import { Analytics } from '@vercel/analytics/react';
import CategoryFilter from './components/CategoryFilter';
import DateSelectionTooltip from './components/DateSelectionTooltip';

type DateSelectionPhase = 'idle' | 'selectingEndDate';
type NewScheduleDateParam = string | { startDate: string; endDate: string };

const App: React.FC = () => {
  // Firebase 인증 상태
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // 사용자 프로필 데이터
  const { userProfile, loading: profileLoading, error: profileError, completeFirstLoginSetup } = useUserProfile(user);
  
  // Firestore 스케줄 데이터
  const { schedules, loading: schedulesLoading, error: schedulesError, addSchedule, updateSchedule, deleteSchedule } = useFirestoreSchedules(user);
  
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.Calendar);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [dateForNewSchedule, setDateForNewSchedule] = useState<NewScheduleDateParam | null>(null);

  const [dateSelectionPhase, setDateSelectionPhase] = useState<DateSelectionPhase>('idle');
  const [pendingStartDate, setPendingStartDate] = useState<string | null>(null);
  const [dateSelectionTooltip, setDateSelectionTooltip] = useState<DateSelectionTooltipData | null>(null);

  const [dayPopover, setDayPopover] = useState<DayPopoverData | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltipData | null>(null);

  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>(ALL_TEAMS_FILTER_VALUE);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORY_OPTIONS);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const appName = "신사옥 관리";

  // Firebase 인증 상태 감시
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const hideScheduleTooltip = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  const closeDayPopover = useCallback(() => {
    setDayPopover(null);
    hideScheduleTooltip();
  }, [hideScheduleTooltip]);

  const cancelDateSelection = useCallback(() => {
    setDateSelectionPhase('idle');
    setPendingStartDate(null);
    setDateSelectionTooltip(null);
    closeDayPopover();
    hideScheduleTooltip();
  }, [closeDayPopover, hideScheduleTooltip]);

  const openModal = useCallback((mode: ModalMode, schedule?: Schedule | null, dateParam?: NewScheduleDateParam) => {
    setModalMode(mode);
    setSelectedSchedule(schedule || null);
    if (mode === ModalMode.Create && dateParam) {
      setDateForNewSchedule(dateParam);
    } else {
      setDateForNewSchedule(null);
    }
    cancelDateSelection(); 
    closeDayPopover();
    hideScheduleTooltip();
  }, [cancelDateSelection, closeDayPopover, hideScheduleTooltip]);

  const closeModal = useCallback(() => {
    setModalMode(null);
    setSelectedSchedule(null);
    setDateForNewSchedule(null);
    closeDayPopover(); 
    hideScheduleTooltip();
  }, [closeDayPopover, hideScheduleTooltip]);

  const handleSaveSchedule = useCallback(async (scheduleData: Schedule) => {
    try {
      console.log('스케줄 저장 요청:', scheduleData);
      
      if (modalMode === ModalMode.Create) {
        await addSchedule({
          title: scheduleData.title,
          content: scheduleData.content,
          assignee: scheduleData.assignee,
          team: scheduleData.team,
          category: scheduleData.category,
          startDate: scheduleData.startDate,
          endDate: scheduleData.endDate,
          color: scheduleData.color,
          files: scheduleData.files
        });
        alert('스케줄이 성공적으로 생성되었습니다.');
      } else if (modalMode === ModalMode.Edit && selectedSchedule) {
        await updateSchedule(selectedSchedule.id, {
          title: scheduleData.title,
          content: scheduleData.content,
          assignee: scheduleData.assignee,
          team: scheduleData.team,
          category: scheduleData.category,
          startDate: scheduleData.startDate,
          endDate: scheduleData.endDate,
          color: scheduleData.color,
          files: scheduleData.files
        });
        alert('스케줄이 성공적으로 수정되었습니다.');
      }
      closeModal();
    } catch (error) {
      console.error('스케줄 저장 오류:', error);
      
      // 구체적인 오류 메시지 표시
      if (error instanceof Error) {
        alert(`오류가 발생했습니다: ${error.message}`);
      } else {
        alert('스케줄 저장 중 알 수 없는 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  }, [modalMode, selectedSchedule, addSchedule, updateSchedule, closeModal]);

  const handleDeleteSchedule = useCallback(async (scheduleId: string) => {
    try {
      console.log('스케줄 삭제 요청:', scheduleId);
      await deleteSchedule(scheduleId);
      alert('스케줄이 성공적으로 삭제되었습니다.');
      closeModal();
    } catch (error) {
      console.error('스케줄 삭제 오류:', error);
      
      // 구체적인 오류 메시지 표시
      if (error instanceof Error) {
        alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
      } else {
        alert('스케줄 삭제 중 알 수 없는 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  }, [deleteSchedule, closeModal]);
  
  const handleAddScheduleClick = useCallback(() => {
    const today = getCurrentDateISO();
    openModal(ModalMode.Create, null, { startDate: today, endDate: today });
  }, [openModal]);

  const handleDateClickFromCalendar = useCallback((dateString: string) => {
    closeDayPopover();
    hideScheduleTooltip();
    if (dateSelectionPhase === 'idle') {
      setPendingStartDate(dateString);
      setDateSelectionPhase('selectingEndDate');
    } else if (dateSelectionPhase === 'selectingEndDate' && pendingStartDate) {
      const startDateObj = createDateFromISO(pendingStartDate);
      const endDateObj = createDateFromISO(dateString);

      if (endDateObj < startDateObj) {
        alert("종료일은 시작일보다 빠를 수 없습니다. 다시 선택해주세요.");
        cancelDateSelection();
        return;
      }
      openModal(ModalMode.Create, null, { startDate: pendingStartDate, endDate: dateString });
    }
  }, [dateSelectionPhase, pendingStartDate, openModal, cancelDateSelection, closeDayPopover, hideScheduleTooltip]);

  const showDayPopoverHandler = useCallback((dateStr: string, targetRect: DOMRect, hiddenSchedules: Schedule[]) => {
    hideScheduleTooltip(); 
    
    if (hiddenSchedules.length === 0) {
      return;
    }

    const popoverWidth = 280; 
    const popoverHeightEstimate = Math.min(300, hiddenSchedules.length * 36 + 48); 
    
    let top = targetRect.bottom + window.scrollY + 5;
    let left = targetRect.left + window.scrollX + (targetRect.width / 2) - (popoverWidth / 2) ;

    if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - 10;
    }
    if (left < 10) {
        left = 10;
    }
    if (top + popoverHeightEstimate > window.innerHeight) {
        top = targetRect.top + window.scrollY - popoverHeightEstimate - 5;
    }
     if (top < 10 && targetRect.top + window.scrollY - popoverHeightEstimate - 5 > 10) {
         top = targetRect.bottom + window.scrollY + 5;
     } else if (top < 10) {
         top = 10; 
     }

    setDayPopover({
        dateStr,
        schedules: hiddenSchedules, 
        position: { top, left, width: popoverWidth },
        triggerRect: targetRect
    });
  }, [schedules, hideScheduleTooltip]); 

  const handleScheduleMouseEnter = useCallback((scheduleItem: Schedule, event: React.MouseEvent) => {
    setActiveTooltip({ schedule: scheduleItem, x: event.clientX, y: event.clientY });
  }, []);

  const handleScheduleMouseMove = useCallback((event: React.MouseEvent) => {
    setActiveTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null);
  }, []);

  const handleCalendarMouseMove = useCallback((event: React.MouseEvent) => {
    if (dateSelectionPhase === 'selectingEndDate' && pendingStartDate) {
      setDateSelectionTooltip({
        text: `시작일: ${formatDateToDisplay(pendingStartDate)} | 종료일을 클릭하세요.`,
        x: event.clientX,
        y: event.clientY,
      });
    }
  }, [dateSelectionPhase, pendingStartDate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (activeTooltip) {
            hideScheduleTooltip();
        } else if (dayPopover) {
          closeDayPopover();
        } else if (modalMode) {
          closeModal();
        } else if (dateSelectionPhase !== 'idle') {
          cancelDateSelection();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalMode, dateSelectionPhase, closeModal, cancelDateSelection, dayPopover, closeDayPopover, activeTooltip, hideScheduleTooltip]);

  const uniqueTeamsForFilter = useMemo(() => {
    const teams = new Set(schedules.map(s => s.team).filter(Boolean));
    return Array.from(teams).sort();
  }, [schedules]);

  const handleTeamFilterChange = (team: string) => {
    setSelectedTeamFilter(team);
    closeDayPopover();
    hideScheduleTooltip();
  };

  const handleCategoryToggle = (categoryToToggle: string) => {
    if (categoryToToggle === 'all') {
      setSelectedCategories(prev =>
        prev.length === CATEGORY_OPTIONS.length ? [] : CATEGORY_OPTIONS
      );
    } else {
      setSelectedCategories(prev =>
        prev.includes(categoryToToggle)
          ? prev.filter(c => c !== categoryToToggle)
          : [...prev, categoryToToggle]
      );
    }
    closeDayPopover();
    hideScheduleTooltip();
  };

  const filteredSchedulesForCalendar = useMemo(() => {
    let filtered = schedules;
    
    // 팀 필터 적용
    if (selectedTeamFilter !== ALL_TEAMS_FILTER_VALUE) {
      filtered = filtered.filter(s => s.team === selectedTeamFilter);
    }
    
    // 카테고리 필터 적용
    if (selectedCategories.length < CATEGORY_OPTIONS.length) {
      filtered = filtered.filter(s => {
        // '직접입력' 필터가 선택된 경우, 기본 카테고리 옵션에 없는 모든 카테고리를 포함
        if (selectedCategories.includes('직접입력') && !CATEGORY_OPTIONS.slice(0, -1).includes(s.category)) {
          return true;
        }
        // 일반적인 카테고리 필터링
        return selectedCategories.includes(s.category);
      });
    }
    
    return filtered;
  }, [schedules, selectedTeamFilter, selectedCategories]);

  // 인증 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 경우 인증 컴포넌트 표시
  if (!user) {
    return <AuthComponent user={user} userProfile={null} onAuthSuccess={() => {}} onAdminClick={() => setShowAdminPanel(true)} />;
  }

  // 사용자 프로필 로딩 중
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto mb-4"></div>
          <p>사용자 정보를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 사용자 프로필 오류
  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
        <div className="text-center text-red-400">
          <p className="text-xl mb-2">사용자 정보 오류</p>
          <p>{profileError}</p>
        </div>
      </div>
    );
  }

  // 최초 로그인 설정 필요
  if (userProfile?.isFirstLogin) {
    return (
      <FirstLoginSetup
        userEmail={user.email}
        onComplete={completeFirstLoginSetup}
      />
    );
  }

  // 스케줄 데이터 로딩 중
  if (schedulesLoading) {
    return (
      <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-slate-900 to-slate-700 text-white">
        <AuthComponent user={user} userProfile={userProfile} onAuthSuccess={() => {}} onAdminClick={() => setShowAdminPanel(true)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto mb-4"></div>
            <p>스케줄 데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 스케줄 데이터 오류
  if (schedulesError) {
    return (
      <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-slate-900 to-slate-700 text-white">
        <AuthComponent user={user} userProfile={userProfile} onAuthSuccess={() => {}} onAdminClick={() => setShowAdminPanel(true)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-400">
            <p className="text-xl mb-2">오류가 발생했습니다</p>
            <p>{schedulesError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gradient-to-br from-slate-900 to-slate-700 text-white">
      <AuthComponent user={user} userProfile={userProfile} onAuthSuccess={() => {}} onAdminClick={() => setShowAdminPanel(true)} />
      
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-sky-300">{appName}</h1>
      </header>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <CalendarHeader
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            currentView={currentView}
            setCurrentView={(newView) => { 
              setCurrentView(newView); 
              closeDayPopover(); 
              hideScheduleTooltip(); 
            }}
            onAddSchedule={() => { 
              handleAddScheduleClick(); 
              closeDayPopover(); 
              hideScheduleTooltip(); 
            }}
            isDateSelectionActive={dateSelectionPhase !== 'idle'}
            uniqueTeams={uniqueTeamsForFilter}
            selectedTeamFilter={selectedTeamFilter}
            onTeamFilterChange={handleTeamFilterChange}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
          />

          <main className="flex-1 mt-4">
            {currentView === ViewMode.Calendar ? (
              <CalendarView
                schedules={filteredSchedulesForCalendar}
                currentMonth={currentMonth}
                onScheduleClick={(schedule) => openModal(ModalMode.View, schedule)}
                onDateClick={handleDateClickFromCalendar}
                dateSelectionPhase={dateSelectionPhase}
                onShowDayPopover={showDayPopoverHandler}
                onScheduleMouseEnter={handleScheduleMouseEnter}
                onScheduleMouseLeave={hideScheduleTooltip}
                onScheduleMouseMove={handleScheduleMouseMove}
                onCalendarMouseMove={handleCalendarMouseMove}
                allSchedules={schedules}
              />
            ) : (
              <CardListView
                schedules={filteredSchedulesForCalendar}
                currentUserEmail={user?.email}
                onScheduleClick={(schedule) => openModal(ModalMode.View, schedule)}
                onEditClick={(schedule) => openModal(ModalMode.Edit, schedule)}
                onDeleteClick={handleDeleteSchedule}
              />
            )}
          </main>
        </div>
      </div>

      {modalMode && (
        <ScheduleModal
          isOpen={!!modalMode}
          mode={modalMode}
          schedule={selectedSchedule}
          dateForNewSchedule={dateForNewSchedule}
          userProfile={userProfile}
          currentUserEmail={user?.email}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteSchedule}
          onClose={closeModal}
          onSetMode={setModalMode}
        />
      )}

      {dayPopover && (
        <DaySchedulePopover
          popoverData={dayPopover}
          onClose={closeDayPopover}
          onScheduleSelect={(schedule) => openModal(ModalMode.View, schedule)}
          onScheduleMouseEnter={handleScheduleMouseEnter}
          onScheduleMouseLeave={hideScheduleTooltip}
          onScheduleMouseMove={handleScheduleMouseMove}
        />
      )}

      <DateSelectionTooltip tooltipData={dateSelectionTooltip} />

      {activeTooltip && (
        <ScheduleTooltip
          tooltipData={activeTooltip}
        />
      )}

      {showAdminPanel && (
        <AdminPanel
          user={user}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
      
      <Analytics />
    </div>
  );
};

export default App;
