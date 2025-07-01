import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// 기존 데이터의 구조를 정리하는 유틸리티
export const cleanupScheduleData = async () => {
  try {
    console.log('데이터 정리 시작...');
    
    const schedulesRef = collection(db, 'schedules');
    const snapshot = await getDocs(schedulesRef);
    
    let totalCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const docSnap of snapshot.docs) {
      totalCount++;
      try {
        const data = docSnap.data();
        
        // 수정이 필요한지 확인
        let needsUpdate = false;
        const updateData: any = {};
        
        // 날짜 필드 확인 및 수정
        if (data.createdAt && !(data.createdAt instanceof Timestamp)) {
          if (data.createdAt.toDate) {
            updateData.createdAt = Timestamp.fromDate(data.createdAt.toDate());
          } else if (data.createdAt instanceof Date) {
            updateData.createdAt = Timestamp.fromDate(data.createdAt);
          } else {
            updateData.createdAt = Timestamp.now();
          }
          needsUpdate = true;
        }
        
        if (data.updatedAt && !(data.updatedAt instanceof Timestamp)) {
          if (data.updatedAt.toDate) {
            updateData.updatedAt = Timestamp.fromDate(data.updatedAt.toDate());
          } else if (data.updatedAt instanceof Date) {
            updateData.updatedAt = Timestamp.fromDate(data.updatedAt);
          } else {
            updateData.updatedAt = Timestamp.now();
          }
          needsUpdate = true;
        }
        
        // 파일 데이터에서 dataUrl 제거
        if (data.files && Array.isArray(data.files)) {
          const cleanedFiles = data.files.map((file: any) => ({
            id: String(file.id || ''),
            name: String(file.name || ''),
            type: String(file.type || ''),
            size: Number(file.size || 0),
            downloadURL: file.downloadURL ? String(file.downloadURL) : null,
            storagePath: file.storagePath ? String(file.storagePath) : null
            // dataUrl 제거
          }));
          
          // 기존 파일 구조와 다른 경우에만 업데이트
          if (JSON.stringify(cleanedFiles) !== JSON.stringify(data.files)) {
            updateData.files = cleanedFiles;
            needsUpdate = true;
          }
        }
        
        // 문자열 필드 정리
        const stringFields = ['title', 'content', 'assignee', 'team', 'category', 'startDate', 'endDate', 'color', 'createdBy', 'updatedBy'];
        for (const field of stringFields) {
          if (data[field] !== undefined && typeof data[field] !== 'string') {
            updateData[field] = String(data[field] || '');
            needsUpdate = true;
          }
        }
        
        // 필수 기본값 설정
        if (!data.category) {
          updateData.category = '공사';
          needsUpdate = true;
        }
        
        if (!data.color) {
          updateData.color = '#3B82F6';
          needsUpdate = true;
        }
        
        // 업데이트 실행
        if (needsUpdate) {
          await updateDoc(doc(db, 'schedules', docSnap.id), updateData);
          updatedCount++;
          console.log(`문서 업데이트 완료: ${docSnap.id}`);
        }
        
      } catch (error) {
        console.error(`문서 처리 오류 (${docSnap.id}):`, error);
        errorCount++;
      }
    }
    
    console.log('데이터 정리 완료:', {
      총_문서수: totalCount,
      업데이트된_문서수: updatedCount,
      오류_발생_문서수: errorCount
    });
    
    return {
      total: totalCount,
      updated: updatedCount,
      errors: errorCount
    };
    
  } catch (error) {
    console.error('데이터 정리 중 오류:', error);
    throw error;
  }
};

// 손상된 문서 식별 및 삭제
export const identifyCorruptedSchedules = async () => {
  try {
    console.log('손상된 문서 식별 시작...');
    
    const schedulesRef = collection(db, 'schedules');
    const snapshot = await getDocs(schedulesRef);
    
    const corruptedDocs: string[] = [];
    
    for (const docSnap of snapshot.docs) {
      try {
        const data = docSnap.data();
        
        // 필수 필드 확인
        const requiredFields = ['title', 'startDate', 'endDate'];
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
          console.log(`손상된 문서 발견 (${docSnap.id}): 누락된 필드 - ${missingFields.join(', ')}`);
          corruptedDocs.push(docSnap.id);
          continue;
        }
        
        // 파일 배열 구조 확인
        if (data.files && !Array.isArray(data.files)) {
          console.log(`손상된 문서 발견 (${docSnap.id}): files 필드가 배열이 아님`);
          corruptedDocs.push(docSnap.id);
          continue;
        }
        
        // 날짜 형식 확인
        if (data.startDate && typeof data.startDate !== 'string') {
          console.log(`손상된 문서 발견 (${docSnap.id}): startDate가 문자열이 아님`);
          corruptedDocs.push(docSnap.id);
          continue;
        }
        
      } catch (error) {
        console.error(`문서 검증 오류 (${docSnap.id}):`, error);
        corruptedDocs.push(docSnap.id);
      }
    }
    
    console.log(`손상된 문서 ${corruptedDocs.length}개 식별됨:`, corruptedDocs);
    return corruptedDocs;
    
  } catch (error) {
    console.error('문서 식별 중 오류:', error);
    throw error;
  }
};

// 손상된 문서 삭제 (주의: 영구 삭제됨)
export const deleteCorruptedSchedules = async (docIds: string[]) => {
  try {
    console.log(`${docIds.length}개의 손상된 문서 삭제 시작...`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const docId of docIds) {
      try {
        await deleteDoc(doc(db, 'schedules', docId));
        deletedCount++;
        console.log(`문서 삭제 완료: ${docId}`);
      } catch (error) {
        console.error(`문서 삭제 오류 (${docId}):`, error);
        errorCount++;
      }
    }
    
    console.log('손상된 문서 삭제 완료:', {
      삭제된_문서수: deletedCount,
      오류_발생_문서수: errorCount
    });
    
    return {
      deleted: deletedCount,
      errors: errorCount
    };
    
  } catch (error) {
    console.error('문서 삭제 중 오류:', error);
    throw error;
  }
};

// 전체 데이터 상태 확인
export const checkDataHealth = async () => {
  try {
    console.log('데이터 상태 점검 시작...');
    
    const schedulesRef = collection(db, 'schedules');
    const snapshot = await getDocs(schedulesRef);
    
    const stats = {
      totalDocuments: 0,
      validDocuments: 0,
      documentsWithFiles: 0,
      documentsWithLargeFiles: 0,
      documentsWithDataUrl: 0,
      averageFileSize: 0,
      totalFileSize: 0
    };
    
    for (const docSnap of snapshot.docs) {
      stats.totalDocuments++;
      
      try {
        const data = docSnap.data();
        
        // 기본 유효성 확인
        if (data.title && data.startDate && data.endDate) {
          stats.validDocuments++;
        }
        
        // 파일 통계
        if (data.files && Array.isArray(data.files) && data.files.length > 0) {
          stats.documentsWithFiles++;
          
          for (const file of data.files) {
            if (file.size) {
              stats.totalFileSize += file.size;
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB 이상
              stats.documentsWithLargeFiles++;
            }
            
            if (file.dataUrl) {
              stats.documentsWithDataUrl++;
            }
          }
        }
        
      } catch (error) {
        console.error(`문서 분석 오류 (${docSnap.id}):`, error);
      }
    }
    
    if (stats.documentsWithFiles > 0) {
      stats.averageFileSize = stats.totalFileSize / stats.documentsWithFiles;
    }
    
    console.log('데이터 상태 점검 완료:', stats);
    return stats;
    
  } catch (error) {
    console.error('데이터 상태 점검 중 오류:', error);
    throw error;
  }
}; 