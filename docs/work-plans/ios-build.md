# 꿈신문사 iOS 빌드 가이드

> 작성 기준: 2026-05-27  
> 번들 ID: `com.dreamnewspaper.app`  
> 프레임워크: Next.js 15 + Capacitor 7 + CocoaPods  
> 최소 iOS: 14.0  

---

## ⚠️ 핵심 전제: iOS 빌드는 반드시 Mac에서만 가능

Xcode는 macOS 전용. Windows/Linux에서는 빌드 불가.  
Mac이 없다면 → [Codemagic](https://codemagic.io) (클라우드 Mac, 무료 500분/월) 사용 가능.

---

## 전제 조건

| 도구 | 버전 | 설치 방법 |
|------|------|----------|
| macOS | Ventura 이상 | - |
| Xcode | 16 이상 | App Store |
| Xcode Command Line Tools | 자동 포함 | `xcode-select --install` |
| CocoaPods | 1.15+ | `sudo gem install cocoapods` |
| Node.js | 20+ | https://nodejs.org |
| Apple Developer 계정 | 개인/팀 | https://developer.apple.com ($99/년) |

---

## 1단계: 소스 준비

```bash
cd dream-newspaper/frontend
npm install
```

---

## 2단계: Capacitor 동기화

```bash
# Next.js 빌드 후 Capacitor 동기화
npm run build
npx cap sync ios
```

이 명령이 하는 일:
- `out/` → `ios/App/App/public/` 복사
- `capacitor.config.json` 업데이트
- 플러그인 설치 정보 반영

---

## 3단계: CocoaPods 설치

```bash
cd ios/App
pod install
```

> 처음 실행 시 수분 소요.  
> `pod install` 실패 시: `pod repo update` 후 재시도.

---

## 4단계: Xcode로 프로젝트 열기

```bash
# 반드시 .xcworkspace 파일로 열어야 함 (.xcodeproj 아님)
npx cap open ios
# 또는
open ios/App/App.xcworkspace
```

---

## 5단계: Apple Developer 계정 연결

1. Xcode 메뉴 → **Xcode > Settings > Accounts**
2. `+` 클릭 → Apple ID 로그인
3. 팀 선택 확인

---

## 6단계: 서명(Signing) 설정

Xcode에서 `App` 타겟 선택 → **Signing & Capabilities** 탭:

| 항목 | 값 |
|------|-----|
| Automatically manage signing | ✅ 체크 |
| Team | 본인 Apple 개발자 팀 선택 |
| Bundle Identifier | `com.dreamnewspaper.app` |

> 자동 서명 설정 시 Xcode가 개발/배포 인증서와 Provisioning Profile을 자동 생성함.  
> 처음 빌드 시 "Register Device" 팝업 → 허용.

---

## 7단계: 기능(Capabilities) 추가

`App` 타겟 → **Signing & Capabilities** → `+ Capability`:

- [x] **Push Notifications** — 신문 발행 알림
- [x] **Background Modes** → Remote notifications 체크
  - (Info.plist에 이미 `UIBackgroundModes: [remote-notification, fetch]` 설정됨)

---

## 8단계: APNs 키 설정 (푸시 알림)

### 8-1. APNs 키 생성 (Apple Developer Portal)
1. https://developer.apple.com → Certificates, IDs & Profiles
2. Keys → `+` 클릭
3. Key 이름: `DreamNewspaper APNs Key`
4. **Apple Push Notifications service (APNs)** 체크
5. 다운로드 → `.p8` 파일 저장 (1회만 다운로드 가능)

### 8-2. Key 정보 기록
| 항목 | 위치 |
|------|------|
| Key ID (10자리) | 다운로드 화면 또는 Keys 목록 |
| Team ID | 우상단 계정 정보 |
| .p8 파일 | 안전한 곳에 보관 |

> 이 정보는 백엔드에서 푸시 알림 발송 시 필요.

---

## 9단계: 앱 아이콘 / 스플래시 확인

`ios/App/App/Assets.xcassets/` 에:
- `AppIcon.appiconset/` — 앱 아이콘 (1024×1024 포함)
- `Splash.imageset/` — 스플래시 이미지

아이콘 업데이트 필요 시:
```bash
# frontend/ 에서 (generate-icons.mjs 스크립트 사용)
npm run icons
npx cap sync ios
```

---

## 10단계: 디바이스/시뮬레이터 테스트

```bash
# 시뮬레이터 실행 (Xcode에서)
# 상단 Device 선택 → iPhone 16 Pro → ▶ Run (⌘R)
```

또는 실제 기기 연결:
1. iPhone을 Mac에 USB 연결
2. 기기에서 "이 컴퓨터를 신뢰하겠습니까?" → 신뢰
3. Xcode 상단 Device 목록에서 기기 선택 → ▶ Run

---

## 11단계: Archive (배포용 빌드)

1. Xcode 상단 Device → **Any iOS Device (arm64)** 선택
2. 메뉴: **Product → Archive** (⌘ + Shift + B 아님, 메뉴에서 직접)
3. 빌드 완료 시 **Organizer** 창 자동 열림

> Archive는 실제 기기 타겟에서만 가능. 시뮬레이터 선택 시 Archive 메뉴 비활성화됨.

---

## 12단계: TestFlight 업로드

Organizer에서:
1. 방금 만든 Archive 선택
2. **Distribute App** 클릭
3. **App Store Connect** 선택 → Next
4. **Upload** 선택 → Next
5. 옵션 기본값 유지 → Next
6. 인증서 자동 선택 → Next
7. **Upload** 클릭

업로드 완료 후 App Store Connect에서 처리까지 약 5~15분 소요.

---

## 13단계: App Store Connect 설정

### 앱 등록 (최초 1회)
1. https://appstoreconnect.apple.com
2. 나의 앱 → `+` 클릭 → 새 앱
3. 플랫폼: iOS
4. 이름: `꿈신문사`
5. 기본 언어: 한국어
6. 번들 ID: `com.dreamnewspaper.app` (드롭다운에서 선택)
7. SKU: `dreamnewspaper-ios-v1` (임의 고유값)

### TestFlight 내부 테스터
1. TestFlight → 빌드 선택
2. 내부 테스터 그룹 추가 → 이메일로 초대

### 앱 심사 제출 전 필수 항목
- [ ] 앱 설명 (한국어/영어)
- [ ] 스크린샷 (iPhone 6.7인치, 6.5인치 최소 1장씩)
- [ ] 개인정보처리방침 URL
- [ ] 앱 카테고리: 라이프스타일 또는 뉴스
- [ ] 연령 등급 설문 완료
- [ ] 가격: 무료

---

## 버전 관리

Xcode → App 타겟 → **General** 탭:

| 항목 | 값 |
|------|-----|
| Version (Marketing Version) | `1.0.0` |
| Build (Current Project Version) | `1` (업로드마다 +1 필수) |

또는 `ios/App/App.xcodeproj/project.pbxproj` 파일에서 직접 수정.

---

## 빌드 설정 요약

| 항목 | 값 |
|------|-----|
| Bundle ID | `com.dreamnewspaper.app` |
| 앱 이름 | 꿈신문사 |
| 최소 iOS | 14.0 |
| 세로 방향 전용 | ✅ (iPhone) |
| Deep Link Scheme | `dreamnewspaper://` |
| 카카오 로그인 스키마 | `kakaokompassauth`, `kakaolink` |
| 암호화 | 없음 (ITSAppUsesNonExemptEncryption = false) |
| ATS | HTTPS 전용, `*.dreamnewspaper.com` 허용 |
| WebView URL | `https://app.dreamnewspaper.com` |
| 허용 도메인 | `*.dreamnewspaper.com`, `*.supabase.co`, `*.kakao.com`, `*.googleapis.com` |
| 권한 | 카메라, 사진 라이브러리, 푸시 알림 |

---

## 자주 발생하는 오류

### `No profiles for 'com.dreamnewspaper.app' were found`
```
Xcode → Signing & Capabilities → Automatically manage signing 체크
Team 선택 확인
```

### `CocoaPods could not find compatible versions`
```bash
cd ios/App
pod deintegrate
pod install
```

### `Multiple commands produce ... capacitor.config.json`
```bash
npx cap sync ios
# Product → Clean Build Folder (⌘⇧K) 후 재빌드
```

### `Signing requires a development team`
```
Apple 개발자 계정 등록 필요 ($99/년)
또는 무료 계정으로 7일 임시 서명 가능 (App Store 배포 불가)
```

### `error: The sandbox is not in sync with the Podfile.lock`
```bash
cd ios/App && pod install
```

### Archive 메뉴가 비활성화됨
```
Device를 "Any iOS Device (arm64)"로 변경
시뮬레이터 선택 시 Archive 불가
```

---

## GitHub Actions CI (Mac Runner 사용)

GitHub Actions에서 자동 빌드하려면 macOS runner 필요 (분당 과금):

```yaml
# .github/workflows/ios-release.yml
jobs:
  build:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npx cap sync ios
      - run: cd ios/App && pod install
      - uses: Apple-Actions/import-codesign-certs@v2
        with:
          p12-file-base64: ${{ secrets.CERTIFICATES_P12 }}
          p12-password: ${{ secrets.CERTIFICATES_P12_PASSWORD }}
      - uses: Apple-Actions/upload-testflight-build@v1
        with:
          app-path: ios/App/App.ipa
          issuer-id: ${{ secrets.APPSTORE_ISSUER_ID }}
          api-key-id: ${{ secrets.APPSTORE_API_KEY_ID }}
          api-private-key: ${{ secrets.APPSTORE_API_PRIVATE_KEY }}
```

필요한 GitHub Secrets:

| Secret | 내용 |
|--------|------|
| `CERTIFICATES_P12` | 배포 인증서 .p12 → base64 |
| `CERTIFICATES_P12_PASSWORD` | .p12 비밀번호 |
| `APPSTORE_ISSUER_ID` | App Store Connect API Issuer ID |
| `APPSTORE_API_KEY_ID` | API Key ID |
| `APPSTORE_API_PRIVATE_KEY` | API .p8 파일 내용 |

> Fastlane + match 조합이 인증서 관리를 크게 단순화함 (팀 개발 시 권장).

---

## Codemagic으로 Mac 없이 빌드 (대안)

Mac이 없을 경우:
1. https://codemagic.io 가입 (무료 500분/월)
2. GitHub 연결
3. `codemagic.yaml` 설정 파일 추가
4. 빌드 트리거 → TestFlight 자동 업로드

---

## 전체 빌드 순서 요약

```bash
# 1. 의존성
cd dream-newspaper/frontend && npm install

# 2. 빌드 & 동기화
npm run build && npx cap sync ios

# 3. CocoaPods
cd ios/App && pod install

# 4. Xcode에서 열기
open App.xcworkspace
# → Device: Any iOS Device (arm64)
# → Product → Archive
# → Organizer → Distribute App → App Store Connect → Upload
```

---

## 참고

- Capacitor iOS 공식 문서: https://capacitorjs.com/docs/ios
- App Store Connect: https://appstoreconnect.apple.com
- Apple Developer: https://developer.apple.com
- Codemagic (Mac 없이 빌드): https://codemagic.io
