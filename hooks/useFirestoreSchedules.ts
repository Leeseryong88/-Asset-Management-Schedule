import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  Timestamp
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
        // 파일 데이터 완전히 복원 (dataUrl 제외)
        const files = (data.files || []).map((file: any) => ({
          id: file.id || '',
          name: file.name || '',
          type: file.type || '',
          size: file.size || 0,
          dataUrl: null, // 저장된 데이터에서는 dataUrl 사용하지 않음
          downloadURL: file.downloadURL || null,
          storagePath: file.storagePath || null
        }));

        schedulesData.push({
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          assignee: data.assignee || '',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          color: data.color || '#3B82F6',
          team: data.team || '',
          category: data.category || '공사', // 기본값 설정
          files: files,
          createdBy: data.createdBy || '',
          updatedBy: data.updatedBy || ''
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
      console.log('스케줄 저장 시작:', scheduleData);
      
      // Firestore 호환 데이터 구조로 정리
      const cleanedData = {
        title: String(scheduleData.title || ''),
        content: String(scheduleData.content || ''),
        assignee: String(scheduleData.assignee || ''),
        team: String(scheduleData.team || ''),
        category: String(scheduleData.category || '공사'),
        startDate: String(scheduleData.startDate || ''),
        endDate: String(scheduleData.endDate || ''),
        color: String(scheduleData.color || '#3B82F6'),
        // 파일 데이터에서 dataUrl 제거 (Firestore 호환성을 위해)
        files: (scheduleData.files || []).map(file => ({
          id: String(file.id || ''),
          name: String(file.name || ''),
          type: String(file.type || ''),
          size: Number(file.size || 0),
          downloadURL: file.downloadURL ? String(file.downloadURL) : null,
          storagePath: file.storagePath ? String(file.storagePath) : null
        })),
        createdAt: Timestamp.now(), // Firestore Timestamp 사용
        createdBy: String(user.email || ''),
        updatedAt: Timestamp.now(), // Firestore Timestamp 사용
        updatedBy: String(user.email || '')
      };

      console.log('정리된 데이터:', cleanedData);
      await addDoc(collection(db, 'schedules'), cleanedData);
      console.log('스케줄 저장 완료');
    } catch (error) {
      console.error('스케줄 추가 오류 상세:', error);
      if (error instanceof Error) {
        throw new Error(`스케줄 추가 중 오류가 발생했습니다: ${error.message}`);
      } else {
        throw new Error('스케줄 추가 중 알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  const updateSchedule = async (scheduleId: string, scheduleData: Partial<Schedule>) => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      console.log('스케줄 업데이트 시작:', { scheduleId, scheduleData });
      
      const scheduleRef = doc(db, 'schedules', scheduleId);
      
      // Firestore 호환 업데이트 데이터 준비
      const updateData: any = {
        updatedAt: Timestamp.now(), // Firestore Timestamp 사용
        updatedBy: String(user.email || '')
      };

      if (scheduleData.title !== undefined) updateData.title = String(scheduleData.title || '');
      if (scheduleData.content !== undefined) updateData.content = String(scheduleData.content || '');
      if (scheduleData.assignee !== undefined) updateData.assignee = String(scheduleData.assignee || '');
      if (scheduleData.team !== undefined) updateData.team = String(scheduleData.team || '');
      if (scheduleData.category !== undefined) updateData.category = String(scheduleData.category || '공사');
      if (scheduleData.startDate !== undefined) updateData.startDate = String(scheduleData.startDate || '');
      if (scheduleData.endDate !== undefined) updateData.endDate = String(scheduleData.endDate || '');
      if (scheduleData.color !== undefined) updateData.color = String(scheduleData.color || '#3B82F6');
      if (scheduleData.files !== undefined) {
        updateData.files = (scheduleData.files || []).map(file => ({
          id: String(file.id || ''),
          name: String(file.name || ''),
          type: String(file.type || ''),
          size: Number(file.size || 0),
          downloadURL: file.downloadURL ? String(file.downloadURL) : null,
          storagePath: file.storagePath ? String(file.storagePath) : null
        }));
      }
      
      console.log('업데이트 데이터:', updateData);
      await updateDoc(scheduleRef, updateData);
      console.log('스케줄 업데이트 완료');
    } catch (error) {
      console.error('스케줄 수정 오류 상세:', error);
      if (error instanceof Error) {
        throw new Error(`스케줄 수정 중 오류가 발생했습니다: ${error.message}`);
      } else {
        throw new Error('스케줄 수정 중 알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    try {
      console.log('스케줄 삭제 시작:', scheduleId);
      
      // 스케줄에 첨부된 파일들도 Storage에서 삭제
      const scheduleToDelete = schedules.find(s => s.id === scheduleId);
      if (scheduleToDelete && scheduleToDelete.files) {
        for (const file of scheduleToDelete.files) {
          if (file.storagePath) {
            try {
              const fileRef = ref(storage, file.storagePath);
              await deleteObject(fileRef);
              console.log('파일 삭제 완료:', file.name);
            } catch (fileError) {
              console.warn(`파일 삭제 실패: ${file.name}`, fileError);
              // 파일 삭제 실패해도 스케줄은 삭제 진행
            }
          }
        }
      }

      await deleteDoc(doc(db, 'schedules', scheduleId));
      console.log('스케줄 삭제 완료');
    } catch (error) {
      console.error('스케줄 삭제 오류 상세:', error);
      if (error instanceof Error) {
        throw new Error(`스케줄 삭제 중 오류가 발생했습니다: ${error.message}`);
      } else {
        throw new Error('스케줄 삭제 중 알 수 없는 오류가 발생했습니다.');
      }
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