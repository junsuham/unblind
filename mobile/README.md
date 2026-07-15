# 언블라인드 모바일 앱

Expo SDK 57과 React Native로 만든 iOS·Android 공용 네이티브 앱입니다. 웹 화면을 감싸는 PWA/WebView 앱이 아니라 Supabase 데이터와 인증을 직접 사용하는 독립 앱입니다.

## 포함된 기능

- Google·Kakao OAuth 로그인과 기기 내 암호화 세션 저장
- 2026년 기준 연령 제한 및 실제 교회 검색 가입 절차
- 인기글, 알림, 게시판 검색, 글·댓글·좋아요·기도 작성
- 마니또 참여와 익명 응원 쪽지
- 언블 TOP 100 재생
- iOS·Android 공용 네이티브 UI

## 로컬 설정

1. 저장소 루트의 웹 환경변수를 사용하는 경우 `npm run env:sync`를 실행합니다. 별도 Supabase 프로젝트라면 `.env.example`을 `.env.local`로 복사합니다.
2. Supabase 프로젝트 URL과 Publishable Key를 입력합니다. Service Role 키는 절대 앱에 넣지 않습니다.
3. Supabase Authentication의 Redirect URLs에 `unblind://auth/callback`과 `exp://**`를 추가합니다.
4. 실제 iPhone에서 빠르게 확인할 때는 Expo Go를 사용하고, 네이티브 설치형 동작을 확인할 때는 Development Build를 사용합니다.

```bash
npm install
npx expo prebuild
npm run ios
npm run android
```

### iPhone에서 Expo Go로 테스트

1. iPhone과 Mac을 같은 Wi-Fi에 연결하고 App Store에서 Expo Go를 설치합니다.
2. 아래 명령을 실행합니다.
3. 표시되는 QR 코드를 iPhone 카메라로 스캔합니다.

```bash
npm run start:iphone
```

Expo Go에서는 로그인 복귀 주소가 실행 중인 개발 서버의 `exp://` 주소로 자동 생성됩니다. 설치형 개발 빌드에서는 기존 `unblind://auth/callback`을 사용합니다.

## Android 설치 파일

Expo 계정 연결 후 다음 명령으로 직접 설치 가능한 APK를 만들 수 있습니다.

```bash
npm run build:android:preview
```

Play Store 제출용 AAB는 `npm run build:android:production`을 사용합니다.

## iOS 테스트

무료 Apple 계정은 Xcode에서 본인 기기로 개발 빌드를 실행할 수 있습니다. TestFlight와 App Store 배포에는 Apple Developer Program 멤버십이 필요합니다.
