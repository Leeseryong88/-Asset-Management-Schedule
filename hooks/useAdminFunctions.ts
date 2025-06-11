import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Schedule } from '../types';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  team: string;
  isFirstLogin: boolean;
  createdAt: any;
  updatedAt: any;
}

export const useAdminFunctions = (user: any) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모든 사용자 정보 불러오기
  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const usersData: UserProfile[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
          team: data.team,
          isFirstLogin: data.isFirstLogin,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      setUsers(usersData);
    } catch (error) {
      console.error('사용자 목록 불러오기 오류:', error);
      setError('사용자 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 모든 스케줄 불러오기
  const fetchAllSchedules = async () => {
    try {
      const schedulesRef = collection(db, 'schedules');
      const q = query(schedulesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const schedulesData: Schedule[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const files = (data.files || []).map((file: any) => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: file.dataUrl || null,
          downloadURL: file.downloadURL || null,
          storagePath: file.storagePath || null
        }));

        schedulesData.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          assignee: data.assignee,
          startDate: data.startDate,
          endDate: data.endDate,
          color: data.color,
          team: data.team,
          category: data.category || '공사',
          files: files,
          createdBy: data.createdBy || '',
          updatedBy: data.updatedBy || ''
        });
      });
      
      setAllSchedules(schedulesData);
    } catch (error) {
      console.error('전체 스케줄 불러오기 오류:', error);
      setError('전체 스케줄을 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 사용자 정보 수정
  const updateUser = async (userId: string, userData: Partial<UserProfile>) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...userData,
        updatedAt: new Date()
      });
      await fetchUsers(); // 사용자 목록 새로고침
    } catch (error) {
      console.error('사용자 정보 수정 오류:', error);
      throw new Error('사용자 정보 수정 중 오류가 발생했습니다.');
    }
  };

  // 사용자 삭제
  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      await fetchUsers(); // 사용자 목록 새로고침
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      throw new Error('사용자 삭제 중 오류가 발생했습니다.');
    }
  };

  // 스케줄 삭제
  const deleteSchedule = async (scheduleId: string) => {
    try {
      await deleteDoc(doc(db, 'schedules', scheduleId));
      await fetchAllSchedules(); // 스케줄 목록 새로고침
    } catch (error) {
      console.error('스케줄 삭제 오류:', error);
      throw new Error('스케줄 삭제 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchAllSchedules()]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  return {
    users,
    allSchedules,
    loading,
    error,
    updateUser,
    deleteUser,
    deleteSchedule,
    refreshData: () => Promise.all([fetchUsers(), fetchAllSchedules()])
  };
}; 