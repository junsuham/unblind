# Builder.io 홈 편집 설정

UNBLIND는 홈 전체를 외부 편집기에 맡기지 않습니다. Builder.io가 편집하는 영역은 오늘의 말씀과 언블라인드 앱 바로가기 사이이며, 로그인·게시글·상단바·하단바·마니또·음악 기능은 기존 코드로 보호됩니다.

## 1. Builder 프로젝트 준비

1. Builder.io에서 새 Space를 만듭니다.
2. `Models`에서 **Section** 모델을 추가합니다.
3. 모델의 API 이름을 `unblind-home-section`으로 지정합니다.
4. Preview URL을 `https://unbd.vercel.app/builder-preview/home`으로 지정합니다.

## 2. Vercel 연결

Builder Space 설정에서 Public API Key를 복사한 다음 Vercel 프로젝트의 Production, Preview, Development 환경에 아래 값을 추가합니다.

```text
NEXT_PUBLIC_BUILDER_API_KEY=복사한_PUBLIC_API_KEY
```

환경변수를 처음 등록할 때만 재배포가 필요합니다. 이후 Builder에서 발행한 글씨와 레이아웃 변경은 앱 코드 재배포 없이 반영됩니다.

## 3. 편집과 발행

1. 관리자 센터의 `홈 화면 편집`을 엽니다.
2. `Builder.io 편집기`에서 `unblind-home-section` 콘텐츠를 만듭니다.
3. 기본 블록 또는 UNBLIND 전용 블록을 배치합니다.
   - `UNBLIND 알림 카드`: 작은 제목, 제목, 본문, 버튼 문구와 이동 주소
   - `UNBLIND 작은 제목`: 홈 섹션의 작은 제목
4. 모바일 폭에서 미리 본 뒤 Publish를 누릅니다.
5. `/builder-preview/home`에서 단독 화면을 확인하고 실제 홈에서 최종 확인합니다.

## 안전 원칙

- Builder에는 이메일, 생년월일, 교회, 계정 상태와 같은 개인정보를 입력하지 않습니다.
- 로그인·승인·사용자별 데이터가 필요한 기능은 Builder 블록으로 옮기지 않습니다.
- 상단바와 하단바는 Builder 편집 범위 밖이므로 모바일 Safe Area가 유지됩니다.
- SDK 추적은 비활성화되어 있습니다.
