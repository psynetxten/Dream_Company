# 꿈신문사 앱스토어 출시 가이드

## 현재 완료된 것

- [x] Android 네이티브 프로젝트 (`frontend/android/`)
- [x] iOS 네이티브 프로젝트 (`frontend/ios/`)
- [x] 앱 아이콘 전 사이즈 (`frontend/android-assets/`, `frontend/ios-assets/`)
- [x] 스플래시 스크린 이미지
- [x] AndroidManifest.xml (권한, 딥링크)
- [x] Info.plist (iOS 권한, ATS, 카카오 딥링크)
- [x] 개인정보처리방침 페이지 (`/privacy`)
- [x] 이용약관 페이지 (`/terms`)
- [x] Play Store 리스팅 텍스트 (`docs/store-listings/play-store.md`)
- [x] App Store 리스팅 텍스트 (`docs/store-listings/app-store.md`)

---

## STEP 1: 백엔드 + 프론트엔드 프로덕션 배포

### 1-1. Railway로 백엔드 배포

1. railway.app 가입 (GitHub 계정)
2. New Project → Deploy from GitHub repo 선택
3. `dream-newspaper` 저장소 → `backend` 폴더 선택
4. 환경변수 설정 (Settings → Variables):
   ```
   DATABASE_URL=postgresql+asyncpg://...  (Railway Postgres 자동 제공)
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJ...
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_API_KEY=AIza...
   SECRET_KEY=<랜덤 64자>
   ENVIRONMENT=production
   FRONTEND_URL=https://app.dreamnewspaper.com
   ```
5. Custom Domain: `api.dreamnewspaper.com` 설정

### 1-2. Vercel로 프론트엔드 배포

1. vercel.com 가입 (GitHub 계정)
2. New Project → `dream-newspaper` 저장소 → `frontend` 폴더
3. Framework: Next.js
4. 환경변수:
   ```
   NEXT_PUBLIC_API_URL=https://api.dreamnewspaper.com
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
5. Custom Domain: `app.dreamnewspaper.com` 설정

### 1-3. capacitor.config.ts 확인

배포 후 `PRODUCTION_URL`이 실제 도메인인지 확인:
```typescript
const PRODUCTION_URL = "https://app.dreamnewspaper.com"; // ← 실제 배포 URL
```

---

## STEP 2: Android APK/AAB 빌드

### 2-1. 사전 준비

- [Android Studio 설치](https://developer.android.com/studio) (JDK 포함)
- 설치 후 Android SDK 설정

### 2-2. Keystore 생성

`frontend/android/CREATE_KEYSTORE.md` 참고

```bash
# Android Studio JDK 경로로 실행
"C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" \
  -genkeypair -v \
  -keystore frontend/android/app/keystore.jks \
  -alias dreamnewspaper \
  -keyalg RSA -keysize 2048 -validity 9125 \
  -dname "CN=Dream Newspaper, O=Dream Newspaper, C=KR" \
  -storepass "비밀번호" -keypass "비밀번호"
```

### 2-3. Capacitor Sync

```bash
cd frontend
npx cap sync android
```

### 2-4. Release AAB 빌드 (Play Store 권장)

```bash
cd frontend/android

# 환경변수 설정
set KEYSTORE_PASSWORD=비밀번호
set KEY_ALIAS=dreamnewspaper
set KEY_PASSWORD=비밀번호

# AAB 빌드
./gradlew bundleRelease
```

결과물: `android/app/build/outputs/bundle/release/app-release.aab`

### 2-5. APK 빌드 (직접 설치용)

```bash
./gradlew assembleRelease
```

결과물: `android/app/build/outputs/apk/release/app-release.apk`

---

## STEP 3: Google Play Console 제출

1. **play.google.com/console** 접속
2. Google 계정 + $25 등록비 결제
3. "앱 만들기" 클릭
4. 앱 정보 입력 (`docs/store-listings/play-store.md` 참고)
5. **프로덕션 → 릴리스 만들기 → AAB 파일 업로드**
6. 스크린샷 업로드 (5장 이상, 1080×1920px)
7. 개인정보처리방침 URL: `https://app.dreamnewspaper.com/privacy`
8. 심사 제출 → 보통 1~3일 소요

---

## STEP 4: iOS App Store 제출 (Mac 필요)

1. **developer.apple.com** 가입 ($99/년)
2. Mac에서 Xcode 설치
3. 저장소를 Mac으로 복사
4. `npx cap sync ios` 실행
5. Xcode에서 `ios/App/App.xcworkspace` 열기
6. iOS 아이콘을 `AppIcon.appiconset`에 복사 (`frontend/ios-assets/` 참고)
7. Signing & Capabilities → Team 설정
8. **Product → Archive** 로 빌드
9. **Distribute App → App Store Connect** 로 업로드
10. App Store Connect에서 리스팅 작성 (`docs/store-listings/app-store.md` 참고)
11. 심사 제출 → 보통 1~2일 소요

---

## 필요한 계정 요약

| 항목 | 필요 | 비용 | 링크 |
|------|------|------|------|
| Google Play Console | Google 계정 | $25 (1회) | play.google.com/console |
| Apple Developer | Apple ID | $99/년 | developer.apple.com |
| Railway (백엔드) | GitHub 계정 | 무료 시작 | railway.app |
| Vercel (프론트) | GitHub 계정 | 무료 시작 | vercel.com |
| 도메인 (선택) | - | ~₩15,000/년 | 가비아, 후이즈 등 |

---

## 빠른 시작 순서

1. **지금 바로**: Railway + Vercel 배포 → URL 확정
2. **URL 확정 후**: `capacitor.config.ts` PRODUCTION_URL 업데이트 → `npx cap sync`
3. **Android Studio 설치** → Keystore 생성 → AAB 빌드
4. **Google Play Console 등록** → AAB 업로드 → 제출
5. **Mac이 있으면**: iOS App Store도 동시 진행
