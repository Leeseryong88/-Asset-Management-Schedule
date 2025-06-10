import React, { useState } from 'react';

interface FirstLoginSetupProps {
  userEmail: string;
  onComplete: (displayName: string, team: string, currentPassword: string, newPassword: string) => Promise<void>;
}

const TEAM_OPTIONS = ['자산운영', '안전보건', '푸드컬쳐'];

const FirstLoginSetup: React.FC<FirstLoginSetupProps> = ({ userEmail, onComplete }) => {
  const [displayName, setDisplayName] = useState('');
  const [team, setTeam] = useState('자산운영');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!displayName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (displayName.trim().length < 2) {
      setError('이름은 2자 이상 입력해주세요.');
      return;
    }

    if (!team) {
      setError('팀을 선택해주세요.');
      return;
    }

    if (!currentPassword) {
      setError('현재 비밀번호를 입력해주세요.');
      return;
    }

    if (!newPassword) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword === currentPassword) {
      setError('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
      return;
    }

    setLoading(true);

    try {
      await onComplete(displayName.trim(), team, currentPassword, newPassword);
    } catch (error: any) {
      setError(error.message || '설정 완료 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700">
      <div className="bg-slate-800 p-8 rounded-lg shadow-2xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-sky-300 mb-2">
            최초 로그인 설정
          </h1>
          <p className="text-slate-400 text-sm">
            {userEmail}
          </p>
          <p className="text-slate-500 text-xs mt-2">
            보안을 위해 비밀번호를 변경하고 이름과 팀을 설정해주세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-300 mb-1">
              이름 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="홍길동"
              required
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="team" className="block text-sm font-medium text-slate-300 mb-1">
              팀 <span className="text-red-400">*</span>
            </label>
            <select
              id="team"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              required
            >
              {TEAM_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-300 mb-1">
              현재 비밀번호 <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="관리자로부터 받은 임시 비밀번호"
              required
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300 mb-1">
              새 비밀번호 <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="새 비밀번호 (6자 이상)"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
              비밀번호 확인 <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="비밀번호를 다시 입력하세요"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded p-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-800 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? '설정 중...' : '설정 완료'}
          </button>
        </form>

        <div className="mt-4 text-xs text-slate-500 text-center">
          <p>※ 설정 완료 후 자동으로 메인 화면으로 이동합니다</p>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginSetup; 