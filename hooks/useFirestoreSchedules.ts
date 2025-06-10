import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy 
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Schedule } from '../types';

export const useFirestoreSchedules = (user: any) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const schedulesRef = collection(db, 'schedules');
    const q = query(schedulesRef, orderBy('createdAt', 'desc'));

    // 실시간 데이터 리스너 설정
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schedulesData: Schedule[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // 파일 데이터 완전히 복원
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
          files: files
        });
      });
      console.log('불러온 스케줄 데이터:', schedulesData); // 디버깅용 로그
      setSchedules(schedulesData);
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error('스케줄 데이터 로드 오류:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addSchedule = async (scheduleData: Omit<Schedule, 'id'>) => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      // undefined 값 제거 및 데이터 정리
      const cleanedData = {
        title: scheduleData.title || '',
        content: scheduleData.content || '',
        assignee: scheduleData.assignee || '',
        team: scheduleData.team || '',
        startDate: scheduleData.startDate,
        endDate: scheduleData.endDate,
        color: scheduleData.color || '#3B82F6',
        files: scheduleData.files ? scheduleData.files.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: file.dataUrl || null,
          downloadURL: file.downloadURL || null,
          storagePath: file.storagePath || null
        })) : [],
        createdAt: new Date(),
        createdBy: user.email || '',
        updatedAt: new Date(),
        updatedBy: user.email || ''
      };

      await addDoc(collection(db, 'schedules'), cleanedData);
    } catch (error) {
      console.error('스케줄 추가 오류:', error);
      throw new Error('스케줄 추가 중 오류가 발생했습니다.');
    }
  };

  const updateSchedule = async (scheduleId: string, scheduleData: Partial<Schedule>) => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      const scheduleRef = doc(db, 'schedules', scheduleId);
      
      // undefined 값 제거하여 업데이트 데이터 준비
      const updateData: any = {
        updatedAt: new Date(),
        updatedBy: user.email || ''
      };

      if (scheduleData.title !== undefined) updateData.title = scheduleData.title || '';
      if (scheduleData.content !== undefined) updateData.content = scheduleData.content || '';
      if (scheduleData.assignee !== undefined) updateData.assignee = scheduleData.assignee || '';
      if (scheduleData.team !== undefined) updateData.team = scheduleData.team || '';
      if (scheduleData.startDate !== undefined) updateData.startDate = scheduleData.startDate;
      if (scheduleData.endDate !== undefined) updateData.endDate = scheduleData.endDate;
      if (scheduleData.color !== undefined) updateData.color = scheduleData.color || '#3B82F6';
      if (scheduleData.files !== undefined) {
        updateData.files = scheduleData.files ? scheduleData.files.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: file.dataUrl || null,
          downloadURL: file.downloadURL || null,
          storagePath: file.storagePath || null
        })) : [];
      }
      
      await updateDoc(scheduleRef, updateData);
    } catch (error) {
      console.error('스케줄 수정 오류:', error);
      throw new Error('스케줄 수정 중 오류가 발생했습니다.');
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      // 스케줄에 첨부된 파일들도 Storage에서 삭제
      const scheduleToDelete = schedules.find(s => s.id === scheduleId);
      if (scheduleToDelete && scheduleToDelete.files) {
        for (const file of scheduleToDelete.files) {
          if (file.storagePath) {
            try {
              const fileRef = ref(storage, file.storagePath);
              await deleteObject(fileRef);
            } catch (fileError) {
              console.warn(`파일 삭제 실패: ${file.name}`, fileError);
              // 파일 삭제 실패해도 스케줄은 삭제 진행
            }
          }
        }
      }

      await deleteDoc(doc(db, 'schedules', scheduleId));
    } catch (error) {
      console.error('스케줄 삭제 오류:', error);
      throw new Error('스케줄 삭제 중 오류가 발생했습니다.');
    }
  };

  return {
    schedules,
    loading,
    error,
    addSchedule,
    updateSchedule,
    deleteSchedule
  };
}; 