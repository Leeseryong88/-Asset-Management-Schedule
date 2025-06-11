import React, { useState } from 'react';
import { useAdminFunctions } from '../hooks/useAdminFunctions';
import { TEAM_OPTIONS } from '../constants';
import { formatDateToDisplay } from '../utils/dateUtils';
import { PencilIcon, TrashIcon, UsersIcon, CalendarIcon, XMarkIcon, CheckIcon } from './Icons';

interface AdminPanelProps {
  user: any;
  onClose: () => void;
}

interface EditingUser {
  id: string;
  displayName: string;
  team: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user, onClose }) => {
  const { users, allSchedules, loading, error, updateUser, deleteUser, deleteSchedule } = useAdminFunctions(user);
  const [activeTab, setActiveTab] = useState<'users' | 'schedules'>('users');
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);

  const handleUserEdit = (user: any) => {
    setEditingUser({
      id: user.id,
      displayName: user.displayName,
      team: user.team
    });
  };

  const handleUserSave = async () => {
    if (!editingUser) return;
    
    try {
      await updateUser(editingUser.id, {
        displayName: editingUser.displayName,
        team: editingUser.team
      });
      setEditingUser(null);
      alert('사용자 정보가 수정되었습니다.');
    } catch (error) {
      alert('사용자 정보 수정 중 오류가 발생했습니다.');
    }
  };

  const handleUserDelete = async (userId: string, userEmail: string) => {
    if (window.confirm(`정말로 "${userEmail}" 사용자를 삭제하시겠습니까?`)) {
      try {
        await deleteUser(userId);
        alert('사용자가 삭제되었습니다.');
      } catch (error) {
        alert('사용자 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleScheduleDelete = async (scheduleId: string, scheduleTitle: string) => {
    if (window.confirm(`정말로 "${scheduleTitle}" 일정을 삭제하시겠습니까?`)) {
      try {
        await deleteSchedule(scheduleId);
        alert('일정이 삭제되었습니다.');
      } catch (error) {
        alert('일정 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-8 text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400 mx-auto mb-4"></div>
          <p>관리자 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-8 text-white text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded">
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-2xl font-semibold text-red-400">🔧 관리자 패널</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <XMarkIcon className="w-7 h-7" />
          </button>
        </div>

        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-slate-700 text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UsersIcon className="w-5 h-5 mr-2" />
            사용자 관리 ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('schedules')}
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'schedules'
                ? 'bg-slate-700 text-sky-400 border-b-2 border-sky-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarIcon className="w-5 h-5 mr-2" />
            스케줄 관리 ({allSchedules.length})
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">등록된 사용자 목록</h3>
              {users.length === 0 ? (
                <p className="text-slate-400 text-center py-8">등록된 사용자가 없습니다.</p>
              ) : (
                <div className="grid gap-4">
                  {users.map((user) => (
                    <div key={user.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                      {editingUser?.id === user.id ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-1">이름</label>
                              <input
                                type="text"
                                value={editingUser.displayName}
                                onChange={(e) => setEditingUser({...editingUser, displayName: e.target.value})}
                                className="w-full p-2 bg-slate-600 border border-slate-500 rounded text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-1">팀</label>
                              <select
                                value={editingUser.team}
                                onChange={(e) => setEditingUser({...editingUser, team: e.target.value})}
                                className="w-full p-2 bg-slate-600 border border-slate-500 rounded text-white"
                              >
                                {TEAM_OPTIONS.map(team => (
                                  <option key={team} value={team}>{team}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={handleUserSave}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                            >
                              <CheckIcon className="w-4 h-4 inline mr-1" />
                              저장
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded text-sm"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-white font-medium">{user.displayName}</p>
                            <p className="text-slate-400 text-sm">{user.email}</p>
                            <p className="text-slate-400 text-sm">팀: {user.team}</p>
                            <p className="text-slate-500 text-xs">
                              가입일: {user.createdAt?.toDate?.()?.toLocaleDateString() || '알 수 없음'}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUserEdit(user)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded text-sm"
                              title="수정"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUserDelete(user.id, user.email)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded text-sm"
                              title="삭제"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedules' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200 mb-4">전체 스케줄 목록</h3>
              {allSchedules.length === 0 ? (
                <p className="text-slate-400 text-center py-8">등록된 스케줄이 없습니다.</p>
              ) : (
                <div className="grid gap-4">
                  {allSchedules.map((schedule) => (
                    <div key={schedule.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div
                              className="w-4 h-4 rounded-full mr-3"
                              style={{ backgroundColor: schedule.color }}
                            ></div>
                            <h4 className="text-white font-medium">{schedule.title}</h4>
                            {schedule.category && (
                              <span className="ml-2 px-2 py-1 bg-slate-600 text-xs rounded">
                                {schedule.category}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mb-1">
                            기간: {formatDateToDisplay(schedule.startDate)} ~ {formatDateToDisplay(schedule.endDate)}
                          </p>
                          <p className="text-slate-400 text-sm mb-1">담당자: {schedule.assignee}</p>
                          <p className="text-slate-400 text-sm mb-1">팀: {schedule.team}</p>
                          {schedule.content && (
                            <p className="text-slate-400 text-sm mb-1 whitespace-pre-line">내용: {schedule.content}</p>
                          )}
                          <div className="flex space-x-4 text-xs text-slate-500">
                            {schedule.createdBy && <span>생성자: {schedule.createdBy}</span>}
                            {schedule.updatedBy && <span>수정자: {schedule.updatedBy}</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleScheduleDelete(schedule.id, schedule.title)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded text-sm ml-4"
                          title="삭제"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 