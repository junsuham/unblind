# 교회 운영 대시보드 연동

UNBLIND의 `/church-dashboard`는 공개 대시보드나 Google Sheets를 브라우저에 직접 연결하지 않습니다. 관리자에게 별도로 부여받은 `church_dashboard_access` 권한이 있어야 서버가 자료를 읽습니다. 앱 관리자 권한만으로는 열리지 않습니다.

## 배포 전 준비

1. `20261124020000_church_dashboard_access.sql` 마이그레이션을 적용합니다.
2. 관리자는 자신의 Google 계정으로 UNBLIND에 로그인하고 대상자의 실제 교회·부서 소속을 앱 밖에서 확인한 뒤 관리자 센터 → 참여자 관리에서 `교회 운영 대시보드` 범위를 선택합니다. 가입 시 선택한 교회만으로 소속이 증명되지는 않습니다. 공유 관리자 비밀번호/쿠키만으로는 부여·회수할 수 없습니다.
3. 별도 신뢰된 서버 작업이 `church_dashboard_snapshots`에 교회 장소 ID(`church_place_id`)와 부서별 요약을 기록해야 합니다. 빈 부서 문자열은 교회 전체 요약, 특정 부서 문자열은 해당 부서 요약입니다. 앱에서는 이 데이터를 수정할 수 없습니다.

기존 `christ-dashboard` 화면은 현재 실명, 출석, 기도 등 개인별 자료를 포함하므로 iframe이나 공개 URL로 연결하지 않습니다. 원본 데이터의 이용 목적·동의·열람권한을 확인한 뒤 서버에서 비식별 집계만 만들고, `church_place_id`와 부서로 나누어 게시해야 합니다. 이름만으로 교회를 묶으면 동명이교회가 섞일 수 있습니다.

## 게시 가능한 필드

`generated_at`, `member_count`, `attendance_count`, `prayer_contributor_count`, `prayer_minutes`, `care_pending_count`, `upcoming_event_count`, `attendance_weeks`만 사용합니다. `attendance_weeks`는 `[{"date":"YYYY-MM-DD","label":"11월 1주","attendance":12}]` 형태입니다. 기도 시간은 참여자가 5명 이상일 때만 표시됩니다. 교인 실명·교번·이메일·연락처·개별 출석/기도 내용은 이 테이블에 넣지 않습니다.

5명 미만의 교회/부서 수치는 앱 응답에서 모두 가려집니다. 5명 이상인 집계에서도 개별 항목의 1~4건은 가려집니다. 인원 수를 알 수 없는 집계도 가려집니다. 대시보드에는 데이터가 없을 때 임의 수치나 샘플 교인을 표시하지 않습니다.

권한이 회수되거나 이용자의 교회 장소 ID/부서가 바뀌면 다음 페이지·API 요청부터 접근이 거절됩니다. 앱의 `/api/church-dashboard/overview`도 동일한 서버 권한 확인을 거치고 캐시하지 않습니다.
