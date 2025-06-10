import { useState } from 'react';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll 
} from 'firebase/storage';
import { storage } from '../firebase';
import { UploadedFile } from '../types';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const uploadFile = async (file: File, scheduleId: string): Promise<UploadedFile> => {
    setUploading(true);
    
    try {
      // 파일 경로 생성 (schedules/scheduleId/fileName)
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `schedules/${scheduleId}/${fileName}`);
      
      // 파일 업로드
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // 이미지 파일인 경우 미리보기를 위한 dataUrl 생성
      let dataUrl: string | null = null;
      if (file.type.startsWith('image/')) {
        dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }
      
      const uploadedFile: UploadedFile = {
        id: fileName,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        downloadURL,
        storagePath: `schedules/${scheduleId}/${fileName}`
      };
      
      return uploadedFile;
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      throw new Error('파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const uploadMultipleFiles = async (files: File[], scheduleId: string): Promise<UploadedFile[]> => {
    setUploading(true);
    const uploadedFiles: UploadedFile[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        const uploadedFile = await uploadFile(file, scheduleId);
        uploadedFiles.push(uploadedFile);
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      }
      
      return uploadedFiles;
    } catch (error) {
      console.error('다중 파일 업로드 오류:', error);
      throw error;
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const deleteFile = async (storagePath: string): Promise<void> => {
    try {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      throw new Error('파일 삭제 중 오류가 발생했습니다.');
    }
  };

  const downloadFile = async (downloadURL: string, fileName: string): Promise<void> => {
    try {
      console.log('파일 다운로드 시작:', { downloadURL, fileName });
      
      // Firebase Storage URL에서 직접 다운로드 링크 생성
      // CORS 문제를 피하기 위해 fetch 대신 직접 링크 방식 사용
      const a = document.createElement('a');
      a.href = downloadURL;
      a.download = fileName;
      a.target = '_blank'; // 새 탭에서 열기 (다운로드 실패 시)
      
      // 임시로 DOM에 추가
      document.body.appendChild(a);
      a.click();
      
      // 클린업
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
      
      console.log('파일 다운로드 완료');
    } catch (error) {
      console.error('파일 다운로드 오류 상세:', error);
      console.error('다운로드 URL:', downloadURL);
      console.error('파일명:', fileName);
      
      // 대안: URL을 새 탭에서 열기
      try {
        window.open(downloadURL, '_blank');
        console.log('새 탭에서 파일 열기로 대체');
      } catch (openError) {
        console.error('새 탭 열기도 실패:', openError);
        throw new Error('파일 다운로드 중 오류가 발생했습니다. 파일 URL을 확인해주세요.');
      }
    }
  };

  const openFile = (downloadURL: string): void => {
    window.open(downloadURL, '_blank');
  };

  return {
    uploading,
    uploadProgress,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    downloadFile,
    openFile
  };
}; 