# 언블라인드 iOS Unlisted App 출시 준비

Unlisted App은 별도 빌드 형식이 아니다. 먼저 App Store Connect에 일반 앱으로 제출해
심사를 통과한 다음, Apple의 Unlisted App 배포 요청을 승인받아 검색 비노출·링크 전용
배포로 전환한다.

## 현재 앱 식별 정보

- 앱 이름: 언블라인드
- Bundle ID: `kr.unblind.app`
- 버전: `0.2.0`
- 빌드 번호: `1`부터 자동 증가
- 지원 기기: iPhone, iOS 15.1 이상
- 공개 개인정보처리방침: `https://unbd.vercel.app/policies/privacy`
- 공개 고객지원: `https://unbd.vercel.app/support`

## 출시 전 필수 입력값

- Apple Developer Program의 유료 멤버십 활성화
- App Store Connect에 Bundle ID `kr.unblind.app`으로 앱 생성
- 지원 이메일을 Vercel의 `NEXT_PUBLIC_SUPPORT_EMAIL`에 등록하고 재배포
- App Store Connect의 앱 개인정보 설문 작성
- 앱 심사용 승인 완료 테스트 계정 준비
- iPhone 6.9인치와 6.5인치 스크린샷 준비

## 권장 App Store 메타데이터 초안

- 부제: 안전하게 나누는 청년 익명 커뮤니티
- 카테고리: 소셜 네트워킹
- 키워드: 청년,커뮤니티,익명,고민,기도,교회
- 프로모션 문구: 승인된 청년회 구성원이 안전하게 고민과 기도제목을 나누는 공간

앱 심사 메모에는 다음 내용을 포함한다.

1. 앱은 승인된 청년회 구성원을 대상으로 하는 제한형 커뮤니티다.
2. 제공한 테스트 계정은 이미 가입 승인과 연령 확인을 완료했다.
3. 신고, 차단, 계정 삭제 위치를 `내 정보 → 계정 관리`로 안내한다.
4. 관리자 화면은 일반 사용자 앱 흐름과 분리되어 있음을 설명한다.
5. Google 로그인 후 필요한 경우 심사자가 접근할 수 있는 정확한 절차를 적는다.

## 빌드와 제출

```sh
npm run typecheck
npm run lint
npm run build:ios:production
npm run submit:ios:production
```

EAS를 사용하지 않을 경우 Xcode에서 `app.xcworkspace`를 열고 Any iOS Device를 선택한
뒤 Product → Archive → Distribute App → App Store Connect로 업로드한다.

## Unlisted 전환 순서

1. App Store Connect에서 앱과 첫 빌드를 생성하고 심사를 제출한다.
2. 앱이 심사 승인을 받은 후 Apple의 Unlisted App 배포 요청 양식을 제출한다.
3. 제한된 대상에게 링크로 배포하는 이유와 대상 사용자, 접근 통제 방식을 설명한다.
4. 승인 후 생성된 App Store 직접 링크만 대상 사용자에게 전달한다.
5. 링크를 가진 사람은 누구나 스토어 페이지에 접근할 수 있으므로 앱 내부 승인 절차를 유지한다.

## 최종 검증

- Release 빌드에서 Google 로그인, 로그아웃, 세션 복원 확인
- 관리자 화면 방문 후 앱 복귀 시 Google 로그인 창이 다시 뜨지 않는지 확인
- 승인 전/거절/정지 계정 화면 확인
- 게시물 신고, 사용자 차단 및 해제, 계정 삭제 확인
- 푸시 알림 권한 거절/허용과 실기기 수신 확인
- 개인정보처리방침과 고객지원 URL이 로그인 없이 열리는지 확인
- 앱 아이콘, 앱 이름, 버전, 빌드 번호가 App Store Connect와 일치하는지 확인
