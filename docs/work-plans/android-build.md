# 꿈신문사 Android 빌드 가이드

> 작성 기준: 2026-05-27  
> 앱 ID: `com.dreamnewspaper.app`  
> 프레임워크: Next.js 15 + Capacitor 7  

---

## 전제 조건 (빌드 머신 필수 설치)

| 도구 | 버전 | 설치 |
|------|------|------|
| Node.js | 20+ | https://nodejs.org |
| Java JDK | 17 또는 21 | `brew install openjdk@21` (Mac) / Adoptium |
| Android Studio | Ladybug 이상 | https://developer.android.com/studio |
| Android SDK | API 35 (compileSdk) | Android Studio → SDK Manager |
| Gradle | 8.x (자동) | Android Studio 번들 사용 |

> **Windows 주의**: `JAVA_HOME` 환경변수 설정 필수  
> `setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-21"` (PowerShell 관리자)

---

## 1단계: 소스 준비

```bash
# 프로젝트 클론 (또는 기존 폴더 사용)
cd dream-newspaper/frontend

# 의존성 설치
npm install
```

---

## 2단계: 프로덕션 배포 URL 확인

`frontend/capacitor.config.ts` 파일에서 `PRODUCTION_URL` 확인:

```typescript
const PRODUCTION_URL = "https://app.dreamnewspaper.com";
```

> Railway + Vercel 배포 완료 후 실제 URL로 업데이트할 것  
> 현재 이 URL이 WebView에서 로드하는 주소임

---

## 3단계: Next.js 정적 빌드

```bash
# 앱 빌드 (프로덕션 URL은 이미 capacitor.config.ts에서 server.url로 설정됨)
npm run build

# 또는 정적 export가 필요한 경우:
npm run build:app
```

> **중요**: Capacitor의 `server.url`이 설정되어 있으면 `webDir`(out/) 대신  
> 지정된 URL을 WebView에서 로드함. 현재 프로덕션 설정은 `https://app.dreamnewspaper.com` 사용.

---

## 4단계: Capacitor Android 동기화

```bash
# Capacitor와 Android 프로젝트 동기화
npx cap sync android
```

이 명령이 하는 일:
- `out/` → `android/app/src/main/assets/public/` 복사
- `capacitor.config.json` 업데이트
- 플러그인 설치 반영

---

## 5단계: Keystore 생성 (최초 1회만)

```bash
# android/app/ 폴더에서 실행
cd android/app

keytool -genkey -v \
  -keystore keystore.jks \
  -alias dreamnewspaper \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

입력 값:
- **Store password**: 안전한 비밀번호 (저장 필수)
- **Key alias**: `dreamnewspaper`
- **Key password**: 안전한 비밀번호 (저장 필수)
- **이름/조직**: 자유 입력
- **국가 코드**: KR

> ⚠️ **keystore.jks는 절대 Git에 커밋하지 말 것** (`.gitignore`에 이미 등록됨)  
> ⚠️ **비밀번호를 잃어버리면 앱 업데이트 불가** — 반드시 안전하게 백업

---

## 6단계: 서명 환경변수 설정

빌드 전 터미널에서 설정:

**Mac/Linux:**
```bash
export KEYSTORE_PASSWORD="여기에_store_password"
export KEY_ALIAS="dreamnewspaper"
export KEY_PASSWORD="여기에_key_password"
```

**Windows (PowerShell):**
```powershell
$env:KEYSTORE_PASSWORD = "여기에_store_password"
$env:KEY_ALIAS = "dreamnewspaper"
$env:KEY_PASSWORD = "여기에_key_password"
```

> `android/app/build.gradle`에서 환경변수를 자동으로 읽어 서명에 사용함

---

## 7단계: Release AAB 빌드

```bash
# android/ 폴더에서 실행
cd android

# AAB(App Bundle) 빌드 — Google Play 업로드용
./gradlew bundleRelease

# APK 빌드 — 직접 설치 테스트용
./gradlew assembleRelease
```

**빌드 결과물 위치:**
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## 8단계: Google Play Console 업로드

### 8-1. 앱 등록 (최초 1회)
1. https://play.google.com/console 접속
2. "앱 만들기" 클릭
3. 앱 세부정보:
   - 앱 이름: `꿈신문사`
   - 기본 언어: 한국어(ko-KR)
   - 앱 유형: 앱
   - 유료/무료: 무료
4. $25 개발자 등록비 결제 (1회)

### 8-2. 내부 테스트 트랙으로 첫 업로드
1. 출시 > 내부 테스트 > 새 버전 만들기
2. AAB 파일 업로드: `app-release.aab`
3. 출시 노트 작성
4. 검토 후 저장

### 8-3. 프로덕션 출시 전 필수 작업
- [ ] 개인정보처리방침 URL 등록
- [ ] 스토어 목록 작성 (스크린샷 최소 2장)
- [ ] 콘텐츠 등급 설문 완료
- [ ] 앱 액세스 권한 설명

---

## 앱 버전 관리

버전 업데이트 시 `android/app/build.gradle` 수정:

```gradle
versionCode 1        # 정수, 업로드마다 +1 증가 필수
versionName "1.0.0"  # 사용자에게 보이는 버전
```

---

## 빌드 설정 요약

| 항목 | 값 |
|------|-----|
| Application ID | `com.dreamnewspaper.app` |
| Min SDK | 23 (Android 6.0 Marshmallow) |
| Compile/Target SDK | 35 (Android 15) |
| Key Alias | `dreamnewspaper` |
| Keystore 파일 위치 | `android/app/keystore.jks` |
| WebView URL | `https://app.dreamnewspaper.com` |
| 허용 도메인 | `*.dreamnewspaper.com`, `*.supabase.co`, `*.kakao.com`, `*.googleapis.com` |

---

## 자주 발생하는 오류

### `keystore.jks not found`
```
keystore.jks 파일이 android/app/ 안에 있는지 확인
```

### `SDK location not found`
```
Android Studio → SDK Manager에서 SDK 위치 확인 후
android/local.properties 파일에:
sdk.dir=/Users/YourName/Library/Android/sdk  (Mac)
sdk.dir=C\:\\Users\\YourName\\AppData\\Local\\Android\\Sdk  (Windows)
```

### `Gradle: minSdkVersion X < X`
```
variables.gradle의 minSdkVersion이 23으로 설정됨
충돌 플러그인 있으면 해당 플러그인 버전 올릴 것
```

### `BUILD FAILED: unsupported class file major version`
```
Java 버전 불일치. JDK 17 또는 21 사용 확인
java -version 으로 현재 버전 확인
```

### `Manifest merger failed`
```
npx cap sync 다시 실행 후 재빌드
```

---

## GitHub Actions CI 자동 빌드 (선택)

아래 Secrets를 GitHub 저장소에 등록하면 push 시 자동 빌드:

| Secret 이름 | 내용 |
|------------|------|
| `KEYSTORE_BASE64` | `base64 -i keystore.jks` 결과값 |
| `KEYSTORE_PASSWORD` | Keystore 비밀번호 |
| `KEY_ALIAS` | `dreamnewspaper` |
| `KEY_PASSWORD` | Key 비밀번호 |

`.github/workflows/android-release.yml` 트리거: `v*` 태그 push

---

## 전체 빌드 순서 요약

```bash
# 1. 프론트엔드 의존성
cd dream-newspaper/frontend && npm install

# 2. Capacitor 동기화
npx cap sync android

# 3. 서명 환경변수 설정 (위 6단계 참조)

# 4. AAB 빌드
cd android && ./gradlew bundleRelease

# 5. 결과물 확인
ls app/build/outputs/bundle/release/
# → app-release.aab
```

---

## 참고

- Capacitor 7 공식 문서: https://capacitorjs.com/docs/android
- Google Play Console: https://play.google.com/console
- Android Studio 다운로드: https://developer.android.com/studio
