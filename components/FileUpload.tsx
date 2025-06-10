import React, { useState, useCallback, useEffect } from 'react';
import { UploadedFile } from '../types';
import {XCircleIcon, PaperClipIcon, ArrowUpTrayIcon, EyeIcon, ArrowDownTrayIcon} from './Icons';
import { useFileUpload } from '../hooks/useFileUpload';

interface FileUploadProps {
  initialFiles?: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  scheduleId?: string; // For Firebase Storage upload
}

const FileUpload: React.FC<FileUploadProps> = ({ initialFiles = [], onFilesChange, scheduleId }) => {
  const [currentFiles, setCurrentFiles] = useState<UploadedFile[]>(initialFiles);
  const { uploading, uploadMultipleFiles, downloadFile, openFile, deleteFile } = useFileUpload();

  useEffect(() => {
    setCurrentFiles(initialFiles);
  }, [initialFiles]);

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedRawFiles = Array.from(event.target.files || []);
    if (selectedRawFiles.length === 0) return;

    // 50MB 크기 제한 체크 (50 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = selectedRawFiles.filter(file => file.size > MAX_FILE_SIZE);
    
    if (oversizedFiles.length > 0) {
      const oversizedFileNames = oversizedFiles.map(file => 
        `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)}MB)`
      ).join('\n');
      
      alert(`파일 크기 제한 초과!\n\n다음 파일들은 50MB를 초과합니다:\n${oversizedFileNames}\n\n50MB 이상의 파일은 슬랙 또는 공유폴더를 이용하시고\n내용에 폴더 위치를 기록해주세요.`);
      
      // 파일 입력 초기화
      event.target.value = '';
      return;
    }

    try {
      let newUploadedFiles: UploadedFile[];
      
      if (scheduleId) {
        // Firebase Storage에 업로드
        newUploadedFiles = await uploadMultipleFiles(selectedRawFiles, scheduleId);
      } else {
        // 로컬 처리 (임시 ID 사용)
        newUploadedFiles = await Promise.all(
          selectedRawFiles.map(async (file): Promise<UploadedFile> => {
            let dataUrl: string | null = null;
            if (file.type.startsWith('image/')) {
              dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
              });
            }
            return {
              id: `temp-${file.name}-${file.lastModified}-${file.size}`,
              name: file.name,
              type: file.type,
              size: file.size,
              dataUrl,
            };
          })
        );
      }
      
      const updatedFiles = [...currentFiles, ...newUploadedFiles].reduce((acc, current) => {
          if (!acc.find(item => item.id === current.id)) {
              acc.push(current);
          }
          return acc;
      }, [] as UploadedFile[]);
      
      setCurrentFiles(updatedFiles);
      onFilesChange(updatedFiles);
    } catch (error) {
      console.error('파일 업로드 오류:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    }
    
    // Reset file input to allow selecting the same file again if removed
    event.target.value = '';

  }, [currentFiles, onFilesChange, scheduleId, uploadMultipleFiles]);

  const removeFile = useCallback(async (fileIdToRemove: string) => {
    try {
      const fileToRemove = currentFiles.find(file => file.id === fileIdToRemove);
      
      // Firebase Storage에서 파일 삭제
      if (fileToRemove?.storagePath) {
        await deleteFile(fileToRemove.storagePath);
      }
      
      const updatedFiles = currentFiles.filter(file => file.id !== fileIdToRemove);
      setCurrentFiles(updatedFiles);
      onFilesChange(updatedFiles);
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      alert('파일 삭제 중 오류가 발생했습니다.');
    }
  }, [currentFiles, onFilesChange, deleteFile]);

  const handleDownloadFile = useCallback(async (file: UploadedFile) => {
    try {
      if (file.downloadURL) {
        await downloadFile(file.downloadURL, file.name);
      }
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  }, [downloadFile]);

  const handleOpenFile = useCallback((file: UploadedFile) => {
    if (file.downloadURL) {
      openFile(file.downloadURL);
    }
  }, [openFile]);

  return (
    <div className="space-y-3">
      <label
        htmlFor="file-upload-input"
        className={`w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-slate-600 rounded-md cursor-pointer hover:border-sky-500 bg-slate-700/50 hover:bg-slate-700 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <ArrowUpTrayIcon className="w-6 h-6 mr-2 text-sky-400" />
        <span className="text-sm text-slate-300">
          {uploading ? '업로드 중...' : '파일 선택 또는 드래그 앤 드롭 (여러 파일 가능, 최대 50MB)'}
        </span>
        <input
            id="file-upload-input"
            type="file"
            multiple
            onChange={handleFileSelect}
            className="sr-only"
            accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,.zip,application/zip"
            disabled={uploading}
        />
      </label>
      
      {currentFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-300">첨부된 파일:</h4>
          <ul className="max-h-40 overflow-y-auto space-y-2 p-2 bg-slate-700 rounded-md">
            {currentFiles.map(file => (
              <li key={file.id} className="flex items-center justify-between p-2 bg-slate-600/70 rounded text-sm text-slate-200">
                <div className="flex items-center truncate">
                    <PaperClipIcon className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                    <span className="truncate" title={file.name}>{file.name}</span>
                    <span className="ml-2 text-xs text-slate-400 whitespace-nowrap">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <div className="flex items-center ml-2 space-x-1">
                  {file.downloadURL && (
                    <>
                      <button
                        onClick={() => handleOpenFile(file)}
                        className="p-1 text-blue-400 hover:text-blue-300 rounded-full hover:bg-blue-500/20 transition-colors"
                        title="파일 열기"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="p-1 text-green-400 hover:text-green-300 rounded-full hover:bg-green-500/20 transition-colors"
                        title="파일 다운로드"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-red-400 hover:text-red-300 rounded-full hover:bg-red-500/20 transition-colors"
                    title="파일 삭제"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;