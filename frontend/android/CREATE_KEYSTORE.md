# Android 서명 키스토어 생성 방법

Android Studio 설치 후 아래 명령을 실행하세요.

## 1. Android Studio에서 생성 (GUI)

1. Android Studio 열기: `npx cap open android`
2. **Build → Generate Signed Bundle/APK** 클릭
3. **Create new...** 선택
4. 아래 정보 입력:
   - Key store path: `android/app/keystore.jks`
   - Password: (안전한 비밀번호 설정)
   - Alias: `dreamnewspaper`
   - Key password: (동일하게 설정)
   - Validity: 25 years
   - 회사 정보 입력

## 2. 터미널에서 생성

Android Studio 설치 후 JDK가 있으면:

```bash
cd frontend/android/app

# Android Studio JDK 경로 예시 (Windows)
"C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" \
  -genkeypair -v \
  -keystore keystore.jks \
  -alias dreamnewspaper \
  -keyalg RSA \
  -keysize 2048 \
  -validity 9125 \
  -dname "CN=Dream Newspaper, OU=App, O=Dream Newspaper, L=Seoul, ST=Seoul, C=KR" \
  -storepass "YOUR_STORE_PASSWORD" \
  -keypass "YOUR_KEY_PASSWORD"
```

## 3. 환경변수 설정

생성 후 환경변수 설정 (또는 local.properties에 추가):

```
KEYSTORE_PASSWORD=YOUR_STORE_PASSWORD
KEY_ALIAS=dreamnewspaper
KEY_PASSWORD=YOUR_KEY_PASSWORD
```

## ⚠️ 중요

- `keystore.jks`는 **절대 Git에 커밋하지 마세요** (.gitignore에 등록됨)
- 비밀번호를 안전한 곳에 백업하세요 (잃어버리면 앱 업데이트 불가)
- Play Console에 업로드 후 Google Play App Signing을 활성화하면 안전합니다
