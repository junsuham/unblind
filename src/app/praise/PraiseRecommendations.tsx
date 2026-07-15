'use client'

import Image from 'next/image'
import { useState } from 'react'
import { SystemIcon } from '@/app/components/ui/SystemIcon'

type Song = {
  id: string
  title: string
  artist: string
}

const songs: Song[] = [
  ['dL-XAmNtJLA', '내 맘에 주를 위한 자리', '아가파오 워십'],
  ['4RRxhqKsTA8', '사랑을 나눠요 (Acoustic Ver.)', 'WELOVE CREATIVE TEAM'],
  ['VEUQfvv4WNw', 'Conquering the Dark Night', 'WECCLESIA 위클레시아'],
  ['4fAOjO2c25o', '낮은 곳으로', '헤세드 선교사'],
  ['pqDTRgaY8q0', '고요한 밤 하늘 별들 반짝일 때', '팀룩워십'],
  ['nS9Vul0VOqM', '사랑한다 말하시네', 'GIFTED'],
  ['V2RnPmCuufU', 'Praising the Lord, the Reason For My Life', 'WECCLESIA 위클레시아'],
  ['lV3zSKZYdEQ', 'I Am Weak In Myself', 'WECCLESIA 위클레시아'],
  ['1mJbdWgL_SQ', '위로 (Will Of)', '오레브 O.LAB'],
  ['PMTST3gtBjc', 'Dan. 3:18', 'GIFTED'],
  ['k3FPAFEtYLw', '그 시절 우리가 함께 듣던 찬양', '미스바청년부'],
  ['LYD-1x04Qig', 'Hey Buddy', 'GIFTED'],
  ['fjyzLK7fdJc', 'Broken Hearted Worshiper', 'WELOVE CREATIVE TEAM'],
  ['4RSPMb6DkR8', '예수를 나의 구주 삼고', '나비워십'],
  ['dqkjYU651LY', '나는 주만 높이리', '마커스워십'],
  ['ujZT26KzxQY', '주가 지으신 이날에', '팀룩워십'],
  ['OyPlxLePdDc', '주를 찾는 모든 자들이 (시편 70편)', '팀룩워십'],
  ['nuG5e7mBusI', "We Won't Back Down", 'WELOVE CREATIVE TEAM'],
  ['KM1DjMPdsXc', '하늘 소망', '어노인팅'],
  ['770mFGCCTDg', '내 마음을 가득 채운', 'WELOVE CREATIVE TEAM'],
  ['_r4zDp0CS1E', '내 영혼이', '꿈이 있는 자유'],
  ['FO8Aa-qu8HA', '빛을 들고 세상으로', '어노인팅'],
  ['c216NU8183o', '영접송 (내 맘을 엽니다)', '팀룩워십'],
  ['H56xVRKQ2Ag', '주와 함께 걸어가네 (Live)', '팀룩워십'],
  ['iDM2Veo5GNE', '시험 기간에 듣기 좋은 찬양', '비상대학부'],
  ['gaG8xq_tQXA', '주와 함께 걸어가네', '팀룩워십'],
  ['qy3z987E-P8', 'Looking At The Lord', 'GIFTED'],
  ['sQN1IgfJXKs', '혼자 걷지 않을 거예요', '예람워십'],
  ['z2D-pt0IKdY', '선하신 나의 주', '팀룩워십'],
  ['2lepsZ-jcpM', '담대함이 필요한 날의 찬양', '안성은광교회'],
  ['yf6RQOOwRPA', '모든 걸음 되시네', '예람워십'],
  ['SNdlDao8Q1M', 'Rise Again', 'WELOVE CREATIVE TEAM'],
  ['gQq1UJ3OKOk', '그리스도 안에서', '팀룩워십'],
  ['mrjRlnrhoYs', '주님 마음 내게 주소서', '마커스워십'],
  ['LaO19EbMzcE', '주 은혜임을', '마커스워십'],
  ['hAJNiYuiUww', '주의 사랑 우리 안에', '어노인팅'],
  ['COV8-ZlfZPg', '내 주를 가까이', '제이어스 J-US'],
  ['-LAutVOhH2I', '목마른 예배자', 'AHAV WORSHIP'],
  ['E4lsDTewMuc', '지친 마음, 위로가 필요할 때', '극동방송'],
  ['PRlEqQJ9c10', '우린 주를 만나고', '어노인팅'],
  ['9WcgtGvRe5Q', 'On Your Day', 'WELOVE CREATIVE TEAM'],
  ['2S-GvD-GtNs', 'His Light (I Am)', 'WELOVE CREATIVE TEAM'],
  ['JzJcFbHRCEM', 'Where Your Hand May Reach', 'WELOVE CREATIVE TEAM'],
  ['NNw5HahlYpQ', 'Lost in the Dark', 'WELOVE CREATIVE TEAM'],
  ['4KouWV1sYPs', 'Darkness to Light', 'WELOVE CREATIVE TEAM'],
  ['sqdesWPn3eA', 'Praise Him', 'WELOVE CREATIVE TEAM'],
  ['3GvVoE0tG2c', '나의 하나님', '심형진 feat. 박우정'],
  ['U1YJM2rlNpo', '주는 완전합니다', '마커스워십'],
  ['Yqod83GKE0M', '예수, 늘 함께 하시네', '마커스워십'],
  ['I-i2yA1e5F4', 'Come And Let Us Go', 'WELOVE CREATIVE TEAM'],
  ['RdtAYWGw98E', '그 안에 나 거하네', '마커스워십'],
  ['MDtchqosJX8', '우리 주 하나님 + 그 크신 하나님의 사랑', '예람워십'],
  ['jPqZ18zYVIM', '내가 늘 의지하는 예수', '어노인팅'],
  ['P7pGWTD8Wvc', '한나의 노래', '마커스워십'],
  ['4v0oHeJ8-2k', '예수, 늘 함께 하시네 (Official)', '마커스워십'],
  ['yo0HQn_NCyY', 'The Love of God Is Greater Far', '아이자야씩스티원'],
  ['qYojh2BEv4k', '낮에 햇빛 속에', '원주의대 CMF'],
  ['d6qkk8RLgu8', '맛 잃은 소금', '유니즌'],
  ['VLXi2QJBSac', '주 은혜임을', '김윤진'],
  ['bWj_ElOhz7c', '비 준비하시니', '심형진'],
  ['cRdSBfdIxCw', '실로암', 'JIN'],
  ['pk6Vfw-q7VU', '실로암 (feat. 천관웅)', 'DIJ'],
  ['Ctl6Q1t_OSQ', '내 모습 이대로', '제이어스 J-US'],
  ['2Sxwf0UFXOM', 'Here Is Love (Live)', 'Brian Johnson'],
  ['90nljfQiT4E', 'Here Is Love', 'Bethel Music'],
  ['kaoxvIVrY_4', '바다 같은 주의 사랑', '예수전도단'],
  ['4msV_nz-xw0', '나의 기쁨 나의 소망되시며', '어노인팅'],
  ['k4Md9dFbky0', 'The Lord Has Called Me', 'WELOVE CREATIVE TEAM'],
  ['QlwG8Rub5a8', '하늘에 닿아도 (시편 73편)', '어노인팅'],
  ['jRfnBcyrCyA', '내 주의 보혈은', '찬송가'],
  ['d6Nn5RhCidg', '오직 예수 뿐이네', '마커스워십'],
  ['jbcQ0q4FDZU', '나의 한숨을 바꾸셨네', '소진영'],
  ['uecwkxY9tiY', '어둔 날 다 지나고', 'WELOVE CREATIVE TEAM'],
  ['I7pCmfut__I', '생명의 양식', '어노인팅'],
  ['wK_p1eezMTA', '나의 영혼이 잠잠히', '박민기'],
  ['ufD_Ov6umK4', '푯대를 향하여', '어노인팅'],
  ['Bvx01WxiAso', '나의 소망 되신 주', '어노인팅'],
  ['6tqBtZbn6kU', '자랑 (시편 34편)', '예수전도단'],
  ['0wcTqurzRdI', '새 힘 얻으리 (Electric Guitar)', '3:16 Worship'],
  ['5N2R8lNNBJ4', '새 힘 얻으리', '파워스테이션'],
  ['ZvINdEeqcUs', '새 힘 얻으리', '어노인팅'],
  ['tfYVlfR3DEA', '예수님을 향한 이 노래', '꿈이 있는 자유'],
  ['Hgdk1aIyT08', '전해야 해', '꿈이 있는 자유'],
  ['16G7beqQmmQ', '그 마음을 지닌 자', '꿈이 있는 자유'],
  ['Y6YMcfzgJ90', '하연이에게', '꿈이 있는 자유'],
  ['T5xHJeK7EfM', '이 땅에 오직', '꿈이 있는 자유'],
  ['kHfLKYBT5N4', '때 저물어서 날이 어두니', '미라벨린'],
  ['0l6AibVuMO0', '신부', '어노인팅'],
  ['sxD24Cjqv8k', '당신의 은혜', '김은구'],
  ['mBJObaXJPBo', '이 땅은', '김은구'],
  ['qRacBBUbZ1c', '소망의 빛', '의대 CCC'],
  ['DWbJs9fk-yU', '청년의 기도', '손경민'],
  ['tE_CKrZufSk', '시편의 노래', '어노인팅'],
  ['4e_2RYwheMU', '그 사랑 감사해', '제이어스 J-US'],
  ['XAiBfzjs8Qs', '온 세계 위에', '예수전도단'],
  ['3j9blU6yGiI', '요셉의 노래', 'AJ Worship'],
  ['pt928N-Treg', '예수 따라가며', '어노인팅'],
  ['Guzz5-m9O_E', '예수 안에 소망있네', '어노인팅'],
  ['a55aLhz7Zow', '주 사랑이 나를 숨쉬게 해', '어노인팅'],
  ['9RgepmRUshA', '더 낮은 곳으로 흘러', '어노인팅'],
].map(([id, title, artist]) => ({ id, title, artist }))

export default function PraiseRecommendations() {
  const [selectedSong, setSelectedSong] = useState(songs[0])

  function selectSong(song: Song) {
    setSelectedSong(song)
    window.requestAnimationFrame(() => {
      document.getElementById('unblind-player')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
  }

  return (
    <div>
      <section
        id="unblind-player"
        className="sticky top-3 z-20 overflow-hidden rounded-[22px] border border-[var(--ub-glass-border)] bg-[var(--ub-surface-card-strong)] text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-card)]"
      >
        <div className="aspect-video w-full bg-black">
          <iframe
            key={selectedSong.id}
            src={`https://www.youtube-nocookie.com/embed/${selectedSong.id}?autoplay=1&playsinline=1&rel=0`}
            title={`${selectedSong.title} 재생`}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--ub-color-brand)] text-white">
            <SystemIcon name="music" size={18} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold">{selectedSong.title}</span>
            <span className="block truncate text-[12px] text-[var(--ub-text-tertiary)]">{selectedSong.artist}</span>
          </span>
        </div>
      </section>

      <div className="mt-5 flex items-end justify-between px-1">
        <div>
          <p className="text-[13px] font-semibold text-[var(--ub-text-on-brand-primary)]">이번 주 TOP 100</p>
          <p className="mt-0.5 text-[11px] text-[var(--ub-text-on-brand-tertiary)]">언블라인드 에디터 선정</p>
        </div>
        <span className="text-[11px] text-[var(--ub-text-on-brand-tertiary)]">곡을 눌러 바로 재생</span>
      </div>

      <section className="mt-2 overflow-hidden rounded-[22px] bg-[var(--ub-surface-card-strong)] text-[var(--ub-text-primary)] shadow-[var(--ub-shadow-soft)]">
        {songs.map((song, index) => {
          const isSelected = selectedSong.id === song.id

          return (
            <button
              key={song.id}
              type="button"
              onClick={() => selectSong(song)}
              aria-label={`${index + 1}위 ${song.title} 재생`}
              className={`flex min-h-[76px] w-full items-center gap-3 border-b border-[var(--ub-separator)] px-3 py-2.5 text-left last:border-b-0 active:bg-[var(--ub-surface-pressed)] ${isSelected ? 'bg-[var(--ub-surface-brand-soft)]' : ''}`}
            >
              <span className={`w-6 shrink-0 text-center text-[14px] tabular-nums ${index < 3 ? 'font-bold text-[var(--ub-color-brand)]' : 'text-[var(--ub-text-secondary)]'}`}>
                {index + 1}
              </span>
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-[var(--ub-surface-muted)]">
                <Image
                  src={`https://i.ytimg.com/vi/${song.id}/mqdefault.jpg`}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/22 text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
                    <SystemIcon name="play" size={15} className="translate-x-px" />
                  </span>
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[14px] font-semibold ${isSelected ? 'text-[var(--ub-color-brand)]' : ''}`}>
                  {song.title}
                </span>
                <span className="mt-1 block truncate text-[12px] text-[var(--ub-text-tertiary)]">
                  {song.artist}
                </span>
              </span>
              <SystemIcon
                name={isSelected ? 'music' : 'play'}
                size={18}
                className={isSelected ? 'text-[var(--ub-color-brand)]' : 'text-[var(--ub-text-tertiary)]'}
              />
            </button>
          )
        })}
      </section>

      <p className="mt-3 px-1 text-[11px] leading-[17px] text-[var(--ub-text-on-brand-tertiary)]">
        YouTube 공식 플레이어로 재생됩니다. 일부 영상은 권리자의 설정에 따라 재생이 제한될 수 있습니다.
      </p>
    </div>
  )
}
