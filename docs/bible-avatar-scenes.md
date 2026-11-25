# 성경 속 도트 배경과 MBTI 캐릭터

홈 → **배경 선택**에서 성경 장면 10종을 미리보고 적용합니다. 처음에는 갈릴리 호수가 표시됩니다. 배경 선택은 캐릭터 선택과 독립적으로 현재 브라우저나 설치 앱에만 저장됩니다.

기도실은 홈과 동일한 선택 캐릭터를 사용하되 기존 기도실 배경을 유지합니다. MBTI 16유형 중 홈 캐릭터 목록과 겹치는 11명은 동일 파일을 사용하고, 느헤미야·브살렐·아볼로·막달라 마리아·바나바는 별도 도트 캐릭터를 사용합니다. 결과 화면과 공유 PNG가 같은 인물 이미지를 표시합니다.

홈에서 날씨를 고르면 장소는 유지하면서 햇살, 구름, 빗줄기와 색감이 달라집니다. 오늘의 마음을 고르면 얼굴만 바뀌며, 기도실과 MBTI에는 기본 표정이 표시됩니다. 표정은 캐릭터별 이미지 한 장에 모두 넣어 기분을 바꿀 때 기분 이름이 포함된 추가 이미지 요청을 보내지 않습니다.

- 배경 파일: `public/avatars/bible-scenes-v1/` (960×540) 및 `thumbs/` (320×180).
- 추가 MBTI 캐릭터: `public/avatars/bible-mbti-v1/` (192×224 투명 WebP). 기존 20종의 경로는 바뀌지 않습니다.
- 풍경과 인물은 원본 게임 파일을 쓰지 않고 이미지 생성으로 별도 제작했습니다. 앱 자체에서 외부 이미지 생성 요청은 하지 않습니다.

## 제작에 사용한 요청문

배경 공통 요청문:

```text
Use case: stylized-concept, game environment asset. Render one landscape 16:9 BACKGROUND for an original classic Korean 2D side-scrolling RPG avatar stage inspired by old-school MapleStory pixel backgrounds. Scene only, no character. Hard-edged intentionally visible clustered pixels at an apparent 240x135 game resolution, sharply scaled; artful stepped edges, limited but rich colors, layered parallax depth, period-appropriate terrain and old materials, inviting handcrafted 16-bit atmosphere. Ultra-wide horizontal framing: use an uncluttered flat playable ledge occupying the bottom fifth, simple plain middle foreground so a separate 2-head-tall sprite can be composited over it, and scenic focal features visible within the central 70% for phone cropping. Fill the entire canvas, no borders, gradients, bokeh, UI, text, logos, watermarks, people, modern structures or depiction of a deity. Main setting:
```

- `eden`: Garden of Eden in Genesis 2. Lush verdant primeval garden, winding crystal spring splitting between fern banks, abundant fig trees, deep jade foliage and small golden flowers. Gentle morning sun through foliage. An unobstructed mossy clearing along the foreground.
- `ararat`: Mountains of Ararat, Genesis 8:4. A great ancient cedar wood ark rests on a high rocky shoulder left of center after rain. Terraced pale gray and mist-blue mountain ridges, clear pale sunlight and stepped white clouds, a grassy rocky foreground ledge. Ark has no occupants visible.
- `red-sea`: Exodus 14:21–22, the parted Red Sea. Majestic tall sea walls at far left and right, turquoise and indigo glassy stepped pixel waves, a dry ochre passage straight through center, distant apricot dawn. Flat dry foreground platform for a sprite; no people.
- `sinai`: Mount Sinai in Exodus 19. Broad rocky ochre and purple Sinai peaks with distant luminous thunderclouds, soft amber light piercing the clouds without depicting any deity, a barren terraced rocky ledge with room at center foreground.
- `bethlehem`: Ancient Bethlehem in Luke 2. Dusky blue early night sky with a bright single star over an ancient stone village and an empty warm lamp-lit simple stable door. A stone path and pale grass in the foreground. No people, no manger figures, no modern architecture.
- `galilee`: The Sea of Galilee lakeshore in Luke 5. Golden blue daytime sky, billowing finely drawn cream clouds and a little round sun off-center, turquoise calm water, distant ochre hills, small plain ancient wooden fishing boat near shore on the left, reeds to the right. Clear broad sandy shore in foreground center.
- `beatitudes`: A hillside by the Sea of Galilee evoking Matthew 5. Sunlit rolling green meadows, yellow wildflowers, a broad grassy rock terrace at the very bottom, distant blue lake and pastures, two soft stepped clouds, no crowd or people.
- `jordan`: The Jordan River in Matthew 3. Meandering clear teal river from distance bending behind a broad foreground sandy bank, tall reeds and tamarisk, warm golden and olive hills, white broken clouds and blue sunlit sky. No people or dove.
- `gethsemane`: Garden of Gethsemane in Matthew 26. A quiet olive grove at night, two gracefully gnarled trunks framing far sides, silver dark olive leaves, deep indigo night and a gentle crescent moon, unobstructed worn pale stone and dirt path in foreground. No people.
- `emmaus`: Road to Emmaus from Luke 24. Gently winding ochre limestone footpath in foreground and center leading to a distant modest ancient village, golden evening sky with layered pixel clouds, olive terraces on either side, low late sun behind hills, no people.

MBTI 추가 인물 공통 요청문:

```text
Use case: stylized-concept. Create ONE original Bible-person character sprite for Korean side-scrolling fantasy MMORPG-inspired game UI, in vintage MapleStory-like low resolution pixel art. Genuine transparent alpha surrounding the character. Center a single full-body character, top of hair to both sandals fully visible with generous invisible margins. Calm idle pose, quarter-view to the right with both eyes visible. Oversize round head, about half total height, no visible neck, tiny body, short arms and legs, soft expressive eyes with a one-pixel highlight. Crisp square pixel clusters, thin dark stepped outline, 3–4 shades per color, no visual noise, pixel blocks on a consistent low-resolution (~72px tall) grid, nearest-neighbor look. Ancient Levant or Biblical-era woven linen styling, warm earthy colors with a single character accent. No background, floor, shadow, glow, labels, logos, overlays, teams, other characters or simulated checkerboard. No gradients, realism, anti-aliased painted style, modern outfit, or repost of existing game artwork.
```

- `nehemiah`: Subject: Nehemiah (male), dark brown short hair and neat stubble, stone blue-gray cloak over pale wheat linen, small rolled city plan close to chest.
- `bezalel`: Subject: Bezalel the artisan (male), warm dark olive skin, black curls and small short beard, ochre craft apron over cream linen, small wooden carving tool at belt.
- `apollos`: Subject: Apollos of Alexandria (male), dark wavy hair and trimmed beard, olive and muted teal travel tunic, simple ancient rolled manuscript held at chest.
- `mary-magdalene`: Subject: Mary Magdalene (female; not Mary mother of Jesus), young adult, long dark chestnut hair under a muted vermilion-red headcloth, warm amber and rose linen robe, small amber oil vessel held at waist.
- `barnabas`: Subject: Barnabas (male), warm older fatherly face, brown short hair and beard with gentle gray highlights, leaf-green and chestnut mantle over cream woven tunic, open welcoming resting hands.
