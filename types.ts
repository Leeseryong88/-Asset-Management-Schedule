export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string | null; // For image previews or simulated file content
  downloadURL?: string; // Firebase Storage download URL
  storagePath?: string; // Firebase Storage path for deletion
}

export interface Schedule {
  id: string;
  title: string;
  content: string;
  assignee: string;
  team: string; // Changed from remarks to team
  category: string; // 일정 종류 필드 추가
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  color: string;
  files: UploadedFile[];
  createdBy?: string; // 생성자 이메일
  updatedBy?: string; // 수정자 이메일
}

export enum ViewMode {
  Calendar = 'CALENDAR',
  CardList = 'CARD_LIST',
}

export enum ModalMode {
  View = 'VIEW',
  Edit = 'EDIT',
  Create = 'CREATE',
}

export interface ActiveTooltipData {
  schedule: Schedule;
  x: number;
  y: number;
}