# 성경 인물 도트 캐릭터

홈에서 남성 10명과 여성 10명 중 원하는 인물을 고릅니다. 처음에는 아이디에 포함된 이름과 일치하는 인물을 우선 표시하고, 해당 인물이 목록에 없으면 기본 캐릭터를 표시합니다. 수동 선택은 아이디를 바꾸지 않으며 현재 브라우저나 설치 앱에서 계정별로 기억합니다. 홈과 기도실은 같은 캐릭터 이미지 경로를 사용합니다.

이미지 생성으로 원본을 제작한 뒤 투명 여백과 크기를 맞춰 `public/avatars/bible-v1/`에 WebP로 보관합니다. 실제 게임에서 추출한 에셋은 사용하지 않습니다. 앱에서 사진을 올리거나 외부 서비스에 연결할 필요가 없습니다.

## 이미지 제작 요청문

공통 요청: 투명 배경에 전신이 잘리지 않는 고전 한국 횡스크롤 RPG풍 성경 인물 한 명. ¾ 방향의 편안한 자세, 큰 머리와 짧은 팔다리, 선명한 정사각 픽셀과 차분한 색상. 고대에 어울리는 천 의상. 배경, 바닥, 그림자, 글자, 로고, 다른 인물 없이 실제 투명 픽셀로 출력.

인물별 디자인 지시:

- 모세: 은빛 머리와 수염, 벽돌색 망토, 목자 지팡이.
- 요셉: 검은 곱슬머리와 옥색·호박색·붉은색이 섞인 줄무늬 옷.
- 다윗: 갈색 곱슬머리, 황토색 옷, 붉은 띠와 작은 리라.
- 다니엘: 물결머리, 남색 옷, 황갈색 가장자리와 두루마리.
- 베드로: 둥근 수염, 청록색 어부 옷과 접은 그물.
- 바울: 짧은 머리와 수염, 자주색 여행복, 편지 두루마리.
- 노아: 흰 수염, 갈색 후드 옷, 이끼색 띠와 작은 나무 방주.
- 여호수아: 검은 머리와 붉은 머리띠, 짙은 청색 상의, 무기 없는 자세.
- 엘리야: 회색 수염, 주황빛 갈색 옷, 작은 물병.
- 요한: 어깨 길이 머리, 바다색 망토, 작은 책.
- 사라: 은빛 머리, 린넨 두건, 녹슨 붉은색 겉옷.
- 리브가: 검은 땋은 머리, 청록 머리띠, 세이지색 옷과 물동이.
- 미리암: 곱슬머리, 하늘색 두건, 황토색과 청록 의상, 작은 손북.
- 룻: 올리브색 두건, 황토 갈색 옷, 작은 보리 다발.
- 에스더: 갈색 긴 머리와 금빛 관, 자주색 옷과 장밋빛 숄.
- 마리아: 검은 머리와 하늘색 베일, 크림색 겉옷, 혼자 서 있는 모습.
- 루디아: 짙은 보라색 숄과 연보라색 옷, 접은 자주색 천.
- 브리스길라: 올린 땋은 머리, 세이지색 옷과 테라코타 앞치마.
- 드보라: 땋은 머리, 청동색 머리띠, 금색을 두른 붉은 옷과 올리브색 숄.
- 한나: 청록색 두건과 옅은 장밋빛 옷, 차분하게 두 손을 모은 자세.

<details>
<summary>사용한 원문 요청문</summary>

```text
Use case: stylized-concept. Create ONE original Bible-person character sprite for Korean side-scrolling fantasy MMORPG-inspired game UI, in vintage MapleStory-like low resolution pixel art. Genuine transparent alpha surrounding the character. Center a single full-body character, top of hair to both sandals fully visible with generous invisible margins. Calm idle pose, quarter-view to the right with both eyes visible. Oversize round head, about half total height, no visible neck, tiny body, short arms and legs, soft expressive eyes with a one-pixel highlight. Crisp square pixel clusters, thin dark stepped outline, 3–4 shades per color, no visual noise, pixel blocks on a consistent low-resolution (~72px tall) grid, nearest-neighbor look. Ancient Levant or Biblical-era woven linen styling, warm earthy colors with a single character accent. No background, floor, shadow, glow, labels, logos, overlays, teams, other characters or simulated checkerboard. No gradients, realism, anti-aliased painted style, modern outfit, or repost of existing game artwork.
```

위 요청문 끝에 다음 인물 설명을 하나씩 붙였습니다.

- `moses`: Subject: Moses (male), elderly, silver swept hair and full silver beard, warm brick-red mantle over sand linen, simple straight shepherd staff held close to the body.
- `joseph`: Subject: Joseph son of Jacob (male), young adult, dark curly hair, distinctive woven tunic with restrained vertical jade, amber, and red bands, hands quite relaxed.
- `david`: Subject: David the shepherd (male), very young adult, warm brown curly hair, ochre shepherd tunic and burnt terracotta sash, small wooden lyre held near hip.
- `daniel`: Subject: Daniel the prophet (male), young adult, brown wavy hair, slate-indigo Babylonian cloak with a woven tan trim and a small rolled scroll.
- `peter`: Subject: Simon Peter (male), middle aged, rounded dark brown beard with a few gray pixels, teal fisherman tunic with small bundled fishing net tucked at waist.
- `paul`: Subject: Paul the apostle (male), mature, short dark receding hair and dark beard, deep plum travel mantle over warm cream tunic, carrying a small rolled letter.
- `noah`: Subject: Noah (male), elderly, full white beard and brown hooded robe, bright moss-green sash, carrying a small carved wood ark model in one arm.
- `joshua`: Subject: Joshua son of Nun (male), young adult, dark hair with a plain dark red cloth headband, deep blue sleeveless woven coat over ochre linen, standing peaceably, no weapon or armor.
- `elijah`: Subject: Elijah (male), middle aged with slate gray wavy beard and dark tan skin, orange-brown woven mantle, small pale water flask at hip.
- `john`: Subject: John the apostle (male, not John the Baptist), young adult, shoulder-length dark chestnut waves, sea-blue mantle with ivory lining over cream tunic, small simple closed book.
- `sarah`: Subject: Sarah (female), dignified elderly woman with smiling eyes and silver hair seen below a sand linen head scarf, warm rust wrap over soft cream robe.
- `rebekah`: Subject: Rebekah (female), young adult, black braid and deep teal cloth headband, long sage and tan linen dress, small clay water jug held at her side.
- `miriam`: Subject: Miriam sister of Moses (female), mature, dark curly hair with a sky blue scarf, ochre and aqua woven dress, small round wooden hand drum held close at hip.
- `ruth`: Subject: Ruth (female), young adult, choppy dark brown hair under olive kerchief, ochre-brown linen dress with pale skirt detail, a small tied bundle of golden barley held near body.
- `esther`: Subject: Queen Esther (female), young adult, deep brown flowing hair, understated gold circlet, elegant plum-purple ancient Persian woven robe with dusty rose stole.
- `mary`: Subject: Mary mother of Jesus (female), young adult, warm olive skin and dark hair under simple sky-blue veil, cream long tunic and dusty-blue wrap; standing alone without a child, halo, or religious ornament.
- `lydia`: Subject: Lydia of Thyatira (female), mature, dark hair under deep violet shawl, lavender woven tunic, holding a small folded swatch of purple cloth.
- `priscilla`: Subject: Priscilla (female), adult with dark auburn hair braided and pinned, sage dress and burnt terracotta apron, small spindle or rolled piece of canvas tucked at waist.
- `deborah`: Subject: Deborah the judge (female), mature, confident eyes, dark braided hair with muted bronze woven headband, rich earthy burgundy robe with golden trim, small olive-green shawl.
- `hannah`: Subject: Hannah mother of Samuel (female), adult, gentle dark hazel eyes and warm dark hair, muted blue-green head scarf, terracotta and pale rose dress, hands held together quietly without any objects.

</details>
