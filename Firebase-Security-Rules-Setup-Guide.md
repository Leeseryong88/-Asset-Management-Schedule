# Firebase 보안 규칙 설정 가이드

이 가이드는 신사옥 관리 애플리케이션의 Firebase 보안 규칙을 설정하는 방법을 설명합니다.

## 📋 보안 규칙 개요

### 🎯 목표
- **일정 조회**: 모든 인증된 사용자가 가능
- **일정 수정/삭제**: 생성자와 관리자(`admin@gentlemonster.com`)만 가능
- **사용자 관리**: 자신의 정보만 수정 가능, 관리자는 모든 사용자 관리 가능
- **파일 업로드**: 50MB 제한, 인증된 사용자만 가능

## 🔧 Firestore 보안 규칙 설정

### 1. Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **Firestore Database** 클릭
4. **규칙** 탭 클릭

### 2. 규칙 적용
`firestore-security-rules.txt` 파일의 내용을 복사하여 Firebase Console의 규칙 편집기에 붙여넣기

### 3. 규칙 게시
- **게시** 버튼 클릭하여 규칙 적용

## 📁 Firebase Storage 보안 규칙 설정

### 1. Storage 규칙 설정
1. Firebase Console에서 **Storage** 클릭
2. **규칙** 탭 클릭
3. `firebase-storage-security-rules.txt` 파일의 내용을 복사하여 붙여넣기
4. **게시** 버튼 클릭

## 📝 주요 규칙 설명

### Firestore 규칙

#### 스케줄 컬렉션 (`/schedules/{scheduleId}`)
- **읽기**: 모든 인증된 사용자 ✅
- **생성**: 모든 인증된 사용자 ✅ (앱에서 `createdBy` 필드 자동 설정)
- **수정**: 생성자 또는 관리자만 ⚠️
- **삭제**: 생성자 또는 관리자만 ⚠️

#### 사용자 컬렉션 (`/users/{userId}`)
- **읽기**: 자신의 정보 또는 관리자만
- **생성**: 자신의 정보만, 이메일 일치 확인
- **수정**: 자신의 정보 또는 관리자만
- **삭제**: 관리자만

### Storage 규칙

#### 스케줄 첨부파일 (`/schedules/{scheduleId}/{fileName}`)
- **읽기**: 모든 인증된 사용자
- **업로드**: 모든 인증된 사용자, 50MB 제한
- **삭제**: 모든 인증된 사용자

#### 임시 파일 (`/temp/{userId}/{fileName}`)
- **읽기/쓰기**: 자신의 파일만, 50MB 제한
- **삭제**: 자신의 파일만

## ⚠️ 주의사항

### 1. 관리자 이메일
- 관리자 이메일: `admin@gentlemonster.com`
- 하드코딩되어 있으므로 변경 시 규칙도 함께 수정 필요

### 2. 데이터 무결성
- 스케줄 생성 시 `createdBy` 필드 앱에서 자동 설정
- 스케줄 수정 시 `updatedBy` 필드 앱에서 자동 업데이트
- 사용자는 자신이 생성한 스케줄만 수정/삭제 가능

### 3. 파일 크기 제한
- 최대 50MB까지 업로드 가능
- 용량 초과 시 업로드 거부

## 🧪 규칙 테스트

### 시뮬레이터 사용
1. Firebase Console에서 **규칙** 탭의 **시뮬레이터** 클릭
2. 다양한 시나리오로 규칙 테스트:
   - 일반 사용자의 다른 사용자 스케줄 수정 시도
   - 관리자의 모든 데이터 접근
   - 인증되지 않은 사용자의 접근 시도

### 테스트 시나리오
```javascript
// 예시: 일반 사용자가 다른 사용자의 스케줄 수정 시도
// 위치: /schedules/schedule123
// 인증: user@example.com
// 요청: update
// 데이터: { title: "Modified", updatedBy: "user@example.com" }
// 기존 데이터: { createdBy: "other@example.com" }
// 예상 결과: 거부 (Permission denied)
```

## 🚀 배포 후 확인사항

1. **일정 조회**: 모든 사용자가 일정을 볼 수 있는지 확인
2. **일정 수정**: 본인이 만든 일정만 수정 가능한지 확인
3. **관리자 권한**: admin@gentlemonster.com 계정으로 모든 기능 테스트
4. **파일 업로드**: 50MB 이하 파일 업로드 및 다운로드 테스트
5. **오류 처리**: 권한 없는 작업 시 적절한 오류 메시지 표시

## 📞 문제 해결

### 권한 오류가 발생하는 경우
1. 브라우저 개발자 도구에서 콘솔 오류 확인
2. Firebase Console에서 규칙이 올바르게 적용되었는지 확인
3. 사용자 인증 상태 및 이메일 주소 확인
4. 데이터 구조가 규칙과 일치하는지 확인

규칙이 올바르게 설정되면 앱의 보안이 크게 향상되고, 데이터 무결성이 보장됩니다. 