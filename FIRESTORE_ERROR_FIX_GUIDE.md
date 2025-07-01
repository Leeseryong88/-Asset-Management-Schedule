# 🔧 Firestore 오류 해결 가이드

## 📋 발생했던 오류들

### 1. **FirebaseError: Property array contains an invalid nested entity**
- **원인**: 파일 데이터의 `dataUrl` 필드에 큰 Base64 이미지 데이터가 포함되어 Firestore의 문서 크기 제한 초과
- **해결**: `dataUrl`을 Firestore에 저장하지 않고 로컬 미리보기용으로만 사용

### 2. **스케줄 추가 중 오류**
- **원인**: `new Date()` 객체를 직접 Firestore에 저장하려고 시도
- **해결**: Firestore의 `Timestamp` 객체 사용

### 3. **Array(46), Array(47) 오류**
- **원인**: 잘못된 데이터 구조로 인한 배열 처리 문제
- **해결**: 모든 데이터 타입을 명시적으로 변환하여 일관성 확보

## ✅ 적용된 해결책

### 1. **데이터 구조 개선**
```typescript
// 이전 (문제 있음)
const scheduleData = {
  title: scheduleData.title,  // undefined 가능
  createdAt: new Date(),      // Firestore 비호환
  files: files.map(file => ({
    dataUrl: file.dataUrl     // 큰 Base64 데이터
  }))
};

// 이후 (수정됨)
const scheduleData = {
  title: String(scheduleData.title || ''),  // 명시적 변환
  createdAt: Timestamp.now(),               // Firestore Timestamp
  files: files.map(file => ({
    // dataUrl 제거, downloadURL만 사용
    downloadURL: file.downloadURL ? String(file.downloadURL) : null
  }))
};
```

### 2. **날짜 처리 개선**
- `new Date()` → `Timestamp.now()` 사용
- 모든 날짜 필드를 Firestore 호환 형식으로 변환

### 3. **파일 처리 개선**
- 파일 업로드 시 `dataUrl`은 로컬 미리보기용으로만 사용
- Firestore에는 `downloadURL`과 `storagePath`만 저장
- 파일 크기 제한 및 타입 검증 강화

### 4. **오류 처리 개선**
- 구체적인 오류 메시지 제공
- 콘솔 로그를 통한 디버깅 정보 추가
- 성공/실패 알림 추가

## 🛠️ 데이터 정리 유틸리티 사용법

기존 데이터에 문제가 있을 경우 다음 유틸리티를 사용하여 정리할 수 있습니다:

### 1. **데이터 상태 점검**
```typescript
import { checkDataHealth } from './utils/dataCleanup';

// 브라우저 콘솔에서 실행
const stats = await checkDataHealth();
console.log(stats);
```

### 2. **데이터 자동 정리**
```typescript
import { cleanupScheduleData } from './utils/dataCleanup';

// 기존 데이터를 안전하게 정리
const result = await cleanupScheduleData();
console.log(`${result.updated}개 문서가 업데이트되었습니다.`);
```

### 3. **손상된 데이터 식별**
```typescript
import { identifyCorruptedSchedules } from './utils/dataCleanup';

// 손상된 문서 찾기
const corruptedIds = await identifyCorruptedSchedules();
console.log(`손상된 문서 ${corruptedIds.length}개 발견됨`);
```

### 4. **손상된 데이터 삭제 (주의!)**
```typescript
import { deleteCorruptedSchedules } from './utils/dataCleanup';

// ⚠️ 영구 삭제됨 - 신중하게 사용
const result = await deleteCorruptedSchedules(corruptedIds);
console.log(`${result.deleted}개 문서가 삭제되었습니다.`);
```

## 🔍 문제 진단 방법

### 1. **브라우저 개발자 도구 확인**
- F12 → Console 탭에서 오류 메시지 확인
- Network 탭에서 실패한 요청 확인

### 2. **Firebase Console 확인**
- [Firebase Console](https://console.firebase.google.com/)에서 Firestore 데이터 확인
- Storage에서 파일 업로드 상태 확인

### 3. **일반적인 해결 방법**
1. 브라우저 캐시 삭제
2. 개발 서버 재시작: `npm start`
3. 데이터 정리 유틸리티 실행
4. Firebase 규칙 확인

## 🚀 성능 최적화 팁

### 1. **파일 크기 제한**
- 이미지: 5MB 이하 권장
- 문서: 10MB 이하 권장
- 총 첨부 파일: 50MB 이하 권장

### 2. **데이터 구조 최적화**
- 불필요한 필드 제거
- 중복 데이터 최소화
- 인덱스가 필요한 필드만 쿼리에 사용

### 3. **실시간 리스너 최적화**
- 필요한 데이터만 쿼리
- 컴포넌트 언마운트 시 리스너 정리
- 페이지네이션 적용 고려

## 📞 추가 지원

문제가 지속되거나 추가 도움이 필요한 경우:

1. **오류 로그 수집**: 브라우저 콘솔의 전체 오류 메시지
2. **재현 단계**: 오류가 발생하는 정확한 단계
3. **환경 정보**: 브라우저, OS, 네트워크 상태

이 정보와 함께 문의하시면 더 정확한 지원을 받을 수 있습니다. 