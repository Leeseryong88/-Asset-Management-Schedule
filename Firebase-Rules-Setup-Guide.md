# Firebase 보안 규칙 설정 가이드

Firebase Console에서 보안 규칙을 설정하는 방법입니다.

## 1. Firestore Database 보안 규칙 설정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택: **asset-management-schedule**
3. 왼쪽 메뉴에서 **Firestore Database** 클릭
4. 상단 탭에서 **규칙(Rules)** 클릭
5. `firestore-rules.txt` 파일의 내용을 복사하여 붙여넣기
6. **게시** 버튼 클릭

## 2. Firebase Storage 보안 규칙 설정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 선택: **asset-management-schedule**
3. 왼쪽 메뉴에서 **Storage** 클릭
4. 상단 탭에서 **규칙(Rules)** 클릭
5. `firebase-storage-rules.txt` 파일의 내용을 복사하여 붙여넣기
6. **게시** 버튼 클릭

## 3. 보안 규칙 상세 설명

### Firestore 규칙:
- ✅ 인증된 사용자만 데이터 접근 가능
- ✅ 사용자는 자신의 프로필만 수정 가능
- ✅ 스케줄은 협업을 위해 모든 인증된 사용자가 접근 가능
- ✅ 생성/수정 추적을 위한 메타데이터 필수
- ❌ 기타 모든 컬렉션 접근 차단

### Storage 규칙:
- ✅ 인증된 사용자만 파일 업로드/다운로드 가능
- ✅ 파일 크기 50MB 제한
- ✅ 안전한 파일 타입만 허용
- ✅ 구조화된 경로에만 저장 (`schedules/{scheduleId}/{fileName}`)
- ❌ 기타 모든 경로 접근 차단

## 4. 허용되는 파일 타입

- 📷 **이미지**: JPG, PNG, GIF, WEBP 등
- 📄 **문서**: PDF, DOC, DOCX, TXT
- 📊 **스프레드시트**: XLS, XLSX
- 📈 **프레젠테이션**: PPT, PPTX
- 📦 **압축 파일**: ZIP

## 5. 주의사항

⚠️ **규칙 적용 후 반드시 테스트하세요!**

- 파일 업로드 테스트
- 파일 다운로드 테스트
- 파일 삭제 테스트
- 비인증 사용자 접근 차단 확인

규칙이 올바르게 적용되지 않으면 파일 업로드/다운로드가 실패할 수 있습니다. 