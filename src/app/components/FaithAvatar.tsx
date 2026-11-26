'use client'

import Image from 'next/image'
import { useId, useState } from 'react'
import { bibleAvatarScenes, getBibleAvatarScene, saveBibleAvatarSceneId, type BibleAvatarSceneId } from '@/lib/bibleAvatarScenes'
import type { FaithMood, FaithWeather } from '@/lib/dailyFaith'
import { bibleAvatarPresets, saveBibleAvatarPreset, type BibleAvatarPreset } from '@/lib/pixelAvatar'
import { FaithAvatarSprite } from './FaithAvatarSprite'
import { FaithAvatarWeather } from './FaithAvatarWeather'
import { FaithWeatherIcon } from './FaithWeatherIcon'
import { useBibleAvatarScene } from './useBibleAvatarScene'
import { useFaithAvatar } from './useFaithAvatar'
import styles from './FaithAvatar.module.css'

const weatherNames: Record<FaithWeather, string> = {
  sunny: '맑음', partly_cloudy: '구름 조금', cloudy: '흐림', rainy: '비',
}

const avatarGroups: Array<{ gender: BibleAvatarPreset['gender']; label: string }> = [
  { gender: 'male', label: '남성 인물' },
  { gender: 'female', label: '여성 인물' },
]

export function FaithAvatar({
  mood, weather, storageScope, characterName,
}: {
  mood: FaithMood | null
  weather: FaithWeather | null
  storageScope: string
  characterName: string
}) {
  const { ready, avatar } = useFaithAvatar(storageScope, characterName)
  const scene = useBibleAvatarScene(storageScope)
  const id = useId()
  const panelId = `${id}-characters`
  const scenePanelId = `${id}-scenes`
  const [picker, setPicker] = useState<'avatar' | 'scene' | null>(null)
  const [gender, setGender] = useState<BibleAvatarPreset['gender']>('male')
  const [draftId, setDraftId] = useState<BibleAvatarPreset['id'] | null>(null)
  const [draftSceneId, setDraftSceneId] = useState<BibleAvatarSceneId | null>(null)
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)

  const open = picker === 'avatar'
  const sceneOpen = picker === 'scene'
  const draft = bibleAvatarPresets.find((preset) => preset.id === draftId) ?? avatar
  const candidates = bibleAvatarPresets.filter((preset) => preset.gender === gender)
  const unchanged = draft.id === avatar.id
  const draftScene = draftSceneId ? getBibleAvatarScene(draftSceneId) : scene
  const sceneUnchanged = draftScene.id === scene.id
  const visibleScene = sceneOpen ? draftScene : scene

  function togglePicker(kind: 'avatar' | 'scene') {
    const willOpen = picker !== kind
    if (willOpen && kind === 'avatar') {
      setGender(avatar.gender)
      setDraftId(avatar.id)
    } else if (willOpen) {
      setDraftSceneId(scene.id)
    }
    setNotice(null)
    setPicker(willOpen ? kind : null)
  }

  function applyAvatar() {
    if (!ready || unchanged) return
    try {
      saveBibleAvatarPreset(storageScope, draft.id)
      setNotice({ text: `${draft.name} 캐릭터를 홈과 기도실에 적용했어요.` })
    } catch {
      setNotice({ error: true, text: '이 브라우저에 선택을 저장할 수 없어요. 저장 설정을 확인해주세요.' })
    }
  }

  function applyScene() {
    if (sceneUnchanged) return
    try {
      saveBibleAvatarSceneId(storageScope, draftScene.id)
      setNotice({ text: `${draftScene.name} 배경을 홈에 적용했어요.` })
    } catch {
      setNotice({ error: true, text: '이 브라우저에 배경을 저장할 수 없어요. 저장 설정을 확인해주세요.' })
    }
  }

  return (
    <div className={styles.studio}>
      <div className={styles.scene} data-weather={weather ?? 'unset'} data-mood={mood ?? 'unset'}>
        <Image
          src={visibleScene.src}
          alt=""
          fill
          sizes="(max-width: 520px) calc(100vw - 32px), 480px"
          loading="eager"
          className={styles.sceneImage}
          unoptimized
        />
        <FaithAvatarWeather weather={weather} sceneId={visibleScene.id} />
        {ready ? (
          <FaithAvatarSprite avatar={avatar} name={characterName} size={228} className={styles.sprite} mood={mood} />
        ) : (
          <span className={styles.loadingSprite} role="status">캐릭터 불러오는 중…</span>
        )}
        <div className={styles.sceneLabel}>
          <span>{sceneOpen && !sceneUnchanged ? '미리보기 · ' : ''}{visibleScene.name}</span>
          <small>{visibleScene.reference}</small>
        </div>
        {weather && (
          <span className={styles.weatherLabel} role="img" aria-label={weatherNames[weather]}>
            <FaithWeatherIcon weather={weather} />
          </span>
        )}
      </div>
      <div className={styles.caption}>
        <div className={styles.identity}>
          <strong className={styles.name}>{characterName}</strong>
          {ready && <span className={styles.currentAvatar}>{avatar.name} 캐릭터</span>}
        </div>
        <div className={styles.pickerActions}>
          <button
            type="button"
            aria-label={open ? '캐릭터 닫기' : '캐릭터 선택'}
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            onClick={() => togglePicker('avatar')}
            disabled={!ready}
            className={`${styles.customizeButton} ${styles.characterButton}`}
          >
            <span aria-hidden="true">🕹️</span>
          </button>
          <button
            type="button"
            aria-label={sceneOpen ? '배경 닫기' : '배경 선택'}
            aria-expanded={sceneOpen}
            aria-controls={sceneOpen ? scenePanelId : undefined}
            onClick={() => togglePicker('scene')}
            className={styles.customizeButton}
          >
            <span aria-hidden="true">🖼️</span>
          </button>
        </div>
      </div>
      {open && (
        <section id={panelId} aria-labelledby={`${panelId}-title`} className={styles.picker}>
          <div className={styles.pickerIntro}>
            <h3 id={`${panelId}-title`}>성경 인물 캐릭터</h3>
            <p>아이디는 그대로 두고, 좋아하는 인물을 골라요.</p>
          </div>
          <div className={styles.groups} role="group" aria-label="성경 인물 분류">
            {avatarGroups.map((group) => (
              <button
                key={group.gender}
                type="button"
                aria-pressed={gender === group.gender}
                onClick={() => {
                  setGender(group.gender)
                  setNotice(null)
                }}
              >
                {group.label}
                <span>{bibleAvatarPresets.filter((preset) => preset.gender === group.gender).length}</span>
              </button>
            ))}
          </div>
          <div className={styles.characters} role="group" aria-label="선택할 성경 인물">
            {candidates.map((preset) => (
              <button
                key={preset.id}
                type="button"
                aria-pressed={preset.id === draft.id}
                className={styles.character}
                onClick={() => {
                  setDraftId(preset.id)
                  setNotice(null)
                }}
              >
                <span className={styles.tileArt}>
                  <Image src={preset.src} alt="" width={88} height={88} className={styles.tileImage} unoptimized />
                </span>
                <span>{preset.name}</span>
                {preset.id === draft.id && <span className={styles.check} aria-hidden>✓</span>}
              </button>
            ))}
          </div>
          <div className={styles.selection}>
            <div className={styles.selectionDetails}>
              <strong>{draft.name}</strong>
              <span>{draft.caption}</span>
            </div>
            <button type="button" onClick={applyAvatar} className={styles.applyButton} disabled={unchanged}>
              {unchanged ? '적용 중인 캐릭터' : '이 캐릭터 적용'}
            </button>
          </div>
          {notice && <p role={notice.error ? 'alert' : 'status'} className={styles.notice} data-error={Boolean(notice.error)}>{notice.text}</p>}
        </section>
      )}
      {sceneOpen && (
        <section id={scenePanelId} aria-labelledby={`${scenePanelId}-title`} className={styles.picker}>
          <div className={styles.pickerIntro}>
            <h3 id={`${scenePanelId}-title`}>성경 속 배경</h3>
            <p>장면을 눌러 미리보고, 마음에 들면 홈에 적용해요.</p>
          </div>
          <div className={styles.scenes} role="group" aria-label="선택할 성경 속 배경">
            {bibleAvatarScenes.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={option.id === draftScene.id}
                className={styles.sceneOption}
                onClick={() => {
                  setDraftSceneId(option.id)
                  setNotice(null)
                }}
              >
                <span className={styles.scenePreview}>
                  <Image src={option.thumbnailSrc} alt="" fill sizes="(max-width: 410px) 40vw, 140px" unoptimized />
                </span>
                <span className={styles.sceneOptionTitle}>{option.name}</span>
                <small>{option.reference}</small>
                {option.id === draftScene.id && <span className={styles.check} aria-hidden>✓</span>}
              </button>
            ))}
          </div>
          <div className={styles.selection}>
            <div className={styles.selectionDetails}>
              <strong>{draftScene.name}</strong>
              <span>{draftScene.reference}</span>
            </div>
            <button type="button" onClick={applyScene} className={styles.applyButton} disabled={sceneUnchanged}>
              {sceneUnchanged ? '적용 중인 배경' : '이 배경 적용'}
            </button>
          </div>
          {notice && <p role={notice.error ? 'alert' : 'status'} className={styles.notice} data-error={Boolean(notice.error)}>{notice.text}</p>}
        </section>
      )}
    </div>
  )
}
