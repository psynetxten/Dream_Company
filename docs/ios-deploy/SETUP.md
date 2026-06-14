# 꿈신문사 iOS App Store 배포 가이드

> **목표**: GitHub Actions (macOS 러너) → TestFlight → App Store 자동 배포
> **Mac 불필요** — Windows에서 모든 설정 가능 (빌드는 GitHub 서버에서)

---

## 📋 전체 순서

```
[1] Apple Developer 계정 가입  →
[2] App Store Connect 앱 생성  →
[3] 배포 인증서 & 프로파일 생성  →
[4] GitHub Secrets 등록  →
[5] main 브랜치 push → 자동 빌드 & TestFlight 배포  →
[6] TestFlight 테스트  →
[7] App Store 심사 제출
```

---

## STEP 1: Apple Developer Program 등록

1. https://developer.apple.com/programs/ 접속
2. **Enroll** 클릭 → Apple ID로 로그인
3. 개인 (Individual) 선택 → 정보 입력
4. **$99 (USD)/년** 결제 (신용카드)
5. 승인 이메일 수신까지 24~48시간 소요

> ⚠️ 등록 완료 후 **Team ID** 확인:
> developer.apple.com/account → Membership → **Team ID** (10자리 영문+숫자)
> 예: `ABCD1234EF`

---

## STEP 2: App Store Connect 앱 생성

1. https://appstoreconnect.apple.com 접속
2. **나의 앱** → **+** → 새 앱
3. 정보 입력:

| 항목 | 값 |
|------|-----|
| 플랫폼 | iOS |
| 이름 | 꿈신문사 |
| 기본 언어 | 한국어 |
| 번들 ID | `com.dreamnewspaper.app` |
| SKU | `dreamnewspaper-ios-001` |

4. **앱 생성** 클릭 → 앱 ID 확인 (나중에 필요)

---

## STEP 3: 배포 인증서 생성 (Distribution Certificate)

> 인증서는 Mac이 없어도 **Windows에서 OpenSSL로 생성 가능**

### 3-1. CSR 파일 생성 (Windows PowerShell)

```powershell
# OpenSSL 설치 (없을 경우)
winget install ShiningLight.OpenSSL

# CSR 생성
cd Desktop
openssl req -nodes -newkey rsa:2048 `
  -keyout dreamnewspaper-private.key `
  -out dreamnewspaper.csr `
  -subj "/emailAddress=junholee940930@gmail.com/CN=Dream Newspaper/C=KR"
```

### 3-2. Apple Developer Portal에서 인증서 발급

1. https://developer.apple.com/account/resources/certificates/list
2. **+** → **Apple Distribution** 선택
3. CSR 파일 업로드 (`dreamnewspaper.csr`)
4. 인증서 다운로드 (`distribution.cer`)

### 3-3. .cer → .p12 변환 (Windows PowerShell)

```powershell
# .cer → .pem 변환
openssl x509 -in distribution.cer -inform DER -out distribution.pem -outform PEM

# .pem + private key → .p12 (비밀번호 설정)
openssl pkcs12 -export `
  -out dreamnewspaper-distribution.p12 `
  -inkey dreamnewspaper-private.key `
  -in distribution.pem `
  -passout pass:YOUR_P12_PASSWORD
```

> `YOUR_P12_PASSWORD` 는 기억할 수 있는 비밀번호로 변경 (이후 GitHub Secret에 등록)

### 3-4. .p12 → base64 인코딩

```powershell
$bytes = [System.IO.File]::ReadAllBytes("$PWD\dreamnewspaper-distribution.p12")
$base64 = [System.Convert]::ToBase64String($bytes)
$base64 | Out-File -FilePath "certificate_base64.txt" -Encoding ASCII -NoNewline
```

`certificate_base64.txt` 내용 = **`BUILD_CERTIFICATE_BASE64`** GitHub Secret 값

---

## STEP 4: App Store Provisioning Profile 생성

1. https://developer.apple.com/account/resources/profiles/list
2. **+** → **App Store** 선택
3. App ID: `com.dreamnewspaper.app` 선택
4. Distribution Certificate: 방금 만든 인증서 선택
5. 프로파일 이름: `꿈신문사 App Store`
6. **Generate** → 다운로드 (`꿈신문사_App_Store.mobileprovision`)

### .mobileprovision → base64

```powershell
$bytes = [System.IO.File]::ReadAllBytes("$PWD\꿈신문사_App_Store.mobileprovision")
$base64 = [System.Convert]::ToBase64String($bytes)
$base64 | Out-File -FilePath "profile_base64.txt" -Encoding ASCII -NoNewline
```

`profile_base64.txt` 내용 = **`BUILD_PROVISION_PROFILE_BASE64`** GitHub Secret 값

---

## STEP 5: App Store Connect API 키 생성 (2FA 우회용)

1. https://appstoreconnect.apple.com/access/api
2. **팀 키** 탭 → **+** 클릭
3. 이름: `GitHub Actions`, 접근: **앱 관리자**
4. **생성** → 키 다운로드 (`AuthKey_XXXXXXXXXX.p8`)
5. 화면에서 **Issuer ID** 와 **Key ID** 메모

> ⚠️ `.p8` 파일은 **딱 한 번만** 다운로드 가능 — 바로 저장!

### .p8 파일 내용 읽기

```powershell
Get-Content "AuthKey_XXXXXXXXXX.p8" -Raw
```

내용 전체 = **`APP_STORE_CONNECT_API_KEY_CONTENT`** GitHub Secret 값

---

## STEP 6: GitHub Secrets 등록

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret 이름 | 값 | 출처 |
|-------------|-----|------|
| `BUILD_CERTIFICATE_BASE64` | certificate_base64.txt 내용 | STEP 3-4 |
| `P12_PASSWORD` | .p12 만들 때 설정한 비밀번호 | STEP 3-3 |
| `KEYCHAIN_PASSWORD` | 아무 랜덤 문자열 (예: `MyKeychain123!`) | 직접 설정 |
| `BUILD_PROVISION_PROFILE_BASE64` | profile_base64.txt 내용 | STEP 4 |
| `APPLE_TEAM_ID` | Apple Team ID (10자리) | STEP 1 |
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID (10자리) | STEP 5 |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID (UUID) | STEP 5 |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | .p8 파일 전체 내용 | STEP 5 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | .env 파일 참고 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | .env 파일 참고 |
| `NEXT_PUBLIC_KAKAO_APP_KEY` | 카카오 앱 키 | .env 파일 참고 |

---

## STEP 7: 빌드 트리거 & 모니터링

### 자동 빌드 (main 브랜치 push 시)
```bash
git push origin main
```
→ GitHub Actions 탭에서 **🍎 iOS Build & Deploy to TestFlight** 워크플로우 확인

### 수동 빌드
1. GitHub → Actions → **🍎 iOS Build & Deploy to TestFlight**
2. **Run workflow** → `testflight` 선택 → **Run**
3. 빌드 완료까지 약 **25~40분** 소요

### 빌드 성공 확인
- GitHub Actions에서 모든 단계 ✅ 확인
- TestFlight 앱 (iPhone)에서 새 빌드 수신 확인

---

## STEP 8: TestFlight 테스터 초대

1. https://appstoreconnect.apple.com → 내 앱 → TestFlight
2. **내부 테스터** → + → 이메일로 초대
3. 테스터가 TestFlight 앱 설치 → 앱 설치

---

## STEP 9: App Store 심사 제출

1. App Store Connect → 내 앱 → **+ 버전 또는 플랫폼**
2. **iOS 1.0** 생성
3. 필수 항목 입력:
   - 스크린샷 (iPhone 6.5인치, 5.5인치 / iPad 12.9인치)
   - 앱 설명 (`docs/store-listings/app-store.md` 참고)
   - 키워드 (최대 100자)
   - 개인정보처리방침 URL: `https://app.dreamnewspaper.com/privacy`
4. **빌드** 섹션 → TestFlight에서 빌드 선택
5. **심사를 위해 제출**
6. 심사 소요: 보통 24~48시간

---

## 📱 스크린샷 촬영 방법

Mac이 없어도 **시뮬레이터 없이** 실제 iPhone으로 촬영 가능:

1. iPhone에서 TestFlight 빌드 설치
2. 각 주요 화면 스크린샷 촬영 (최소 5장)
3. **필수 화면**: 온보딩, 홈 피드, 신문 뷰어, 의뢰 폼, 프로필
4. PC로 전송 → App Store Connect 업로드

---

## 🚨 자주 발생하는 오류

### "No accounts with iTunes Store access" 오류
→ App Store Connect API 키 권한이 "앱 관리자" 이상인지 확인

### "Provisioning profile doesn't include the entitlement" 오류
→ 프로파일을 새로 생성 후 GitHub Secret 재등록

### "No signing certificate found" 오류
→ `BUILD_CERTIFICATE_BASE64` 값이 올바른지 확인 (개행 없이 한 줄로)

### CocoaPods 설치 실패
→ `frontend/ios/App/Podfile.lock`을 삭제하고 재실행

### xcpretty not found
→ GitHub Actions 워크플로우에서 자동 설치됨 — 로컬은 `gem install xcpretty`

---

## 📊 빌드 비용 (GitHub Actions)

| 구분 | 시간 | 월 무료 한도 |
|------|------|-------------|
| macOS 러너 | ~30분/빌드 | 2,000분 (공개 저장소: 무료) |
| 예상 빌드 횟수 | ~5회/월 | 150분 사용 |
| 초과 시 비용 | $0.08/분 | — |

> 저장소를 **Public**으로 설정하면 GitHub Actions 완전 무료
