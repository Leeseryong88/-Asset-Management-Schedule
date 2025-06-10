import React, { useState, useEffect, useCallback } from 'react';
import { Schedule, UploadedFile, ModalMode } from '../types';
import { DEFAULT_SCHEDULE_COLOR, PREDEFINED_COLORS, TEAM_OPTIONS } from '../constants';
import FileUpload from './FileUpload';
import ColorPicker from './ColorPicker';
import { getCurrentDateISO, formatDateToDisplay, createDateFromISO } from '../utils/dateUtils';
import { XMarkIcon, PencilIcon, TrashIcon, CheckIcon, EyeIcon, ArrowUturnLeftIcon, ArrowDownTrayIcon } from './Icons';
import { useFileUpload } from '../hooks/useFileUpload';

type NewScheduleDateParam = string | { startDate: string; endDate: string };

interface ScheduleModalProps {
  isOpen: boolean;
  mode: ModalMode;
  schedule?: Schedule | null;
  dateForNewSchedule?: NewScheduleDateParam | null; 
  userProfile?: { displayName: string; team: string } | null;
  onClose: () => void;
  onSave: (schedule: Schedule) => void;
  onDelete: (scheduleId: string) => void;
  onSetMode: (mode: ModalMode) => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  mode,
  schedule,
  dateForNewSchedule,
  userProfile,
  onClose,
  onSave,
  onDelete,
  onSetMode
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [assignee, setAssignee] = useState('');
  const [team, setTeam] = useState(TEAM_OPTIONS[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [color, setColor] = useState(DEFAULT_SCHEDULE_COLOR);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { downloadFile, openFile } = useFileUpload();

  const isViewMode = mode === ModalMode.View;
  const isEditMode = mode === ModalMode.Edit;
  const isCreateMode = mode === ModalMode.Create;

  const resetForm = useCallback(() => {
    if ((isEditMode || isViewMode) && schedule) {
      setTitle(schedule.title);
      setContent(schedule.content);
      setAssignee(schedule.assignee);
      
      if (TEAM_OPTIONS.includes(schedule.team)) {
        setTeam(schedule.team);
      } else {
        setTeam(TEAM_OPTIONS[0]); 
      }

      setStartDate(schedule.startDate);
      setEndDate(schedule.endDate);
      setColor(schedule.color);
      setFiles(schedule.files);
    } else if (isCreateMode) {
      setTitle('');
      setContent('');
      // 사용자 정보가 있으면 자동으로 입력
      setAssignee(userProfile?.displayName || '');
      setTeam(userProfile?.team && TEAM_OPTIONS.includes(userProfile.team) ? userProfile.team : TEAM_OPTIONS[0]); 
      if (typeof dateForNewSchedule === 'string') {
        setStartDate(dateForNewSchedule);
        setEndDate(dateForNewSchedule);
      } else if (dateForNewSchedule && typeof dateForNewSchedule === 'object') {
        setStartDate(dateForNewSchedule.startDate);
        setEndDate(dateForNewSchedule.endDate);
      } else {
        const today = getCurrentDateISO();
        setStartDate(today);
        setEndDate(today);
      }
      setColor(DEFAULT_SCHEDULE_COLOR);
      setFiles([]);
    }
  }, [schedule, isEditMode, isViewMode, isCreateMode, dateForNewSchedule, userProfile]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, mode, schedule, resetForm]);

  const handleFileChange = (newFiles: UploadedFile[]) => {
    setFiles(newFiles);
  };

  const handleSave = () => {
    if (!title.trim() || !startDate || !endDate) {
      alert('제목, 시작일, 종료일은 필수 항목입니다.');
      return;
    }
    // Use createDateFromISO for accurate local date comparison
    if (createDateFromISO(startDate) > createDateFromISO(endDate)) {
        alert('종료일은 시작일보다 빠를 수 없습니다.');
        return;
    }
    
    const newScheduleData: Schedule = {
      id: (isEditMode && schedule) ? schedule.id : Date.now().toString(),
      title,
      content,
      assignee,
      team: team, 
      startDate,
      endDate,
      color,
      files,
    };
    onSave(newScheduleData);
  };
  
  const handleAttemptDelete = () => {
    if (schedule && window.confirm(`'${schedule.title}' 일정을 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
        onDelete(schedule.id);
    }
  };

  const handleOpenFile = async (file: UploadedFile) => {
    if (file.downloadURL) {
      openFile(file.downloadURL);
    } else {
      alert('파일 URL을 찾을 수 없습니다.');
    }
  };

  const handleDownloadFile = async (file: UploadedFile) => {
    try {
      console.log('다운로드 요청된 파일:', file);
      
      if (!file.downloadURL) {
        console.error('파일 downloadURL이 없음:', file);
        alert('파일 다운로드 URL을 찾을 수 없습니다. 파일이 올바르게 업로드되었는지 확인해주세요.');
        return;
      }
      
      if (!file.name) {
        console.error('파일명이 없음:', file);
        alert('파일명을 찾을 수 없습니다.');
        return;
      }
      
      console.log('다운로드 시작:', { url: file.downloadURL, name: file.name });
      await downloadFile(file.downloadURL, file.name);
      console.log('다운로드 완료');
      
    } catch (error) {
      console.error('파일 다운로드 오류 상세:', error);
      console.error('파일 정보:', {
        id: file.id,
        name: file.name,
        downloadURL: file.downloadURL,
        storagePath: file.storagePath
      });
      
      // 사용자에게 더 구체적인 오류 메시지 제공
      const errorMessage = error instanceof Error ? error.message : '파일 다운로드 중 오류가 발생했습니다.';
      alert(`${errorMessage}\n\n개발자 도구(F12)의 Console 탭에서 자세한 오류 정보를 확인할 수 있습니다.`);
    }
  };

  const renderFilePreview = (file: UploadedFile) => {
    // 디버깅용 로그
    console.log('파일 데이터:', {
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      downloadURL: file.downloadURL,
      storagePath: file.storagePath,
      hasDataUrl: !!file.dataUrl
    });
    
    // Firebase Storage에 업로드된 파일인 경우 (downloadURL이 있는 경우)
    if (file.downloadURL) {
      return (
        <div 
          className="text-sm p-3 bg-slate-700 rounded border border-slate-600 cursor-pointer hover:bg-slate-600 transition-colors"
          onClick={() => handleOpenFile(file)}
          title="클릭하여 파일 미리보기"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-200 truncate">{file.name}</p>
              <p className="text-xs text-slate-400">{file.type} - {(file.size / 1024).toFixed(1)} KB</p>
              <p className="text-xs text-green-400">✓ 업로드 완료</p>
              {/* 디버깅용: URL 일부 표시 */}
              <p className="text-xs text-slate-500 truncate" title={file.downloadURL}>
                URL: ...{file.downloadURL.slice(-30)}
              </p>
            </div>
            <div className="flex items-center ml-3 space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // 카드 클릭 이벤트 방지
                  handleDownloadFile(file);
                }}
                className="p-1.5 text-green-400 hover:text-green-300 rounded-full hover:bg-green-500/20 transition-colors"
                title="파일 다운로드"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          {file.dataUrl && file.type.startsWith('image/') && (
            <div className="mt-2">
              <img src={file.dataUrl} alt={file.name} className="max-w-full max-h-32 object-contain rounded border border-slate-600"/>
            </div>
          )}
        </div>
      );
    }
    
    // downloadURL이 없어도 파일이 업로드되었을 수 있으므로 좀 더 유연하게 처리
    return (
      <div className="text-sm p-3 bg-slate-700 rounded border border-slate-600 cursor-not-allowed opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-200 truncate">{file.name}</p>
            <p className="text-xs text-slate-400">{file.type} - {(file.size / 1024).toFixed(1)} KB</p>
            <p className="text-xs text-orange-400">⚠ Download URL 없음</p>
          </div>
        </div>
        {file.dataUrl && file.type.startsWith('image/') && (
          <div className="mt-2">
            <img src={file.dataUrl} alt={file.name} className="max-w-full max-h-32 object-contain rounded border border-slate-600"/>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const modalTitle = isCreateMode ? '새 일정 추가' : isEditMode ? '일정 수정' : schedule?.title || '일정 상세';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-2xl font-semibold text-sky-400">{modalTitle}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-grow">
          {isViewMode && schedule ? (
            <div className="space-y-4 text-slate-300">
              <p><strong className="text-slate-100">내용:</strong> {schedule.content || '없음'}</p>
              <p><strong className="text-slate-100">담당자:</strong> {schedule.assignee || '없음'}</p>
              <p><strong className="text-slate-100">기간:</strong> {formatDateToDisplay(schedule.startDate)} ~ {formatDateToDisplay(schedule.endDate)}</p>
              <p><strong className="text-slate-100">팀:</strong> {schedule.team || '없음'}</p>
              <div>
                <strong className="text-slate-100">첨부파일 ({schedule.files.length}개):</strong>
                {schedule.files.length > 0 ? (
                  <ul className="mt-2 space-y-2 list-inside list-disc">
                    {schedule.files.map(file => (
                      <li key={file.id} className="ml-4">
                        {renderFilePreview(file)}
                      </li>
                    ))}
                  </ul>
                ) : <span className="ml-2 text-slate-400">없음</span>}
                 <p className="mt-2 text-xs text-slate-500">업로드된 파일은 Firebase Storage에서 안전하게 관리됩니다.</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">제목 <span className="text-red-400">*</span></label>
                <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-white" />
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-slate-300 mb-1">내용</label>
                <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={3} className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-white"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="assignee" className="block text-sm font-medium text-slate-300 mb-1">담당자</label>
                  <input type="text" id="assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-white" />
                </div>
                <div>
                  <label htmlFor="team" className="block text-sm font-medium text-slate-300 mb-1">팀</label>
                  <select 
                    id="team" 
                    value={team} 
                    onChange={(e) => setTeam(e.target.value)} 
                    className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-white"
                  >
                    {TEAM_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-1">시작일 <span className="text-red-400">*</span></label>
                  <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-white" />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-1">종료일 <span className="text-red-400">*</span></label>
                  <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2.5 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">색상</label>
                <ColorPicker selectedColor={color} onSelectColor={setColor} colors={PREDEFINED_COLORS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">파일 첨부</label>
                <FileUpload 
                  initialFiles={files} 
                  onFilesChange={handleFileChange} 
                  scheduleId={isCreateMode ? `temp-${Date.now()}` : schedule?.id}
                />
                <p className="mt-1 text-xs text-slate-500">PDF, Excel, 이미지 등 다양한 파일 형식을 업로드할 수 있습니다. (최대 50MB, 초과 시 슬랙/공유폴더 이용)</p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end items-center p-5 border-t border-slate-700 space-x-3">
          {isViewMode && schedule && (
            <>
              <button
                onClick={() => onSetMode(ModalMode.Edit)}
                className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
              >
                <PencilIcon className="w-5 h-5 mr-2" /> 수정
              </button>
              <button
                onClick={handleAttemptDelete}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
              >
                <TrashIcon className="w-5 h-5 mr-2" /> 삭제
              </button>
            </>
          )}
          {(isEditMode || isCreateMode) && (
            <>
              {isEditMode && <button
                  onClick={() => onSetMode(ModalMode.View)}
                  className="flex items-center bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
                >
                  <ArrowUturnLeftIcon className="w-5 h-5 mr-2" /> 보기로 전환
              </button>}
              <button
                onClick={handleSave}
                className="flex items-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
              >
                <CheckIcon className="w-5 h-5 mr-2" /> 저장
              </button>
            </>
          )}
           <button
            onClick={onClose}
            className="bg-slate-500 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
